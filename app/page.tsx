"use client";

import { useState, useEffect } from "react";
import DeviceStatus from "@/components/DeviceStatus";
import ConnectedPeers from "@/components/ConnectedPeers";
import ClipboardHistory from "@/components/ClipboardHistory";
import NetworkDiscovery from "@/components/NetworkDiscovery";
import Header from "@/components/Header";

export default function Home() {
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [peers, setPeers] = useState<any[]>([]);
  const [clipboardHistory, setClipboardHistory] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Get device information
    if (window.electronAPI) {
      window.electronAPI.getDeviceInfo().then(setDeviceInfo);
      window.electronAPI.getPeers().then(setPeers);
      window.electronAPI.getClipboardHistory().then(setClipboardHistory);
    }

    // Set up event listeners
    if (window.electronAPI) {
      window.electronAPI.onClipboardChanged((data: any) => {
        console.log("Clipboard changed:", data);
        // Update clipboard history
        setClipboardHistory((prev) => [data, ...prev.slice(0, 9)]);
      });

      window.electronAPI.onClipboardReceived((data: any) => {
        console.log("Clipboard received:", data);
        // Update clipboard history
        setClipboardHistory((prev) => [data, ...prev.slice(0, 9)]);
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

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners("clipboard-changed");
        window.electronAPI.removeAllListeners("clipboard-received");
        window.electronAPI.removeAllListeners("peer-connected");
        window.electronAPI.removeAllListeners("peer-disconnected");
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Device Status & Network */}
          <div className="lg:col-span-4 space-y-6">
            <DeviceStatus deviceInfo={deviceInfo} />
            <NetworkDiscovery />
          </div>

          {/* Center Column - Connected Peers */}
          <div className="lg:col-span-4">
            <ConnectedPeers peers={peers} />
          </div>

          {/* Right Column - Clipboard History */}
          <div className="lg:col-span-4">
            <ClipboardHistory history={clipboardHistory} />
          </div>
        </div>

        {/* Bottom Section - Quick Actions */}
        <div className="mt-12">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="flex flex-wrap gap-4">
              <button className="btn-primary">
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Copy Current Clipboard
              </button>
              <button className="btn-secondary">
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
                Refresh Network
              </button>
              <button className="btn-warning">
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
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                Clear History
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
