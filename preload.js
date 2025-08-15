const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke("minimize-window"),
  maximizeWindow: () => ipcRenderer.invoke("maximize-window"),
  closeWindow: () => ipcRenderer.invoke("close-window"),

  // Device information
  getDeviceInfo: () => ipcRenderer.invoke("get-device-info"),
  getNetworkStatus: () => ipcRenderer.invoke("get-network-status"),
  getPeers: () => ipcRenderer.invoke("get-peers"),
  getDiscoveredDevices: () => ipcRenderer.invoke("get-discovered-devices"),
  getClipboardHistory: () => ipcRenderer.invoke("get-clipboard-history"),

  // Clipboard operations
  readClipboard: () => ipcRenderer.invoke("read-clipboard"),
  writeClipboard: (content) => ipcRenderer.invoke("write-clipboard", content),

  // Network operations
  connectToPeer: (deviceInfo) =>
    ipcRenderer.invoke("connect-to-peer", deviceInfo),
  disconnectFromPeer: (peerId) =>
    ipcRenderer.invoke("disconnect-from-peer", peerId),
  refreshDiscovery: () => ipcRenderer.invoke("refresh-discovery"),
  stopDiscovery: () => ipcRenderer.invoke("stop-discovery"),
  testPeerConnections: () => ipcRenderer.invoke("test-peer-connections"),

  // System tray operations
  showFromTray: () => ipcRenderer.invoke("show-from-tray"),

  // Event listeners
  onClipboardChanged: (callback) => {
    ipcRenderer.on("clipboard-changed", (event, data) => callback(data));
  },
  onClipboardReceived: (callback) => {
    ipcRenderer.on("clipboard-received", (event, data) => callback(data));
  },
  onPeerConnected: (callback) => {
    ipcRenderer.on("peer-connected", (event, data) => callback(data));
  },
  onPeerDisconnected: (callback) => {
    ipcRenderer.on("peer-disconnected", (event, data) => callback(data));
  },
  onDeviceDiscovered: (callback) => {
    ipcRenderer.on("device-discovered", (event, data) => callback(data));
  },
  onDeviceRemoved: (callback) => {
    ipcRenderer.on("device-removed", (event, data) => callback(data));
  },
  onNetworkStarted: (callback) => {
    ipcRenderer.on("network-started", (event, data) => callback(data));
  },

  // Remove event listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
});
