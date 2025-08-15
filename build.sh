#!/bin/bash

echo "🚀 Building SyncClip for macOS..."
echo

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building Next.js app..."
npm run build

echo "🍎 Building macOS DMG..."
npm run build:mac

echo "✅ Build completed! Check the 'dist' folder for your .dmg file."
