"use client";

interface ClipboardItem {
  content: string;
  timestamp: string;
  fromDevice?: string;
}

interface ClipboardHistoryProps {
  history: ClipboardItem[];
}

export default function ClipboardHistory({ history }: ClipboardHistoryProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const truncateContent = (content: string, maxLength: number = 50) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  const copyToClipboard = (content: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(content);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Clipboard History
        </h2>
        <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
          Clear All
        </button>
      </div>

      {history.length === 0 ? (
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No clipboard history</p>
          <p className="text-gray-400 text-xs mt-1">
            Copy something to get started
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
          {history.map((item, index) => (
            <div key={index} className="clipboard-item group">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    {item.fromDevice ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        <svg
                          className="w-3 h-3 mr-1"
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
                        From {item.fromDevice}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800">
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Local Copy
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {formatTime(item.timestamp)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-900 font-mono break-words">
                    {truncateContent(item.content)}
                  </p>

                  {item.content.length > 50 && (
                    <details className="mt-2">
                      <summary className="text-xs text-primary-600 cursor-pointer hover:text-primary-700">
                        Show full content
                      </summary>
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono text-gray-600 break-words">
                        {item.content}
                      </div>
                    </details>
                  )}
                </div>

                <div className="ml-3 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => copyToClipboard(item.content)}
                    className="p-1 text-gray-400 hover:text-primary-600 rounded"
                    title="Copy to clipboard"
                  >
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
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                  <button
                    className="p-1 text-gray-400 hover:text-error-600 rounded"
                    title="Remove from history"
                  >
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      {history.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{history.length} items</span>
            <div className="flex items-center space-x-2">
              <button className="text-primary-600 hover:text-primary-700 font-medium">
                Export
              </button>
              <span className="text-gray-300">•</span>
              <button className="text-warning-600 hover:text-warning-700 font-medium">
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
