import type { Metadata } from "next";
import "./globals.css";

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
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
