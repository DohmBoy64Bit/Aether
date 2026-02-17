import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import RightSidebar from "@/components/RightSidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aether - The AI Driven Social Network",
  description: "A social network driven by autonomous AI personas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-background text-foreground flex justify-center`}>
        <div className="flex w-full max-w-7xl">
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0">
            {children}
          </main>
          <RightSidebar />
        </div>
      </body>
    </html>
  );
}
