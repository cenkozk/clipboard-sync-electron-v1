@echo off
echo Starting Clipboard Sync App...
echo.
echo This will:
echo 1. Install dependencies (if not already installed)
echo 2. Start the development server
echo 3. Launch the Electron app
echo.
echo Press any key to continue...
pause >nul

echo.
echo Installing dependencies...
call npm install

echo.
echo Starting the app...
call npm run dev

echo.
echo App closed. Press any key to exit...
pause >nul
