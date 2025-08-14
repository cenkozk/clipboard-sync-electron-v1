const SimplePeer = require("simple-peer");
const { EventEmitter } = require("events");
const dgram = require("dgram");
const os = require("os");

class P2PNetwork extends EventEmitter {
  constructor(options = {}) {
    super();
    this.deviceId = options.deviceId || require("uuid").v4();
    this.deviceName = options.deviceName || os.hostname();
    this.localIP = options.localIP || this.getLocalIP();
    this.port = options.port || 8888;
    this.peers = new Map();
    this.discoverySocket = null;
    this.isRunning = false;
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

    // Close all peer connections
    this.peers.forEach((peer, peerId) => {
      if (peer.destroy) {
        peer.destroy();
      }
    });
    this.peers.clear();

    console.log("P2P Network stopped");
    this.emit("stopped");
  }

  startDiscovery() {
    try {
      this.discoverySocket = dgram.createSocket("udp4");

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

      // Bind to port
      this.discoverySocket.bind(this.port, () => {
        this.discoverySocket.setBroadcast(true);
        this.discoverySocket.setMulticastTTL(128);

        // Join multicast group for local network discovery
        this.discoverySocket.addMembership("224.0.0.1");

        // Start broadcasting presence
        this.broadcastPresence();

        // Set up periodic presence broadcast
        setInterval(() => {
          this.broadcastPresence();
        }, 5000);
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

    // Broadcast to local network
    try {
      this.discoverySocket.send(
        message,
        0,
        message.length,
        this.port,
        "255.255.255.255"
      );
    } catch (error) {
      console.error("Failed to broadcast presence:", error);
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

    // Create peer connection
    const peer = new SimplePeer({ initiator: false, trickle: false });

    // Set up peer event handlers immediately
    this.setupPeerEventHandlers(data.deviceId, peer);

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

      this.sendMessage(response, rinfo.address, rinfo.port);
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

    // Store peer temporarily
    this.peers.set(data.deviceId, {
      peer: peer,
      deviceName: data.deviceName,
      localIP: data.localIP,
      connected: false,
    });
  }

  handleConnectResponse(data, rinfo) {
    const peerData = this.peers.get(data.targetDeviceId);
    if (!peerData) return;

    const peer = peerData.peer;
    peer.signal(data.signal);
  }

  connectToDevice(deviceInfo) {
    console.log(
      `Attempting to connect to ${deviceInfo.deviceName} (${deviceInfo.deviceId})`
    );

    // Create peer connection
    const peer = new SimplePeer({ initiator: true, trickle: false });

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

    // Store peer temporarily
    this.peers.set(deviceInfo.deviceId, {
      peer: peer,
      deviceName: deviceInfo.deviceName,
      localIP: deviceInfo.localIP,
      connected: false,
    });
  }

  setupPeerEventHandlers(peerId, peer) {
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
    });

    peer.on("error", (error) => {
      console.error(`Peer ${peerId} error:`, error);
      this.emit("peer-error", peerId, error);
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
    console.log("getConnectedPeers called, total peers stored:", this.peers.size);
    
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
}

module.exports = P2PNetwork;
