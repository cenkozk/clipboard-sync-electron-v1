# 🚀 Build Instructions for SyncClip

This guide will help you create optimized DMG (macOS) and EXE (Windows) installer files with minimal file sizes.

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- **Git** (for cloning the repository)

## 🛠️ Quick Build Commands

### For Windows (.exe)

```bash
# Option 1: Use the batch file
build.bat

# Option 2: Manual commands
npm install
npm run build:win
```

### For macOS (.dmg)

```bash
# Option 1: Use the shell script
./build.sh

# Option 2: Manual commands
npm install
npm run build:mac
```

### For Linux (.AppImage)

```bash
npm install
npm run build:linux
```

## 🔧 Build Process Details

The build process includes several optimizations:

1. **Next.js Static Export**: Converts the React app to static files
2. **Electron Builder**: Packages the app with Electron
3. **File Optimization**: Removes unnecessary files and compresses
4. **Icon Integration**: Uses the app icon for all platforms

## 📁 Output Files

After building, check the `dist/` folder for:

- **Windows**: `SyncClip Setup.exe` (NSIS installer)
- **macOS**: `SyncClip.dmg` (DMG disk image)
- **Linux**: `SyncClip.AppImage` (AppImage file)

## 🎯 File Size Optimization

The build configuration includes:

- **Maximum compression** for all files
- **ASAR packaging** for better performance
- **Removed package scripts** and keywords
- **Static file serving** (no server required)
- **Optimized dependencies** inclusion

## 🐛 Troubleshooting

### Common Issues

1. **Build fails**: Ensure all dependencies are installed
2. **Icon not showing**: Check that `assets/icon.png` exists
3. **Large file size**: The optimization script should handle this automatically

### Platform-Specific Notes

- **Windows**: Requires Windows 10/11 for building
- **macOS**: Requires macOS 10.15+ for building
- **Linux**: Works on most Linux distributions

## 🔄 Development vs Production

- **Development**: `npm run dev` (runs Next.js dev server + Electron)
- **Production Build**: `npm run build:win` or `npm run build:mac`
- **Testing**: Use the built executables from the `dist/` folder

## 📊 Expected File Sizes

With optimizations enabled:

- **Windows EXE**: ~50-80 MB
- **macOS DMG**: ~60-90 MB
- **Linux AppImage**: ~55-85 MB

_Sizes may vary based on dependencies and platform-specific requirements._

## 🎉 Success!

Once the build completes, you'll have professional installer files that:

- ✅ Use your app icon
- ✅ Are optimized for small file sizes
- ✅ Work on their respective platforms
- ✅ Include all necessary dependencies
