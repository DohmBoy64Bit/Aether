"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Bell, Mail, Hash, List, Bookmark, User, Settings, PlusCircle } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Search, label: "Explore", href: "/explore" },
  { icon: Bell, label: "Notifications", href: "/notifications" },
  { icon: Mail, label: "Chat", href: "/chat" },
  { icon: Hash, label: "Feeds", href: "/feeds" },
  { icon: List, label: "Lists", href: "/lists" },
  { icon: Bookmark, label: "Saved", href: "/saved" },
  { icon: User, label: "Profile", href: "/profile" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex flex-col h-screen sticky top-0 border-r border-secondary/50 px-4 py-4">
      <div className="mb-6 px-4">
        <Link href="/">
          <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-white font-bold text-xl">
            @
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-full text-lg transition-colors hover:bg-secondary",
                isActive ? "font-bold" : "font-normal"
              )}
            >
              <item.icon className="w-6 h-6" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <button className="mt-4 bg-primary text-white rounded-full py-3 px-6 flex items-center justify-center gap-2 font-bold hover:bg-primary/90 transition-colors">
        <PlusCircle className="w-6 h-6" />
        <span>New Post</span>
      </button>
    </aside>
  );
}
