const P2PNetwork = require('./p2p-network');

console.log('🧪 Testing Real P2P Network...\n');

// Create a test network instance
const network = new P2PNetwork({
  deviceId: 'test-device-1',
  deviceName: 'TestDevice1',
  port: 8889
});

// Set up event handlers
network.on('started', (networkInfo) => {
  console.log('✅ P2P Network started successfully:', networkInfo);
  console.log(`📍 Listening on ${networkInfo.localIP}:${networkInfo.port}\n`);
});

network.on('device-discovered', (deviceInfo) => {
  console.log('🔍 Device discovered:', deviceInfo);
  console.log(`   📱 Name: ${deviceInfo.deviceName}`);
  console.log(`   🌐 IP: ${deviceInfo.remoteIP || deviceInfo.localIP}`);
  console.log(`   🆔 ID: ${deviceInfo.deviceId}\n`);
});

network.on('peer-connect', (peerId, peer) => {
  console.log('🔗 Peer connected:', peerId);
  console.log(`   📊 Total peers: ${network.getPeerCount()}`);
  console.log(`   📋 Connected peers:`, network.getConnectedPeers());
});

network.on('peer-disconnect', (peerId) => {
  console.log('❌ Peer disconnected:', peerId);
  console.log(`   📊 Total peers: ${network.getPeerCount()}`);
});

network.on('clipboard-update', (data) => {
  console.log('📋 Clipboard update received:', data);
});

// Start the network
try {
  console.log('🚀 Starting P2P network...');
  network.start();
  
  // Test clipboard broadcast after 5 seconds
  setTimeout(() => {
    console.log('\n📤 Testing clipboard broadcast...');
    const testMessage = {
      type: 'clipboard-update',
      content: 'Test clipboard content from TestDevice1',
      deviceId: 'test-device-1',
      deviceName: 'TestDevice1',
      timestamp: new Date().toISOString()
    };
    
    const successCount = network.broadcastToAllPeers(testMessage);
    console.log(`📡 Broadcasted to ${successCount} peers`);
  }, 5000);
  
  // Show network status every 10 seconds
  const statusInterval = setInterval(() => {
    console.log('\n📊 Network Status:');
    console.log(`   🔗 Total peers stored: ${network.peers.size}`);
    console.log(`   ✅ Connected peers: ${network.getPeerCount()}`);
    console.log(`   📋 Connected peers list:`, network.getConnectedPeers());
  }, 10000);
  
  // Stop after 30 seconds
  setTimeout(() => {
    console.log('\n🛑 Stopping test...');
    clearInterval(statusInterval);
    network.stop();
    process.exit(0);
  }, 30000);
  
} catch (error) {
  console.error('❌ Failed to start network:', error);
  process.exit(1);
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, stopping...');
  network.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, stopping...');
  network.stop();
  process.exit(0);
});
