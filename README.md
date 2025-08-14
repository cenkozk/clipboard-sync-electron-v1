# Clipboard Sync - Cross-Platform P2P Synchronization

A powerful cross-platform clipboard synchronization application that automatically syncs your clipboard across devices on your local network using peer-to-peer connections.

## 🚀 Features

- **Cross-Platform Support**: Works on Windows, macOS, and Linux
- **Automatic Discovery**: Automatically detects devices on your LAN
- **Peer-to-Peer**: Direct device-to-device connections for fast, secure sync
- **Real-time Sync**: Instant clipboard synchronization across all connected devices
- **Local Network Only**: Secure, private synchronization within your LAN
- **Modern UI**: Beautiful, responsive interface built with React and Tailwind CSS
- **Clipboard History**: Track and manage your clipboard history
- **Device Management**: View and manage connected peer devices

## 🛠️ Technology Stack

- **Frontend**: React 18 + Next.js 14 + TypeScript
- **Styling**: Tailwind CSS
- **Desktop App**: Electron
- **P2P Networking**: Simple Peer + Node DataChannel
- **Clipboard Access**: Clipboardy (cross-platform clipboard library)
- **Network Discovery**: Automatic LAN device detection

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Git

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd clipboard-sync-electron-v1
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Development Mode

```bash
# Start the development server
npm run dev
```

This will:

- Start the Next.js development server on port 3000
- Launch the Electron app
- Open the app window

### 4. Build for Production

```bash
# Build the Next.js app
npm run build

# Build the Electron app
npm run electron:build
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
NODE_ENV=development
```

### Network Configuration

The app automatically detects your local network and discovers other devices. Make sure:

1. All devices are on the same WiFi network
2. Firewall allows the app to communicate on the local network
3. Network discovery is enabled on your system

## 📱 Usage

### Starting the App

1. Run the app on each device you want to sync
2. The app will automatically scan your local network
3. Discovered devices will appear in the "Network Discovery" section
4. Click "Connect" to establish a P2P connection
5. Your clipboard will automatically sync across all connected devices

### Manual Connection

If automatic discovery doesn't work:

1. Click "Add Peer Manually" in the Connected Peers section
2. Enter the device's IP address or hostname
3. Click "Connect"

### Global Shortcuts

- `Ctrl+Shift+V` (Windows/Linux) or `Cmd+Shift+V` (macOS): Toggle clipboard sync

## 🏗️ Project Structure

```
clipboard-sync-electron-v1/
├── app/                    # Next.js app directory
│   ├── components/        # React components
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # Shared components
├── main.js               # Electron main process
├── preload.js            # Electron preload script
├── package.json          # Dependencies and scripts
├── next.config.js        # Next.js configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── README.md             # This file
```

## 🔒 Security Features

- **End-to-End Encryption**: All clipboard data is encrypted between devices
- **Local Network Only**: No data leaves your local network
- **Peer-to-Peer**: Direct connections without central servers
- **No Cloud Storage**: Your clipboard data stays private

## 🐛 Troubleshooting

### Common Issues

1. **Devices not discovered**

   - Ensure all devices are on the same WiFi network
   - Check firewall settings
   - Try manual connection with IP address

2. **Clipboard not syncing**

   - Verify devices are connected
   - Check clipboard permissions
   - Restart the app on all devices

3. **Connection errors**
   - Check network connectivity
   - Verify no antivirus is blocking the app
   - Try disabling VPN if active

### Debug Mode

Enable debug logging by running:

```bash
DEBUG=* npm run dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Electron team for the desktop app framework
- Next.js team for the React framework
- Tailwind CSS team for the utility-first CSS framework
- Simple Peer for P2P networking capabilities

## 📞 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Search existing issues on GitHub
3. Create a new issue with detailed information

## 🔄 Updates

The app will automatically check for updates when connected to the internet. You can also manually check for updates in the app settings.

---

**Note**: This app is designed for local network use only. It does not sync with cloud services or external servers.
