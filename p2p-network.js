const SimplePeer = require("simple-peer");
const { EventEmitter } = require("events");
const dgram = require("dgram");
const os = require("os");

// Configure simple-peer to use the WebRTC polyfill
const wrtc = require("@koush/wrtc");

class P2PNetwork extends EventEmitter {
  constructor(options = {}) {
    super();
    this.deviceId = options.deviceId || require("uuid").v4();
    this.deviceName = options.deviceName || os.hostname();
    this.localIP = options.localIP || this.getLocalIP();
    this.port = options.port || 8888;
    this.peers = new Map();
    this.discoveredDevices = new Map(); // Track discovered devices
    this.discoverySocket = null;
    this.isRunning = false;
    this.lastClipboardContent = ""; // Track last clipboard content
    this.presenceInterval = null; // Store interval reference
    this.platform = os.platform(); // Detect platform for optimizations

    // Configure simple-peer options with WebRTC polyfill
    this.peerOptions = {
      wrtc: wrtc,
      trickle: false,
      // Prefer host candidates on LAN
      config: { iceServers: [] },
    };
  }

  getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === "IPv4" && !iface.internal) {
          return iface.address;
        }
      }
    }
    return "127.0.0.1";
  }

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startDiscovery();

    console.log(`P2P Network started on ${this.localIP}:${this.port}`);
    this.emit("started", {
      deviceId: this.deviceId,
      localIP: this.localIP,
      port: this.port,
    });
  }

  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;

    // Stop discovery
    if (this.discoverySocket) {
      this.discoverySocket.close();
      this.discoverySocket = null;
    }

    // Clear presence interval
    if (this.presenceInterval) {
      clearInterval(this.presenceInterval);
      this.presenceInterval = null;
    }

    // Close all peer connections
    this.peers.forEach((peer, peerId) => {
      if (peer.destroy) {
        peer.destroy();
      }
    });
    this.peers.clear();

    // Clear discovered devices
    this.discoveredDevices.clear();

    console.log("P2P Network stopped");
    this.emit("stopped");
  }

  startDiscovery() {
    try {
      // reuseAddr is important on macOS to properly receive multicast/broadcast
      this.discoverySocket = dgram.createSocket({
        type: "udp4",
        reuseAddr: true,
      });

      this.discoverySocket.on("error", (err) => {
        console.error("Discovery socket error:", err);
      });

      this.discoverySocket.on("message", (msg, rinfo) => {
        try {
          const data = JSON.parse(msg.toString());
          this.handleDiscoveryMessage(data, rinfo);
        } catch (error) {
          console.error("Error parsing discovery message:", error);
        }
      });

      // Bind to all interfaces on the discovery port
      this.discoverySocket.bind(this.port, () => {
        try {
          this.discoverySocket.setBroadcast(true);
          this.discoverySocket.setMulticastTTL(128);
          // Enable loopback so we can see local multicast for diagnostics
          if (typeof this.discoverySocket.setMulticastLoopback === "function") {
            this.discoverySocket.setMulticastLoopback(true);
          }
          if (
            typeof this.discoverySocket.setMulticastInterface === "function"
          ) {
            try {
              this.discoverySocket.setMulticastInterface(this.localIP);
              console.log(`Multicast interface set to ${this.localIP}`);
            } catch (e) {
              console.log("Failed to set multicast interface:", e.message);
            }
          }

          // Join multicast group on all IPv4 interfaces explicitly
          const ifaces = this.getIPv4Interfaces();
          try {
            this.discoverySocket.addMembership("224.0.0.1");
            console.log("Joined multicast 224.0.0.1 (default)");
          } catch (e) {
            console.log("Default multicast join failed:", e.message);
          }
          for (const nic of ifaces) {
            try {
              this.discoverySocket.addMembership("224.0.0.1", nic.address);
              console.log(
                `Joined multicast 224.0.0.1 on ${nic.name} (${nic.address})`
              );
            } catch (e) {
              // Some interfaces may not support multicast; ignore
            }
          }

          // Start broadcasting presence
          this.broadcastPresence();

          // Set up periodic presence broadcast (reduced frequency)
          this.presenceInterval = setInterval(() => {
            this.broadcastPresence();
          }, 30000); // Changed from 5000 to 30000 (30 seconds)

          // Improved discovery for cross-platform compatibility
          setTimeout(() => {
            this.improvedDiscovery();
          }, 1000);
        } catch (cfgErr) {
          console.error("Failed to configure discovery socket:", cfgErr);
        }
      });
    } catch (error) {
      console.error("Failed to start discovery:", error);
    }
  }

  broadcastPresence() {
    if (!this.discoverySocket) return;

    const presenceMessage = {
      type: "presence",
      deviceId: this.deviceId,
      deviceName: this.deviceName,
      localIP: this.localIP,
      port: this.port,
      timestamp: Date.now(),
    };

    const message = Buffer.from(JSON.stringify(presenceMessage));

    // Broadcast to limited broadcast
    try {
      this.discoverySocket.send(
        message,
        0,
        message.length,
        this.port,
        "255.255.255.255"
      );
      // console.log(`Presence -> 255.255.255.255:${this.port}`);
    } catch (error) {
      console.error("Failed to broadcast presence (limited):", error);
    }

    // Broadcast to each interface's directed broadcast address
    const ifaces = this.getIPv4Interfaces();
    const sent = new Set();
    for (const nic of ifaces) {
      if (!nic.netmask) continue;
      const bcast = this.computeBroadcastAddress(nic.address, nic.netmask);
      if (!bcast || sent.has(bcast)) continue;
      try {
        this.discoverySocket.send(message, 0, message.length, this.port, bcast);
        sent.add(bcast);
        // console.log(`Presence -> ${bcast}:${this.port}`);
      } catch (_) {}
    }
  }

  getIPv4Interfaces() {
    const list = [];
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === "IPv4" && !iface.internal) {
          list.push({ name, address: iface.address, netmask: iface.netmask });
        }
      }
    }
    return list;
  }

  computeBroadcastAddress(ip, mask) {
    try {
      const ipParts = ip.split(".").map((x) => parseInt(x, 10));
      const maskParts = mask.split(".").map((x) => parseInt(x, 10));
      if (ipParts.length !== 4 || maskParts.length !== 4) return null;
      const bcastParts = [];
      for (let i = 0; i < 4; i++) {
        bcastParts.push((ipParts[i] & maskParts[i]) | (255 ^ maskParts[i]));
      }
      return bcastParts.join(".");
    } catch (_) {
      return null;
    }
  }

  scanLocalSubnet() {
    const local = this.getIPv4Interfaces().find(
      (i) => i.address === this.localIP
    );
    if (!local || !local.netmask) return;

    const ipParts = local.address.split(".").map((x) => parseInt(x, 10));
    // Scan a window of addresses around current host to reduce noise
    const start = Math.max(1, ipParts[3] - 8);
    const end = Math.min(254, ipParts[3] + 8);

    const presenceMessage = {
      type: "presence",
      deviceId: this.deviceId,
      deviceName: this.deviceName,
      localIP: this.localIP,
      port: this.port,
      timestamp: Date.now(),
    };
    const buf = Buffer.from(JSON.stringify(presenceMessage));

    for (let last = start; last <= end; last++) {
      if (last === ipParts[3]) continue; // skip self
      const target = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.${last}`;
      setTimeout(() => {
        try {
          this.discoverySocket.send(buf, 0, buf.length, this.port, target);
        } catch (_) {}
      }, (last - start) * 50);
    }
  }

  handleDiscoveryMessage(data, rinfo) {
    if (data.deviceId === this.deviceId) return; // Ignore our own messages

    switch (data.type) {
      case "presence":
        this.handlePresenceMessage(data, rinfo);
        break;
      case "connect-request":
        this.handleConnectRequest(data, rinfo);
        break;
      case "connect-response":
        this.handleConnectResponse(data, rinfo);
        break;
      default:
        console.log("Unknown discovery message type:", data.type);
    }
  }

  handlePresenceMessage(data, rinfo) {
    if (data.deviceId === this.deviceId) return; // Ignore our own messages

    // Store discovered device with timestamp
    this.discoveredDevices.set(data.deviceId, {
      deviceId: data.deviceId,
      deviceName: data.deviceName,
      localIP: data.localIP,
      remoteIP: rinfo.address,
      port: data.port,
      timestamp: Date.now(),
    });

    console.log(
      `Discovered device: ${data.deviceName} (${data.deviceId}) at ${rinfo.address}`
    );
    this.emit("device-discovered", {
      deviceId: data.deviceId,
      deviceName: data.deviceName,
      localIP: data.localIP,
      remoteIP: rinfo.address,
      port: data.port,
    });
  }

  handleConnectRequest(data, rinfo) {
    console.log(
      `Connection request from ${data.deviceName} (${data.deviceId})`
    );

    // Create peer connection with WebRTC polyfill
    const peer = new SimplePeer({
      initiator: false,
      ...this.peerOptions,
    });

    // Set up peer event handlers immediately
    this.setupPeerEventHandlers(data.deviceId, peer);

    // Store peer immediately (with remote IP) so subsequent steps can find it
    this.peers.set(data.deviceId, {
      peer: peer,
      deviceName: data.deviceName,
      localIP: data.localIP,
      remoteIP: rinfo.address,
      connected: false,
    });

    // Apply the initiator's offer to this responder
    try {
      peer.signal(data.signal);
    } catch (e) {
      console.error("Failed to signal responder peer:", e);
    }

    peer.on("signal", (signal) => {
      // Send connection response with our signal
      const response = {
        type: "connect-response",
        deviceId: this.deviceId,
        deviceName: this.deviceName,
        targetDeviceId: data.deviceId,
        signal: signal,
        timestamp: Date.now(),
      };

      // Reply to the requester's listening port if provided; otherwise fallback to source port
      this.sendMessage(response, rinfo.address, data.port || rinfo.port);
    });

    peer.on("connect", () => {
      console.log(`Connected to ${data.deviceName} (${data.deviceId})`);

      // Update peer data with connected status
      const peerData = this.peers.get(data.deviceId);
      if (peerData) {
        peerData.connected = true;
        this.peers.set(data.deviceId, peerData);
        console.log(`Updated peer ${data.deviceId} to connected status`);
      } else {
        console.error(`Peer ${data.deviceId} not found in peers map!`);
      }

      this.emit("peer-connect", data.deviceId, peer);
    });

    // Peer already stored above
  }

  handleConnectResponse(data, rinfo) {
    console.log(
      `Received connection response from ${data.deviceName} (${data.deviceId}) for target ${data.targetDeviceId}`
    );
    // On the initiator side we stored the peer under the REMOTE device id
    const peerData = this.peers.get(data.deviceId);
    if (!peerData) {
      console.error(`Peer ${data.deviceId} not found for response`);
      return;
    }

    const peer = peerData.peer;
    try {
      peer.signal(data.signal);
    } catch (e) {
      console.error("Failed to signal initiator peer:", e);
    }
  }

  connectToDevice(deviceInfo) {
    console.log(
      `Attempting to connect to ${deviceInfo.deviceName} (${deviceInfo.deviceId})`
    );

    // Create peer connection with WebRTC polyfill
    const peer = new SimplePeer({
      initiator: true,
      ...this.peerOptions,
    });

    // Set up peer event handlers immediately
    this.setupPeerEventHandlers(deviceInfo.deviceId, peer);

    peer.on("signal", (signal) => {
      // Send connection request
      const request = {
        type: "connect-request",
        deviceId: this.deviceId,
        deviceName: this.deviceName,
        targetDeviceId: deviceInfo.deviceId,
        signal: signal,
        port: this.port,
        timestamp: Date.now(),
      };

      this.sendMessage(request, deviceInfo.remoteIP, deviceInfo.port);
    });

    peer.on("connect", () => {
      console.log(
        `Connected to ${deviceInfo.deviceName} (${deviceInfo.deviceId})`
      );

      // Update peer data with connected status
      const peerData = this.peers.get(deviceInfo.deviceId);
      if (peerData) {
        peerData.connected = true;
        this.peers.set(deviceInfo.deviceId, peerData);
        console.log(`Updated peer ${deviceInfo.deviceId} to connected status`);
      } else {
        console.error(`Peer ${deviceInfo.deviceId} not found in peers map!`);
      }

      this.emit("peer-connect", deviceInfo.deviceId, peer);
    });

    // Store peer (include remote IP for reference)
    this.peers.set(deviceInfo.deviceId, {
      peer: peer,
      deviceName: deviceInfo.deviceName,
      localIP: deviceInfo.localIP,
      remoteIP: deviceInfo.remoteIP,
      connected: false,
    });
  }

  setupPeerEventHandlers(peerId, peer) {
    // Extra diagnostics
    peer.on("signal", (signal) => {
      try {
        const t =
          typeof signal === "object" && signal
            ? signal.type || Object.keys(signal)[0]
            : typeof signal;
        console.log(`Peer ${peerId} signal generated:`, t);
      } catch (_) {}
    });

    peer.on("data", (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handlePeerMessage(peerId, message);
      } catch (error) {
        console.error("Error parsing peer message:", error);
      }
    });

    peer.on("close", () => {
      console.log(`Peer ${peerId} disconnected`);
      const peerData = this.peers.get(peerId);
      if (peerData) {
        peerData.connected = false;
        this.emit("peer-disconnect", peerId);
      }

      // Remove from discovered devices when peer disconnects
      this.discoveredDevices.delete(peerId);
      this.emit("device-removed", peerId);
    });

    peer.on("error", (error) => {
      console.error(`Peer ${peerId} error:`, error);
      this.emit("peer-error", peerId, error);

      // Remove from discovered devices on error
      this.discoveredDevices.delete(peerId);
      this.emit("device-removed", peerId);
    });
  }

  handlePeerMessage(peerId, message) {
    switch (message.type) {
      case "clipboard-update":
        this.emit("clipboard-update", {
          content: message.content,
          deviceId: message.deviceId,
          deviceName: message.deviceName,
          timestamp: message.timestamp,
        });
        break;
      default:
        console.log("Unknown peer message type:", message.type);
    }
  }

  sendToPeer(peerId, message) {
    const peerData = this.peers.get(peerId);
    if (!peerData || !peerData.connected) {
      console.error(`Peer ${peerId} not connected`);
      return false;
    }

    try {
      peerData.peer.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`Failed to send to peer ${peerId}:`, error);
      return false;
    }
  }

  broadcastToAllPeers(message) {
    let successCount = 0;
    this.peers.forEach((peerData, peerId) => {
      if (this.sendToPeer(peerId, message)) {
        successCount++;
      }
    });
    return successCount;
  }

  sendMessage(message, address, port) {
    if (!this.discoverySocket) return;

    try {
      const messageBuffer = Buffer.from(JSON.stringify(message));
      this.discoverySocket.send(
        messageBuffer,
        0,
        messageBuffer.length,
        port,
        address
      );
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  }

  getConnectedPeers() {
    const connectedPeers = [];
    console.log(
      "getConnectedPeers called, total peers stored:",
      this.peers.size
    );

    this.peers.forEach((peerData, peerId) => {
      console.log(`Peer ${peerId}:`, peerData);
      if (peerData.connected) {
        connectedPeers.push({
          id: peerId,
          deviceName: peerData.deviceName,
          localIP: peerData.localIP,
          connected: peerData.connected,
        });
      }
    });

    console.log("Returning connected peers:", connectedPeers);
    return connectedPeers;
  }

  getPeerCount() {
    let connectedCount = 0;
    this.peers.forEach((peerData, peerId) => {
      if (peerData.connected) {
        connectedCount++;
      }
    });
    return connectedCount;
  }

  isConnected() {
    return this.peers.size > 0;
  }

  // New method to send clipboard data only when it changes
  sendClipboardUpdate(content) {
    if (content === this.lastClipboardContent) {
      return false; // No change, don't send
    }

    this.lastClipboardContent = content;
    return true; // Content changed, should send
  }

  // New method to get discovered devices
  getDiscoveredDevices() {
    const now = Date.now();
    const devices = [];

    // Clean up stale devices (older than 2 minutes)
    for (const [deviceId, device] of this.discoveredDevices.entries()) {
      if (now - device.timestamp > 120000) {
        // 2 minutes
        this.discoveredDevices.delete(deviceId);
        this.emit("device-removed", deviceId);
      } else {
        devices.push(device);
      }
    }

    return devices;
  }

  // New method to manually refresh discovery
  refreshDiscovery() {
    this.broadcastPresence();
    this.improvedDiscovery();
  }
  
  // New method to stop discovery
  stopDiscovery() {
    console.log("Stopping device discovery...");
    // Clear the presence interval to stop broadcasting
    if (this.presenceInterval) {
      clearInterval(this.presenceInterval);
      this.presenceInterval = null;
    }
    
    // Close the discovery socket to stop receiving broadcasts
    if (this.discoverySocket) {
      try {
        this.discoverySocket.close();
        this.discoverySocket = null;
        console.log("Discovery socket closed");
      } catch (error) {
        console.error("Error closing discovery socket:", error);
      }
    }
  }

  // New method to test all peer connections
  testAllPeerConnections() {
    console.log("Testing all peer connections...");
    this.peers.forEach((peerData, peerId) => {
      if (peerData.connected) {
        console.log(`Peer ${peerId} (${peerData.deviceName}) is connected`);
      } else {
        console.log(`Peer ${peerId} (${peerData.deviceName}) is not connected`);
      }
    });
  }

  // New improved discovery method for better cross-platform compatibility
  improvedDiscovery() {
    const ifaces = this.getIPv4Interfaces();

    // Send presence to common network ranges and discovered devices
    ifaces.forEach((iface) => {
      if (!iface.netmask) return;

      // Send to common network addresses
      const networkParts = this.getNetworkAddress(iface.address, iface.netmask);
      if (networkParts) {
        // Send to .1 (router), .2, .254 (common addresses)
        const commonAddresses = [1, 2, 254];
        commonAddresses.forEach((lastOctet) => {
          const target = `${networkParts[0]}.${networkParts[1]}.${networkParts[2]}.${lastOctet}`;
          if (target !== iface.address) {
            this.sendPresenceTo(target);
          }
        });
      }
    });

    // Platform-specific optimizations
    if (this.platform === "darwin") {
      // macOS: Additional discovery methods for better compatibility
      this.macOSDiscovery(ifaces);
    }

    // Also do a quick subnet scan for better discovery
    this.scanLocalSubnet();
  }

  // macOS-specific discovery optimizations
  macOSDiscovery(ifaces) {
    ifaces.forEach((iface) => {
      if (!iface.netmask) return;

      const networkParts = this.getNetworkAddress(iface.address, iface.netmask);
      if (networkParts) {
        // macOS often has firewall issues with broadcast, so send to more specific addresses
        const additionalAddresses = [10, 20, 50, 100, 150, 200];
        additionalAddresses.forEach((lastOctet) => {
          const target = `${networkParts[0]}.${networkParts[1]}.${networkParts[2]}.${lastOctet}`;
          if (target !== iface.address) {
            this.sendPresenceTo(target);
          }
        });
      }
    });
  }

  // Helper method to get network address
  getNetworkAddress(ip, mask) {
    try {
      const ipParts = ip.split(".").map((x) => parseInt(x, 10));
      const maskParts = mask.split(".").map((x) => parseInt(x, 10));
      if (ipParts.length !== 4 || maskParts.length !== 4) return null;

      const networkParts = [];
      for (let i = 0; i < 4; i++) {
        networkParts.push(ipParts[i] & maskParts[i]);
      }
      return networkParts;
    } catch (_) {
      return null;
    }
  }

  // Helper method to send presence to specific address
  sendPresenceTo(address) {
    if (!this.discoverySocket) return;

    const presenceMessage = {
      type: "presence",
      deviceId: this.deviceId,
      deviceName: this.deviceName,
      localIP: this.localIP,
      port: this.port,
      timestamp: Date.now(),
    };

    try {
      const message = Buffer.from(JSON.stringify(presenceMessage));
      this.discoverySocket.send(message, 0, message.length, this.port, address);
    } catch (_) {}
  }
}

module.exports = P2PNetwork;
