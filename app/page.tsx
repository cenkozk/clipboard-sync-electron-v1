"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Clipboard,
  Users,
  Network,
  RefreshCw,
  Copy,
  CheckCircle,
  AlertCircle,
  Wifi,
  WifiOff,
  Monitor,
  Smartphone,
  Laptop,
  Server,
  Activity,
  Settings,
  Zap,
  ArrowRightLeft,
  Globe,
  Shield,
  Clock,
  Trash2,
  Download,
  ChevronDown,
  X,
  Plus,
  Search,
  Info,
  ExternalLink,
} from "lucide-react";

// TypeScript declarations for electronAPI
declare global {
  interface Window {
    electronAPI: {
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
  const [showNetworkPanel, setShowNetworkPanel] = useState(true);
  const [showDetailsPanel, setShowDetailsPanel] = useState(true);
  const [showPeersPanel, setShowPeersPanel] = useState(true);
  const [showHistoryPanel, setShowHistoryPanel] = useState(true);
  const [activeTab, setActiveTab] = useState<"main" | "details" | "stats">(
    "main"
  );
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
        {/* Header */}
        <header
          className={`bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl p-4 mb-6 border border-gray-200/30 dark:border-gray-700/30 shadow-lg transition-all duration-500 transform ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          }`}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-400/80 to-emerald-600/80 shadow-lg backdrop-blur-sm border border-emerald-500/30">
                <ArrowRightLeft className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-800 dark:from-emerald-400 dark:to-emerald-600">
                  SyncClip
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Seamless clipboard synchronization across devices
                </p>
              </div>
            </div>

            {/* Quick Status */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                <div
                  className={`w-2 h-2 rounded-full ${
                    deviceInfo?.isConnected ? "bg-emerald-500" : "bg-red-500"
                  }`}
                  style={{
                    animation: deviceInfo?.isConnected
                      ? "pulse 2s infinite"
                      : "none",
                  }}
                ></div>
                <span className="text-xs font-medium">
                  {deviceInfo?.isConnected ? "Online" : "Offline"}
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
                <span className="text-xs font-medium">
                  {peers.length} peers
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                <Clipboard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
                <span className="text-xs font-medium">
                  {clipboardHistory.length} clips
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div
          className={`bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl p-2 mb-6 border border-gray-200/30 dark:border-gray-700/30 shadow-md transition-all duration-500 transform ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          }`}
          style={{ transitionDelay: "100ms" }}
        >
          <div className="flex">
            <button
              onClick={() => setActiveTab("main")}
              className={`flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === "main"
                  ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                  : "hover:bg-gray-200/50 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-400"
              }`}
            >
              <Clipboard className="w-4 h-4" />
              <span>Clipboard</span>
            </button>

            <button
              onClick={() => setActiveTab("details")}
              className={`flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === "details"
                  ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                  : "hover:bg-gray-200/50 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-400"
              }`}
            >
              <Network className="w-4 h-4" />
              <span>Network</span>
            </button>

            <button
              onClick={() => setActiveTab("stats")}
              className={`flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === "stats"
                  ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                  : "hover:bg-gray-200/50 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-400"
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Activity</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        {activeTab === "main" && (
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
                      <Network className="w-4 h-4" />
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
                        <WifiOff className="w-5 h-5 text-gray-400 dark:text-gray-500" />
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
        )}

        {/* Network Tab Content */}
        {activeTab === "details" && (
          <div
            className={`bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl p-4 border border-gray-200/30 dark:border-gray-700/30 shadow-lg transition-all duration-500 transform ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: "200ms" }}
          >
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Network className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Network Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Connection Status */}
                <div className="p-3 bg-gray-100/70 dark:bg-gray-800/70 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Connection Status
                  </h3>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Status
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          deviceInfo?.isConnected
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {deviceInfo?.isConnected ? "Connected" : "Disconnected"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Local IP
                      </span>
                      <span className="text-xs font-mono text-gray-700 dark:text-gray-300">
                        {deviceInfo?.localIP || "Unknown"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Connection Type
                      </span>
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        Peer-to-Peer (WebRTC)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Encryption
                      </span>
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        End-to-End Encrypted
                      </span>
                    </div>
                  </div>
                </div>

                {/* Network Statistics */}
                <div className="p-3 bg-gray-100/70 dark:bg-gray-800/70 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Network Statistics
                  </h3>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Connected Peers
                      </span>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {peers.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Discovered Devices
                      </span>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {discoveredDevices.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Last Scan
                      </span>
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {isScanning ? "In Progress..." : "Just Now"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Auto-Connect
                      </span>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400">
                        Enabled
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Discovered Devices Table */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Discovered Devices
                  </h3>
                  <button
                    onClick={startNetworkScan}
                    disabled={isScanning}
                    className="text-xs px-2 py-1 rounded-md bg-emerald-500/90 text-white hover:bg-emerald-600/90 disabled:opacity-50 transition-colors flex items-center gap-1"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${isScanning ? "animate-spin" : ""}`}
                    />
                    {isScanning ? "Scanning..." : "Scan Now"}
                  </button>
                </div>

                {isScanning && (
                  <div className="mb-3 space-y-2">
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

                {discoveredDevices.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-100/70 dark:bg-gray-800/70">
                        <tr>
                          <th
                            scope="col"
                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                          >
                            Device Name
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                          >
                            IP Address
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                          >
                            Type
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400"
                          >
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white/50 dark:bg-gray-900/50 divide-y divide-gray-200 dark:divide-gray-700">
                        {discoveredDevices.map((device) => (
                          <tr
                            key={device.deviceId}
                            className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                          >
                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300 flex items-center gap-2">
                              {getDeviceIcon(device.deviceName)}
                              {device.deviceName}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300 font-mono">
                              {device.remoteIP}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300">
                              {device.deviceName.toLowerCase().includes("phone")
                                ? "Mobile"
                                : "Desktop"}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-right text-xs">
                              <button
                                onClick={() => connectToDevice(device)}
                                className="px-2 py-1 bg-emerald-500/90 hover:bg-emerald-600/90 text-white rounded-md text-xs transition-colors"
                              >
                                Connect
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-100/70 dark:bg-gray-800/70 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                    <WifiOff className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No devices discovered yet
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Use the "Scan Now" button to search for devices on your
                      network
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Activity Tab Content */}
        {activeTab === "stats" && (
          <div
            className={`bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl p-4 border border-gray-200/30 dark:border-gray-700/30 shadow-lg transition-all duration-500 transform ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: "200ms" }}
          >
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Activity & Statistics
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-emerald-100/70 dark:bg-emerald-900/20 rounded-lg border border-emerald-200/50 dark:border-emerald-800/50">
                  <h3 className="text-xs font-medium text-emerald-800 dark:text-emerald-300 mb-1">
                    Clipboard Items
                  </h3>
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                      {clipboardHistory.length}
                    </span>
                    <Clipboard className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                  </div>
                </div>

                <div className="p-3 bg-blue-100/70 dark:bg-blue-900/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                  <h3 className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">
                    Connected Peers
                  </h3>
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                      {peers.length}
                    </span>
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                  </div>
                </div>

                <div className="p-3 bg-purple-100/70 dark:bg-purple-900/20 rounded-lg border border-purple-200/50 dark:border-purple-800/50">
                  <h3 className="text-xs font-medium text-purple-800 dark:text-purple-300 mb-1">
                    Discovered Devices
                  </h3>
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                      {discoveredDevices.length}
                    </span>
                    <Network className="w-5 h-5 text-purple-600 dark:text-purple-500" />
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Recent Activity
                </h3>

                <div className="overflow-hidden rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                  <div className="bg-gray-100/70 dark:bg-gray-800/70 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Clipboard Activity
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Last 24 hours
                      </span>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[300px] overflow-y-auto">
                    {clipboardHistory.length > 0 ? (
                      clipboardHistory.slice(0, 10).map((item, index) => (
                        <div
                          key={index}
                          className="px-3 py-2 bg-white/50 dark:bg-gray-900/50"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-1.5 mb-1">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    item.source === "Local Copy"
                                      ? "bg-emerald-500"
                                      : "bg-blue-500"
                                  }`}
                                ></span>
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  {item.source}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                                {truncateContent(item.content, 60)}
                              </p>
                            </div>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                              {formatTime(item.timestamp)}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-6 text-center bg-white/50 dark:bg-gray-900/50">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No recent activity
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Export Options */}
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={clearClipboardHistory}
                  className="text-xs px-3 py-1.5 rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/30 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear History
                </button>
                <button
                  onClick={exportClipboardHistory}
                  className="text-xs px-3 py-1.5 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-800/30 transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Data
                </button>
              </div>
            </div>
          </div>
        )}

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
              <span className="mx-1.5 text-gray-300 dark:text-gray-700">•</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-500">
                SyncClip
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ClipboardSyncApp;
