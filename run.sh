#!/bin/bash

echo "Starting Clipboard Sync App..."
echo ""
echo "This will:"
echo "1. Install dependencies (if not already installed)"
echo "2. Start the development server"
echo "3. Launch the Electron app"
echo ""
echo "Press Enter to continue..."
read

echo ""
echo "Installing dependencies..."
npm install

echo ""
echo "Starting the app..."
npm run dev

echo ""
echo "App closed. Press Enter to exit..."
read
