const P2PNetwork = require("./p2p-network");

console.log("Testing P2P Network...");

// Create a test network instance
const network = new P2PNetwork({
  deviceId: "test-device-1",
  deviceName: "TestDevice1",
  port: 8889,
});

// Set up event handlers
network.on("started", (networkInfo) => {
  console.log("✅ P2P Network started successfully:", networkInfo);
});

network.on("device-discovered", (deviceInfo) => {
  console.log("✅ Device discovered:", deviceInfo);
});

network.on("peer-connect", (peerId, peer) => {
  console.log("✅ Peer connected:", peerId);
});

network.on("peer-disconnect", (peerId) => {
  console.log("✅ Peer disconnected:", peerId);
});

network.on("clipboard-update", (data) => {
  console.log("✅ Clipboard update received:", data);
});

// Start the network
try {
  network.start();

  // Test clipboard broadcast
  setTimeout(() => {
    console.log("Testing clipboard broadcast...");
    const testMessage = {
      type: "clipboard-update",
      content: "Test clipboard content",
      deviceId: "test-device-1",
      deviceName: "TestDevice1",
      timestamp: new Date().toISOString(),
    };

    const successCount = network.broadcastToAllPeers(testMessage);
    console.log(`Broadcasted to ${successCount} peers`);
  }, 2000);

  // Stop after 10 seconds
  setTimeout(() => {
    console.log("Stopping test...");
    network.stop();
    process.exit(0);
  }, 10000);
} catch (error) {
  console.error("❌ Failed to start network:", error);
  process.exit(1);
}
