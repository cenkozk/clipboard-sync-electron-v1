import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Clipboard Sync - Cross-Platform Clipboard Synchronization",
  description:
    "Automatically sync your clipboard across devices on your local network using peer-to-peer connections.",
  keywords: ["clipboard", "sync", "cross-platform", "p2p", "lan", "electron"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          {children}
        </div>
      </body>
    </html>
  );
}
