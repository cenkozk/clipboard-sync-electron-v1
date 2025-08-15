@echo off
echo 🚀 Building SyncClip for Windows...
echo.

echo 📦 Installing dependencies...
npm install

echo 🔨 Building Next.js app...
npm run build

echo 🪟 Building Windows executable...
npm run build:win

echo ✅ Build completed! Check the 'dist' folder for your .exe file.
pause
