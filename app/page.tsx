"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Clipboard,
  Users,
  RefreshCw,
  Copy,
  CheckCircle,
  Monitor,
  Smartphone,
  Laptop,
  Server,
  ArrowRightLeft,
  Shield,
  Trash2,
  Download,
  ChevronDown,
  Minus,
  Square,
  X,
} from "lucide-react";

// TypeScript declarations for electronAPI
declare global {
  interface Window {
    electronAPI: {
      minimizeWindow: () => Promise<void>;
      maximizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;
      getDeviceInfo: () => Promise<any>;
      getPeers: () => Promise<any[]>;
      getClipboardHistory: () => Promise<any[]>;
      writeClipboard: (content: string) => Promise<void>;
      connectToPeer: (deviceInfo: any) => Promise<any>;
      onClipboardChanged: (callback: (data: any) => void) => void;
      onClipboardReceived: (callback: (data: any) => void) => void;
      onNetworkStarted: (callback: (data: any) => void) => void;
      onDeviceDiscovered: (callback: (data: any) => void) => void;
      onPeerConnected: (callback: (data: any) => void) => void;
      onPeerDisconnected: (callback: (data: any) => void) => void;
    };
  }
}

interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  localIP: string;
  isConnected: boolean;
  peerCount: number;
}

interface Peer {
  id: string;
  connected: boolean;
  deviceName: string;
  localIP?: string;
}

interface ClipboardItem {
  content: string;
  timestamp: string;
  source: string;
}

interface DiscoveredDevice {
  deviceId: string;
  deviceName: string;
  localIP: string;
  remoteIP: string;
  port: number;
}

const ClipboardSyncApp = () => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [clipboardHistory, setClipboardHistory] = useState<ClipboardItem[]>([]);
  const [discoveredDevices, setDiscoveredDevices] = useState<
    DiscoveredDevice[]
  >([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCopied, setIsCopied] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Refs for element measurements
  const appContainerRef = useRef<HTMLDivElement>(null);

  // Fetch initial data
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getDeviceInfo().then(setDeviceInfo);
      window.electronAPI.getPeers().then(setPeers);
      window.electronAPI.getClipboardHistory().then(setClipboardHistory);
    }

    // Set mounted after a short delay for entrance animations
    setTimeout(() => {
      setMounted(true);
    }, 100);
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (window.electronAPI) {
      // Clipboard events
      window.electronAPI.onClipboardChanged((data: any) => {
        console.log("Clipboard changed:", data);
        setClipboardHistory((prev) => [data, ...prev.slice(0, 19)]);
      });

      window.electronAPI.onClipboardReceived((data: any) => {
        console.log("Clipboard received:", data);
        setClipboardHistory((prev) => [data, ...prev.slice(0, 19)]);
      });

      // Network events
      window.electronAPI.onNetworkStarted((networkInfo: any) => {
        console.log("Network started:", networkInfo);
        if (deviceInfo) {
          setDeviceInfo({ ...deviceInfo, isConnected: true });
        }
      });

      window.electronAPI.onDeviceDiscovered((deviceInfo: any) => {
        console.log("Device discovered:", deviceInfo);
        setDiscoveredDevices((prev) => {
          const exists = prev.find((d) => d.deviceId === deviceInfo.deviceId);
          if (!exists) {
            return [...prev, deviceInfo];
          }
          return prev;
        });
      });

      window.electronAPI.onPeerConnected((data: any) => {
        console.log("Peer connected:", data);
        // Refresh peers list
        window.electronAPI.getPeers().then(setPeers);
      });

      window.electronAPI.onPeerDisconnected((data: any) => {
        console.log("Peer disconnected:", data);
        // Refresh peers list
        window.electronAPI.getPeers().then(setPeers);
      });
    }
  }, [deviceInfo]);

  // Periodic refresh of peers
  useEffect(() => {
    const interval = setInterval(() => {
      if (window.electronAPI) {
        window.electronAPI.getPeers().then(setPeers);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const refreshPeers = async () => {
    if (window.electronAPI) {
      setIsRefreshing(true);
      try {
        const newPeers = await window.electronAPI.getPeers();
        setPeers(newPeers);
      } catch (error) {
        console.error("Failed to refresh peers:", error);
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const startNetworkScan = () => {
    setIsScanning(true);
    setScanProgress(0);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const connectToDevice = async (device: DiscoveredDevice) => {
    if (window.electronAPI) {
      try {
        await window.electronAPI.connectToPeer(device);
        console.log("Connection initiated to:", device.deviceName);
      } catch (error) {
        console.error("Failed to connect:", error);
      }
    }
  };

  const copyToClipboard = async (content: string) => {
    if (window.electronAPI) {
      try {
        await window.electronAPI.writeClipboard(content);
        setIsCopied(content);
        setTimeout(() => setIsCopied(null), 2000);
        console.log("Content copied to clipboard");
      } catch (error) {
        console.error("Failed to copy to clipboard:", error);
      }
    }
  };

  const clearClipboardHistory = () => {
    setClipboardHistory([]);
  };

  const exportClipboardHistory = () => {
    const dataStr = JSON.stringify(clipboardHistory, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "clipboard-history.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  const getDeviceIcon = (deviceName: string) => {
    const name = deviceName.toLowerCase();
    if (name.includes("mac") || name.includes("apple"))
      return <Monitor className="w-5 h-5" />;
    if (name.includes("windows") || name.includes("pc"))
      return <Laptop className="w-5 h-5" />;
    if (name.includes("phone") || name.includes("mobile"))
      return <Smartphone className="w-5 h-5" />;
    return <Server className="w-5 h-5" />;
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden transition-colors duration-300">
      {/* Import Outfit font */}
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap");

        * {
          font-family: "Outfit", sans-serif;
        }

        /* Animations */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 0.9;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        @keyframes ripple {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .fadeIn {
          animation: fadeIn 0.5s ease forwards;
        }

        .shimmer {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.1) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }

        /* Customize scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(16, 185, 129, 0.05);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.3);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.5);
        }

        /* Window styling */
        body {
          -webkit-app-region: no-drag;
          user-select: none;
        }

        /* Make title bar draggable */
        .title-bar {
          -webkit-app-region: drag;
        }

        /* Make content areas non-draggable */
        button,
        input,
        textarea,
        [role="button"],
        .no-drag {
          -webkit-app-region: no-drag;
          user-select: text;
        }

        /* Remove focus rings from all elements */
        *:focus {
          outline: none !important;
          box-shadow: none !important;
        }

        /* Remove focus rings from buttons specifically */
        button:focus,
        button:focus-visible {
          outline: none !important;
          box-shadow: none !important;
          ring: none !important;
        }

        /* Remove focus rings from inputs and other form elements */
        input:focus,
        textarea:focus,
        select:focus {
          outline: none !important;
          box-shadow: none !important;
        }
      `}</style>

      {/* Background gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full filter blur-[120px] bg-emerald-600/10 dark:bg-emerald-700/10 translate-y-1/4 translate-x-1/3"></div>
        <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full filter blur-[120px] bg-emerald-500/10 dark:bg-emerald-800/10 -translate-y-1/4 -translate-x-1/3"></div>
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] rounded-full filter blur-[100px] bg-emerald-400/5 dark:bg-emerald-600/5 -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      <div
        ref={appContainerRef}
        className="w-full max-w-7xl mx-auto px-4 py-4 sm:py-6 relative z-10"
      >
        {/* Custom Title Bar */}
        <div className="fixed top-0 left-0 right-0 h-14 bg-gray-950/90 backdrop-blur-xl border-b border-gray-800/50 z-50 flex items-center justify-between px-4 title-bar">
          {/* App Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-400/80 to-emerald-600/80 shadow-lg backdrop-blur-sm border border-emerald-500/30">
              <ArrowRightLeft className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-600">
              SyncClip
            </h1>
          </div>

          {/* Window Controls */}
          <div className="flex items-center gap-1.5 no-drag">
            <button
              onClick={() => window.electronAPI?.minimizeWindow()}
              className="w-8 h-8 rounded-md bg-gray-800/60 hover:bg-gray-700/60 text-gray-400 hover:text-emerald-400 transition-all duration-200 flex items-center justify-center group hover:scale-105 no-drag"
              title="Minimize"
            >
              <Minus className="w-3.5 h-3.5 group-hover:text-emerald-400 transition-colors" />
            </button>
            <button
              onClick={() => window.electronAPI?.maximizeWindow()}
              className="w-8 h-8 rounded-md bg-gray-800/60 hover:bg-gray-700/60 text-gray-400 hover:text-emerald-400 transition-all duration-200 flex items-center justify-center group hover:scale-105 no-drag"
              title="Maximize"
            >
              <Square className="w-3 h-3 group-hover:text-emerald-400 transition-colors" />
            </button>
            <button
              onClick={() => window.electronAPI?.closeWindow()}
              className="w-8 h-8 rounded-md bg-gray-800/60 hover:bg-red-500/80 text-gray-400 hover:text-white transition-all duration-200 flex items-center justify-center group hover:scale-105 no-drag"
              title="Close"
            >
              <X className="w-3.5 h-3.5 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>
        {/* App Content with top margin for title bar */}
        <div className="mt-14">
          {/* Custom Title Bar */}

          {/* Main Content */}
          <div
            className={`grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 transition-all duration-500 transform ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: "200ms" }}
          >
            {/* Left Column - Device Info & Discovery */}
            <div className="space-y-4 sm:space-y-6">
              {/* Device Info Card */}
              <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl p-4 border border-gray-200/30 dark:border-gray-700/30 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                      <Monitor className="w-4 h-4" />
                    </div>
                    <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                      Your Device
                    </h2>
                  </div>
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      deviceInfo?.isConnected ? "bg-emerald-500" : "bg-red-500"
                    }`}
                    style={{
                      animation: deviceInfo?.isConnected
                        ? "pulse 2s infinite"
                        : "none",
                    }}
                  ></div>
                </div>

                {deviceInfo ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Device Name
                      </span>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {deviceInfo.deviceName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Local IP
                      </span>
                      <span className="text-xs font-mono text-gray-800 dark:text-gray-200">
                        {deviceInfo.localIP}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Status
                      </span>
                      <div className="flex items-center gap-1.5">
                        {deviceInfo.isConnected ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                            Connected
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                            Disconnected
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Connected Peers
                      </span>
                      <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                        {deviceInfo.peerCount}
                      </span>
                    </div>

                    {/* Device ID (expandable) */}
                    <details className="group pt-1">
                      <summary className="cursor-pointer list-none">
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                          <span>Device ID</span>
                          <ChevronDown className="w-3 h-3 transition-transform group-open:rotate-180" />
                        </div>
                      </summary>
                      <div className="mt-2 p-2 bg-gray-100/70 dark:bg-gray-800/70 rounded-lg">
                        <code className="text-xs text-gray-700 dark:text-gray-300 break-all select-all">
                          {deviceInfo.deviceId}
                        </code>
                      </div>
                    </details>
                  </div>
                ) : (
                  <div className="animate-pulse space-y-4">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                )}
              </div>

              {/* Network Discovery Card */}
              <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl p-4 border border-gray-200/30 dark:border-gray-700/30 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                      <Users className="w-4 h-4" />
                    </div>
                    <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                      Device Discovery
                    </h2>
                  </div>
                  <button
                    onClick={startNetworkScan}
                    disabled={isScanning}
                    className="text-xs px-2 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-800/30 disabled:opacity-50 transition-colors"
                  >
                    {isScanning ? "Scanning..." : "Scan Network"}
                  </button>
                </div>

                <div className="space-y-3">
                  {isScanning && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">
                          Scanning network
                        </span>
                        <span className="text-gray-700 dark:text-gray-300">
                          {scanProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${scanProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Discovered Devices */}
                  {discoveredDevices.length > 0 ? (
                    <div className="space-y-2">
                      <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Discovered Devices
                      </h3>
                      <div className="max-h-[180px] overflow-y-auto pr-1 space-y-2">
                        {discoveredDevices.map((device) => (
                          <div
                            key={device.deviceId}
                            className="flex items-center justify-between p-2 bg-gray-100/70 dark:bg-gray-800/70 rounded-lg border border-gray-200/50 dark:border-gray-700/50"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {getDeviceIcon(device.deviceName)}
                              <div className="truncate">
                                <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                                  {device.deviceName}
                                </p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                  {device.remoteIP}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => connectToDevice(device)}
                              className="ml-2 text-[10px] px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-medium transition-colors"
                            >
                              Connect
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        No devices found
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                        Click "Scan Network" to discover devices
                      </p>
                    </div>
                  )}

                  {/* Network Info */}
                  <div className="pt-3 border-t border-gray-200/50 dark:border-gray-700/50 mt-3">
                    <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Network Information
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">
                          Type
                        </span>
                        <span className="text-gray-700 dark:text-gray-300">
                          LAN
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">
                          Method
                        </span>
                        <span className="text-gray-700 dark:text-gray-300">
                          P2P
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">
                          Security
                        </span>
                        <span className="text-gray-700 dark:text-gray-300">
                          WebRTC
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">
                          Auto-Connect
                        </span>
                        <span className="text-gray-700 dark:text-gray-300">
                          Enabled
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle and Right Columns - Clipboard History & Peers */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Connected Peers Card */}
              <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl p-4 border border-gray-200/30 dark:border-gray-700/30 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                      <Users className="w-4 h-4" />
                    </div>
                    <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                      Connected Peers
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={refreshPeers}
                      disabled={isRefreshing}
                      className="text-xs flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${
                          isRefreshing ? "animate-spin" : ""
                        }`}
                      />
                      Refresh
                    </button>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                      <span className="text-xs font-medium">
                        {peers.length}
                      </span>
                    </div>
                  </div>
                </div>

                {peers.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No peers connected
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Discover and connect to devices on your network
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {peers.map((peer) => (
                      <div
                        key={peer.id}
                        className="p-3 bg-gray-100/70 dark:bg-gray-800/70 rounded-lg border border-gray-200/50 dark:border-gray-700/50 transition-all hover:shadow-md"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                peer.connected ? "bg-emerald-500" : "bg-red-500"
                              }`}
                              style={{
                                animation: peer.connected
                                  ? "pulse 2s infinite"
                                  : "none",
                              }}
                            ></div>
                            <div>
                              <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                                {peer.deviceName}
                              </p>
                              {peer.localIP && (
                                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                  {peer.localIP}
                                </p>
                              )}
                            </div>
                          </div>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                              peer.connected
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            }`}
                          >
                            {peer.connected ? "Connected" : "Disconnected"}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button className="flex-1 text-[10px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium py-1 px-2 rounded border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                            View Details
                          </button>
                          <button className="flex-1 text-[10px] text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium py-1 px-2 rounded border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            Disconnect
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Clipboard History Card */}
              <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl p-4 border border-gray-200/30 dark:border-gray-700/30 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                      <Clipboard className="w-4 h-4" />
                    </div>
                    <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                      Clipboard History
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={clearClipboardHistory}
                      className="text-xs flex items-center gap-1 px-2 py-1 rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear
                    </button>
                    <button
                      onClick={exportClipboardHistory}
                      className="text-xs flex items-center gap-1 px-2 py-1 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      Export
                    </button>
                  </div>
                </div>

                {clipboardHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <Clipboard className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No clipboard history
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Copy something to see it appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {clipboardHistory.map((item, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-100/70 dark:bg-gray-800/70 rounded-lg border border-gray-200/50 dark:border-gray-700/50 transition-all hover:shadow-md"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                item.source === "Local Copy"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                              }`}
                            >
                              {item.source}
                            </span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">
                              {formatTime(item.timestamp)}
                            </span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(item.content)}
                            className={`p-1 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors rounded ${
                              isCopied === item.content
                                ? "text-emerald-600 dark:text-emerald-400"
                                : ""
                            }`}
                            title="Copy to clipboard"
                          >
                            {isCopied === item.content ? (
                              <CheckCircle className="w-3.5 h-3.5" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          <p className="text-xs text-gray-800 dark:text-gray-200 break-words">
                            {truncateContent(item.content, 150)}
                          </p>
                          {item.content.length > 150 && (
                            <details className="group">
                              <summary className="cursor-pointer list-none text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-[10px]">
                                Show full content
                              </summary>
                              <div className="mt-2 p-2 bg-gray-200/70 dark:bg-gray-700/70 rounded-md">
                                <p className="text-xs text-gray-800 dark:text-gray-200 break-words whitespace-pre-wrap">
                                  {item.content}
                                </p>
                              </div>
                            </details>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer
            className={`mt-6 text-center transition-all duration-500 transform ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: "300ms" }}
          >
            <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl p-2 border border-gray-200/30 dark:border-gray-700/30">
              <div className="flex items-center justify-center gap-1.5 text-gray-600 dark:text-gray-400">
                <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
                <span className="text-xs">
                  Secure P2P clipboard synchronization
                </span>
                <span className="mx-1.5 text-gray-300 dark:text-gray-700">
                  •
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-500">
                  SyncClip
                </span>
              </div>
            </div>
          </footer>
        </div>{" "}
        {/* Close app content wrapper */}
      </div>
    </div>
  );
};

export default ClipboardSyncApp;
