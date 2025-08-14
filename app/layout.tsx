import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clipboard Sync - Seamless clipboard synchronization across devices",
  description:
    "Secure P2P clipboard synchronization for Windows and macOS devices on your local network",
  keywords: "clipboard, sync, p2p, webrtc, windows, macos, local network",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
