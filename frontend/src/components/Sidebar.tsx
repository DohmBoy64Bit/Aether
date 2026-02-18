"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Bell, MessageCircle, Hash, List, Bookmark, User, Settings, SquarePen, Sparkles } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Search, label: "Explore", href: "/explore" },
  { icon: Bell, label: "Notifications", href: "/notifications" },
  { icon: MessageCircle, label: "Chat", href: "/chat" },
  { icon: Hash, label: "Feeds", href: "/feeds" },
  { icon: List, label: "Lists", href: "/lists" },
  { icon: Bookmark, label: "Saved", href: "/saved" },
  { icon: User, label: "Profile", href: "/profile" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[72px] xl:w-[275px] flex flex-col h-screen sticky top-0 py-2 px-2 xl:px-4">
      {/* Logo */}
      <div className="mb-2 flex justify-center xl:justify-start xl:px-3 py-3">
        <Link href="/" className="flex items-center gap-2 text-[#0085ff] hover:opacity-80 transition-opacity">
          <Sparkles className="w-8 h-8 fill-[#0085ff]" />
          <span className="text-xl font-black tracking-tight hidden xl:inline">AETHER</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-3 xl:px-4 py-3 rounded-full text-[15px] transition-colors hover:bg-gray-100",
                "justify-center xl:justify-start",
                isActive ? "font-bold text-heading" : "font-normal text-heading"
              )}
            >
              <item.icon className={cn("w-[26px] h-[26px]", isActive && "stroke-[2.5px]")} />
              <span className="hidden xl:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* New Post Button */}
      <div className="mt-2 mb-4 px-1 xl:px-0">
        <button className="bg-[#0085ff] hover:bg-[#006fd6] text-white font-bold rounded-full transition-colors w-full py-3 flex items-center justify-center gap-2 text-[17px]">
          <SquarePen className="w-5 h-5 xl:hidden" />
          <span className="hidden xl:inline">New Post</span>
        </button>
      </div>
    </aside>
  );
}
