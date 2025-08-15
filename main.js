const {
  app,
  BrowserWindow,
  ipcMain,
  globalShortcut,
  clipboard,
} = require("electron");
const path = require("path");
const os = require("os");
const { v4: uuidv4 } = require("uuid");
const P2PNetwork = require("./p2p-network");

let mainWindow;
let clipboardWatcher;
let p2pNetwork;
let deviceId = uuidv4();
let deviceName = os.hostname();
let localIP = "127.0.0.1";
let isConnected = false;
let platform = os.platform();

// Create the main browser window
function createWindow() {
  // Platform-specific window configuration
  // macOS: hiddenInset titleBarStyle, no frame, no thickFrame (native traffic light buttons)
  // Windows/Linux: hidden titleBarStyle, frame enabled, thickFrame enabled (custom controls)
  mainWindow = new BrowserWindow({
    width: 400,
    height: 700,
    minWidth: 400,
    maxWidth: 400,
    minHeight: 600,
    maxHeight: 1200,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "assets/icon.png"),
    title: "Clipboard Sync",
    backgroundColor: "#0a0a0a", // Dark background matching app's bg-950
    titleBarStyle: platform === "darwin" ? "hiddenInset" : "hidden",
    vibrancy: "under-window",
    visualEffectState: "active",
    show: false, // Don't show until ready
    frame: platform !== "darwin", // No frame for macOS, frame for others
    transparent: false,
    resizable: true,
    minimizable: true,
    maximizable: platform !== "darwin", // Disable maximize on macOS
    fullscreenable: platform !== "darwin", // Disable fullscreen on macOS
    hasShadow: true,
    thickFrame: platform !== "darwin",
    roundedCorners: true,
  });

  // Load the Next.js app
  if (process.env.NODE_ENV === "development" || !app.isPackaged) {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "renderer/index.html"));
  }

  // Show window when ready
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Initialize clipboard monitoring
function initClipboardMonitoring() {
  let lastClipboardContent = "";

  clipboardWatcher = setInterval(() => {
    try {
      const currentContent = clipboard.readText();

      if (
        currentContent !== lastClipboardContent &&
        currentContent.trim() !== ""
      ) {
        lastClipboardContent = currentContent;
        console.log(
          "Clipboard changed:",
          currentContent.substring(0, 50) + "..."
        );

        // Broadcast to all connected peers
        broadcastClipboardChange(currentContent);

        // Update UI
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("clipboard-changed", {
            content: currentContent,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error("Error reading clipboard:", error);
    }
  }, 1000);
}

// Broadcast clipboard change to all peers
function broadcastClipboardChange(content) {
  if (p2pNetwork) {
    const message = {
      type: "clipboard-update",
      content: content,
      deviceId: deviceId,
      deviceName: deviceName,
      timestamp: new Date().toISOString(),
    };

    const successCount = p2pNetwork.broadcastToAllPeers(message);
    console.log(`Broadcasted clipboard to ${successCount} peers`);
  }
}

// Handle incoming clipboard updates
function handleClipboardUpdate(data) {
  try {
    const { content, deviceId: senderId, deviceName: senderName } = data;

    // Don't update if it's from ourselves
    if (senderId === deviceId) return;

    console.log(
      `Received clipboard from ${senderName}:`,
      content.substring(0, 50) + "..."
    );

    // Update local clipboard
    clipboard.writeText(content);

    // Update UI
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("clipboard-received", {
        content: content,
        fromDevice: senderName,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Error handling clipboard update:", error);
  }
}

// Network discovery
function startNetworkDiscovery() {
  try {
    // Initialize P2P network
    p2pNetwork = new P2PNetwork({
      deviceId: deviceId,
      deviceName: deviceName,
      port: 8888,
    });

    // Set up event handlers
    p2pNetwork.on("started", (networkInfo) => {
      localIP = networkInfo.localIP;
      console.log("P2P Network started:", networkInfo);
      isConnected = true;

      // Update UI
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("network-started", networkInfo);
      }
    });

    p2pNetwork.on("device-discovered", (deviceInfo) => {
      console.log("Device discovered:", deviceInfo);

      // Update UI
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("device-discovered", deviceInfo);
      }
    });

    p2pNetwork.on("peer-connect", (peerId, peer) => {
      console.log("Peer connected:", peerId);
      isConnected = true;

      // Get peer information from the P2P network
      const peerData = p2pNetwork.peers.get(peerId);
      const deviceName = peerData ? peerData.deviceName : "Unknown";

      // Update UI
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("peer-connected", {
          peerId,
          deviceName: deviceName,
        });
      }
    });

    p2pNetwork.on("peer-disconnect", (peerId) => {
      console.log("Peer disconnected:", peerId);

      // Update UI
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("peer-disconnected", { peerId });
      }
    });

    p2pNetwork.on("clipboard-update", (data) => {
      handleClipboardUpdate(data);
    });

    // Start the P2P network
    p2pNetwork.start();
  } catch (error) {
    console.error("Failed to start network discovery:", error);
  }
}

// IPC handlers for window controls
ipcMain.handle("minimize-window", () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle("maximize-window", () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle("close-window", () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

// IPC handlers
ipcMain.handle("get-device-info", () => {
  const deviceInfo = {
    deviceId,
    deviceName,
    localIP,
    isConnected,
    peerCount: p2pNetwork ? p2pNetwork.getPeerCount() : 0,
    platform,
  };
  console.log("get-device-info called, returning:", deviceInfo);
  return deviceInfo;
});

ipcMain.handle("get-peers", () => {
  if (p2pNetwork) {
    const peers = p2pNetwork.getConnectedPeers();
    console.log("get-peers called, returning:", peers);
    return peers;
  }
  console.log("get-peers called, but p2pNetwork not initialized");
  return [];
});

ipcMain.handle("connect-to-peer", async (event, deviceInfo) => {
  console.log("connect-to-peer called with:", deviceInfo);
  if (p2pNetwork) {
    try {
      p2pNetwork.connectToDevice(deviceInfo);
      return { success: true };
    } catch (error) {
      console.error("Failed to connect to peer:", error);
      return { success: false, error: error.message };
    }
  }
  return { success: false, error: "P2P network not initialized" };
});

ipcMain.handle("disconnect-from-peer", async (event, peerId) => {
  console.log("disconnect-from-peer called with:", peerId);
  if (p2pNetwork) {
    try {
      p2pNetwork.disconnectFromPeer(peerId);
      return { success: true };
    } catch (error) {
      console.error("Failed to disconnect from peer:", error);
      return { success: false, error: error.message };
    }
  }
  return { success: false, error: "P2P network not initialized" };
});

// Optional: expose a simple diagnostic to test peer connectivity states
ipcMain.handle("test-peer-connections", () => {
  if (p2pNetwork && typeof p2pNetwork.testAllPeerConnections === "function") {
    try {
      p2pNetwork.testAllPeerConnections();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  return { success: false, error: "P2P network not initialized" };
});

ipcMain.handle("get-clipboard-history", () => {
  // This would return clipboard history
  return [];
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  initClipboardMonitoring();
  startNetworkDiscovery();

  // Register global shortcuts
  globalShortcut.register("CommandOrControl+Shift+V", () => {
    // Toggle clipboard sync
    isConnected = !isConnected;
    console.log("Clipboard sync toggled:", isConnected);
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("will-quit", () => {
  // Cleanup
  if (clipboardWatcher) {
    clearInterval(clipboardWatcher);
  }

  // Stop P2P network
  if (p2pNetwork) {
    p2pNetwork.stop();
  }

  globalShortcut.unregisterAll();
});

// Handle app quit
app.on("before-quit", () => {
  if (clipboardWatcher) {
    clearInterval(clipboardWatcher);
  }
});
