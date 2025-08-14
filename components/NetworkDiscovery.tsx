"use client";

import { useState, useEffect } from "react";

export default function NetworkDiscovery() {
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<any[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [networkStatus, setNetworkStatus] = useState("idle");

  useEffect(() => {
    // Listen for real device discovery events
    if (window.electronAPI) {
      window.electronAPI.onDeviceDiscovered((deviceInfo: any) => {
        console.log("Real device discovered:", deviceInfo);
        setDiscoveredDevices(prev => {
          // Check if device already exists
          const exists = prev.find(d => d.deviceId === deviceInfo.deviceId);
          if (!exists) {
            return [...prev, {
              deviceId: deviceInfo.deviceId,
              name: deviceInfo.deviceName,
              ip: deviceInfo.remoteIP || deviceInfo.localIP,
              status: "available",
              ...deviceInfo
            }];
          }
          return prev;
        });
      });

      window.electronAPI.onNetworkStarted((networkInfo: any) => {
        console.log("Network started:", networkInfo);
        setNetworkStatus("active");
        setIsScanning(false);
        setScanProgress(100);
      });
    }

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners("device-discovered");
        window.electronAPI.removeAllListeners("network-started");
      }
    };
  }, []);

  const startNetworkScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setNetworkStatus("scanning");
    
    // The real network discovery is handled by the P2P network
    // This just shows progress while waiting for real events
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 90) { // Stop at 90%, let real events complete it
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);
  };

  const connectToDevice = async (deviceInfo: any) => {
    console.log("Connecting to device:", deviceInfo);
    
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.connectToPeer(deviceInfo);
        if (result.success) {
          console.log("Connection initiated successfully");
          // Update device status
          setDiscoveredDevices(prev => 
            prev.map(d => 
              d.deviceId === deviceInfo.deviceId 
                ? { ...d, status: "connecting" }
                : d
            )
          );
        } else {
          console.error("Failed to connect:", result.error);
        }
      } catch (error) {
        console.error("Error connecting to device:", error);
      }
    }
  };

  const getDeviceIcon = (deviceName: string) => {
    if (deviceName.toLowerCase().includes("mac") || deviceName.toLowerCase().includes("macbook")) {
      return "🍎";
    } else if (deviceName.toLowerCase().includes("windows") || deviceName.toLowerCase().includes("pc")) {
      return "🪟";
    } else if (deviceName.toLowerCase().includes("iphone") || deviceName.toLowerCase().includes("ipad")) {
      return "📱";
    } else if (deviceName.toLowerCase().includes("android")) {
      return "🤖";
    }
    return "💻";
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Network Discovery
        </h2>
        <button
          onClick={startNetworkScan}
          disabled={isScanning}
          className={`btn-sm ${
            isScanning ? "btn-secondary cursor-not-allowed" : "btn-primary"
          }`}
        >
          {isScanning ? (
            <>
              <svg
                className="w-4 h-4 mr-2 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Scanning...
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Scan Network
            </>
          )}
        </button>
      </div>

      {/* Scanning Progress */}
      {isScanning && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>
              {networkStatus === "scanning" ? "Scanning local network..." : "Network active, discovering devices..."}
            </span>
            <span>{scanProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-200 ease-out"
              style={{ width: `${scanProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Discovered Devices */}
      {discoveredDevices.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Discovered Devices ({discoveredDevices.length})
          </h3>
          {discoveredDevices.map((device) => (
            <div key={device.deviceId} className="device-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center text-lg">
                    {getDeviceIcon(device.name)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {device.name}
                    </p>
                    <p className="text-xs text-gray-500">{device.ip}</p>
                  </div>
                </div>
                <button
                  onClick={() => connectToDevice(device)}
                  disabled={device.status === "connecting"}
                  className={`btn-sm ${
                    device.status === "connecting" 
                      ? "btn-secondary cursor-not-allowed" 
                      : "btn-success"
                  }`}
                >
                  {device.status === "connecting" ? "Connecting..." : "Connect"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Network Information */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Network Information
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Network Type:</span>
            <span className="text-gray-900">Local Area Network (LAN)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Discovery Method:</span>
            <span className="text-gray-900">Real P2P Network</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Security:</span>
            <span className="text-gray-900">End-to-End Encrypted</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Status:</span>
            <span className={`font-medium ${
              networkStatus === "active" ? "text-success-600" : 
              networkStatus === "scanning" ? "text-warning-600" : 
              "text-gray-600"
            }`}>
              {networkStatus === "active" ? "Active" : 
               networkStatus === "scanning" ? "Scanning" : 
               "Idle"}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-2">
          <svg
            className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium">Tip:</p>
            <p>
              {networkStatus === "active" 
                ? "Network is active! Devices will be discovered automatically. Make sure other devices are running the app on the same network."
                : "Click 'Scan Network' to start discovering devices on your local network. Make sure all devices are on the same WiFi network."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
