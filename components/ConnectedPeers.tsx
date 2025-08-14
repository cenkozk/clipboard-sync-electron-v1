"use client";

import { useState } from "react";

interface Peer {
  id: string;
  connected: boolean;
  deviceName: string;
  localIP?: string;
}

interface ConnectedPeersProps {
  peers: Peer[];
}

export default function ConnectedPeers({ peers }: ConnectedPeersProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshPeers = async () => {
    if (window.electronAPI) {
      setIsRefreshing(true);
      try {
        const newPeers = await window.electronAPI.getPeers();
        console.log("Manual refresh - Current peers:", newPeers);
        // The parent component will handle the state update
      } catch (error) {
        console.error("Failed to refresh peers:", error);
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Connected Peers</h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={refreshPeers}
            disabled={isRefreshing}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            {isRefreshing ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </button>
          <div className="status-online"></div>
          <span className="text-sm text-gray-500">{peers.length}</span>
        </div>
      </div>

      {peers.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No peers connected</p>
          <p className="text-gray-400 text-xs mt-1">
            Waiting for devices on your LAN...
          </p>
          <div className="mt-4 text-xs text-gray-400">
            <p>Debug Info:</p>
            <p>• Check Network Discovery for found devices</p>
            <p>• Ensure devices are on same WiFi network</p>
            <p>• Try clicking "Scan Network" in left panel</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {peers.map((peer) => (
            <div key={peer.id} className="device-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`status-indicator ${
                      peer.connected ? "status-online" : "status-offline"
                    }`}
                  ></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {peer.deviceName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {peer.localIP ? `IP: ${peer.localIP}` : "Peer Device"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      peer.connected
                        ? "bg-success-100 text-success-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {peer.connected ? "Connected" : "Disconnected"}
                  </span>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Peer Actions */}
              <div className="mt-3 flex items-center space-x-2">
                <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                  View Details
                </button>
                <span className="text-gray-300">•</span>
                <button className="text-xs text-warning-600 hover:text-warning-700 font-medium">
                  Disconnect
                </button>
                <span className="text-gray-300">•</span>
                <button className="text-xs text-success-600 hover:text-success-700 font-medium">
                  Sync Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Peer Button */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button className="w-full btn-secondary text-sm">
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
          Add Peer Manually
        </button>
      </div>
    </div>
  );
}
