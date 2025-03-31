// "use client";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavbarSwitcher from "./components/NavbarSwitcher"; // ✅ Import NavbarSwitcher
import Footer from "./components/Footer"; // ✅ Import Footer
import { WebSocketProvider } from "./context/WebSocketContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "ViMeet",
  icons: [
    // Tab icon for browsers
    { rel: "icon", url: "/favicon.png" },

    // Optional for high-DPI or multiple sizes
    { rel: "icon", type: "image/png", sizes: "96x96", url: "/favicon-96x96.png" },

    // iOS Homescreen icon
    { rel: "apple-touch-icon", url: "/apple-touch-icon.png" },

    // Android homescreen icons (linked via manifest)
    { rel: "icon", type: "image/png", sizes: "192x192", url: "/web-app-manifest-192x192.png" },
    { rel: "icon", type: "image/png", sizes: "512x512", url: "/web-app-manifest-512x512.png" },
  ],
  manifest: "/site.webmanifest",
  themeColor: "#ffffff",
};



export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        <WebSocketProvider>
          <NavbarSwitcher /> {/*  Navbar always at the top */}
          <main className="flex-grow">{children}</main> {/*  Makes content take full height */}
          <Footer />  Footer always at the bottom
        </WebSocketProvider>
      </body>
    </html>
  );
}
