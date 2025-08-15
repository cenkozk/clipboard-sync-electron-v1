# SyncClip - P2P Clipboard Sync

**Sync your clipboard across devices instantly using peer-to-peer connections on your local network.**

## 🎯 **Ready to Use - No Setup Required!**

**Download and run immediately:**

- **Windows**: `SyncClip.exe` - Just run the executable
- **macOS**: `SyncClip.app` - Drag to Applications folder
- **Linux**: `SyncClip.AppImage` - Make executable and run

## ✨ What It Does

- **Auto-discovers** devices on your WiFi
- **Instantly syncs** clipboard content between devices
- **Works offline** - no internet required
- **Private & secure** - data never leaves your network

## 🚀 Quick Start

### 🎯 **For End Users (Recommended)**

**Download the executable for your platform and run immediately - no setup needed!**

### 🔧 **For Developers**

```bash
git clone <repository-url>
cd clipboard-sync-electron-v1
npm install
npm run dev
```

### 📦 **Build for Distribution**

```bash
# Windows (.exe)
npm run build:win

# macOS (.dmg)
npm run build:mac

# Linux (.AppImage)
npm run build:linux
```

## 💻 How to Use

1. **Run the app** on each device you want to sync
2. **Scan network** to discover other devices
3. **Click connect** to establish sync
4. **Copy anything** - it syncs automatically!

## 🔧 Requirements

- Node.js 18+
- Devices on same WiFi network
- Firewall allows local network access

## 🎯 Features

- **Cross-platform**: Windows, macOS, Linux
- **Real-time sync**: Instant clipboard sharing
- **Smart discovery**: Finds devices automatically
- **Clipboard history**: Track your copied items
- **System tray**: Runs in background
- **Global shortcuts**: Quick access

## 🛠️ Tech Stack

- **Frontend**: React + Next.js + TypeScript
- **Desktop**: Electron
- **Styling**: Tailwind CSS
- **Networking**: WebRTC P2P
- **Discovery**: UDP broadcast

## 📱 Usage Tips

- **Global shortcut**: `Ctrl+Shift+H` to show/hide
- **System tray**: Right-click for options
- **Manual connect**: Use IP address if auto-discovery fails
- **Background mode**: App continues syncing when minimized

## 🐛 Common Issues

**Devices not found?**

- Check firewall settings
- Ensure same WiFi network
- Try manual connection

**Clipboard not syncing?**

- Verify devices are connected
- Check clipboard permissions
- Restart app on all devices

## 📁 Project Structure

```
├── app/           # React components
├── main.js        # Electron main process
├── p2p-network.js # P2P networking
├── preload.js     # Electron preload
└── assets/        # App icons
```

## 🤝 Contributing

1. Fork the repo
2. Create feature branch
3. Make changes
4. Submit PR

## 📄 License

MIT License - see LICENSE file

---

**Note**: Local network only. No cloud sync or external servers.
