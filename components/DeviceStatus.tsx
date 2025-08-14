"use client";

interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  localIP: string;
  isConnected: boolean;
  peerCount: number;
}

interface DeviceStatusProps {
  deviceInfo: DeviceInfo | null;
}

export default function DeviceStatus({ deviceInfo }: DeviceStatusProps) {
  if (!deviceInfo) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Device Status</h2>
        <div
          className={`status-indicator ${
            deviceInfo.isConnected ? "status-online" : "status-offline"
          }`}
        ></div>
      </div>

      <div className="space-y-4">
        {/* Device Name */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {deviceInfo.deviceName}
            </p>
            <p className="text-xs text-gray-500">Device Name</p>
          </div>
        </div>

        {/* Local IP */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-success-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {deviceInfo.localIP}
            </p>
            <p className="text-xs text-gray-500">Local IP Address</p>
          </div>
        </div>

        {/* Connection Status */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-warning-600"
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
          <div>
            <p className="text-sm font-medium text-gray-900">
              {deviceInfo.isConnected ? "Connected" : "Disconnected"}
            </p>
            <p className="text-xs text-gray-500">Network Status</p>
          </div>
        </div>

        {/* Connected Peers */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-primary-600"
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
          <div>
            <p className="text-sm font-medium text-gray-900">
              {deviceInfo.peerCount}
            </p>
            <p className="text-xs text-gray-500">Connected Peers</p>
          </div>
        </div>
      </div>

      {/* Device ID (Hidden by default, can be expanded) */}
      <details className="mt-4">
        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
          Show Device ID
        </summary>
        <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono text-gray-600 break-all">
          {deviceInfo.deviceId}
        </div>
      </details>
    </div>
  );
}
