const {
  app,
  BrowserWindow,
  ipcMain,
  globalShortcut,
  clipboard,
  Tray,
  Menu,
} = require("electron");
const path = require("path");
const os = require("os");
const { v4: uuidv4 } = require("uuid");
const P2PNetwork = require("./p2p-network");
const Store = require("electron-store");
const store = new Store();

let mainWindow;
let clipboardWatcher;
let p2pNetwork;
let deviceId = uuidv4();
let deviceName = os.hostname();
let localIP = "127.0.0.1";
let isConnected = false;
let platform = os.platform();
let clipboardMonitoringInitialized = false; // Flag to prevent multiple initializations
let lastReceivedClipboardContent = ""; // Track last received clipboard content to prevent duplicates
let tray = null; // System tray instance

// Create the system tray
function createTray() {
  const iconPath = path.join(__dirname, "assets/icon.png");
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show App",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        }
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setToolTip("Clipboard Sync");
  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });
}

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

  // Handle minimize event - hide to tray instead
  mainWindow.on("minimize", (event) => {
    event.preventDefault();
    mainWindow.hide();
  });
}

// Initialize clipboard monitoring
function initClipboardMonitoring() {
  // Prevent multiple initializations
  if (clipboardMonitoringInitialized) {
    console.log("Clipboard monitoring already initialized, skipping...");
    return;
  }

  // Prevent multiple intervals
  if (clipboardWatcher) {
    clearInterval(clipboardWatcher);
  }

  let lastClipboardContent = "";
  let lastLocalClipboardContent = ""; // Track last local clipboard content for UI updates

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

        // Only broadcast if content actually changed
        if (p2pNetwork && p2pNetwork.sendClipboardUpdate(currentContent)) {
          broadcastClipboardChange(currentContent);
        }

        // Only update UI if content is different from last local update
        if (currentContent !== lastLocalClipboardContent) {
          lastLocalClipboardContent = currentContent;
          // Update UI
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send("clipboard-changed", {
              content: currentContent,
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    } catch (error) {
      console.error("Error reading clipboard:", error);
    }
  }, 1000);

  clipboardMonitoringInitialized = true;
  console.log("Clipboard monitoring initialized successfully");
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

    // Don't update if we already have the same content
    if (content === lastReceivedClipboardContent) {
      console.log(`Ignoring duplicate clipboard content from ${senderName}`);
      return;
    }

    console.log(
      `Received clipboard from ${senderName}:`,
      content.substring(0, 50) + "..."
    );

    // Update last received content
    lastReceivedClipboardContent = content;

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

    p2pNetwork.on("device-removed", (deviceId) => {
      console.log("Device removed:", deviceId);

      // Update UI
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("device-removed", deviceId);
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
  // Ensure p2pNetwork is initialized
  if (!p2pNetwork) {
    console.log("get-peers called, initializing p2pNetwork...");
    startNetworkDiscovery();
    // Wait a bit for initialization and return empty array for now
    return [];
  }

  const peers = p2pNetwork.getConnectedPeers();
  console.log("get-peers called, returning:", peers);
  return peers;
});

ipcMain.handle("get-discovered-devices", () => {
  if (!p2pNetwork) {
    console.log("get-discovered-devices called, initializing p2pNetwork...");
    startNetworkDiscovery();
    return [];
  }
  const devices = p2pNetwork.getDiscoveredDevices();
  return devices;
});

ipcMain.handle("refresh-discovery", () => {
  if (!p2pNetwork) {
    console.log("refresh-discovery called, initializing p2pNetwork...");
    startNetworkDiscovery();
    return { success: true };
  }
  p2pNetwork.refreshDiscovery();
  return { success: true };
});

ipcMain.handle("connect-to-peer", async (event, deviceInfo) => {
  console.log("connect-to-peer called with:", deviceInfo);
  if (!p2pNetwork) {
    console.log("connect-to-peer called, initializing p2pNetwork...");
    startNetworkDiscovery();
    return {
      success: false,
      error: "P2P network initializing, please try again",
    };
  }
  try {
    p2pNetwork.connectToDevice(deviceInfo);
    return { success: true };
  } catch (error) {
    console.error("Failed to connect to peer:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("disconnect-from-peer", async (event, peerId) => {
  console.log("disconnect-from-peer called with:", peerId);
  if (p2pNetwork) {
    try {
      const peerData = p2pNetwork.peers.get(peerId);
      if (peerData && peerData.peer) {
        peerData.peer.destroy();
        p2pNetwork.peers.delete(peerId);
        return { success: true };
      }
      return { success: false, error: "Peer not found" };
    } catch (error) {
      console.error("Failed to disconnect from peer:", error);
      return { success: false, error: error.message };
    }
  }
  return { success: false, error: "P2P network not initialized" };
});

ipcMain.handle("stop-discovery", () => {
  console.log("stop-discovery called");
  if (p2pNetwork) {
    try {
      p2pNetwork.stopDiscovery();
      return { success: true };
    } catch (error) {
      console.error("Failed to stop discovery:", error);
      return { success: false, error: error.message };
    }
  }
  return { success: false, error: "P2P network not initialized" };
});

ipcMain.handle("show-from-tray", () => {
  console.log("show-from-tray called");
  if (mainWindow) {
    mainWindow.show();
    return { success: true };
  }
  return { success: false, error: "Main window not initialized" };
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

ipcMain.handle("write-clipboard", async (event, content) => {
  try {
    clipboard.writeText(content);
    return { success: true };
  } catch (error) {
    console.error("Failed to write to clipboard:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("read-clipboard", async () => {
  try {
    const content = clipboard.readText();
    return { success: true, content };
  } catch (error) {
    console.error("Failed to read clipboard:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("get-network-status", () => {
  return {
    isInitialized: !!p2pNetwork,
    isConnected: isConnected,
    deviceId: deviceId,
    deviceName: deviceName,
    localIP: localIP,
  };
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  createTray();
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
    // Don't reinitialize clipboard monitoring or network discovery
    // They should only be initialized once when the app starts
  }
});

app.on("will-quit", () => {
  // Cleanup
  if (clipboardWatcher) {
    clearInterval(clipboardWatcher);
    clipboardWatcher = null;
  }
  clipboardMonitoringInitialized = false;

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
    clipboardWatcher = null;
  }
  clipboardMonitoringInitialized = false;
});
