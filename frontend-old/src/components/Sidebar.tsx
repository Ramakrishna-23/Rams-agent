"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, MessageSquare, CalendarCheck, BrainCircuit } from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/resources", label: "Resources", icon: BookOpen },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/digest", label: "Digest", icon: CalendarCheck },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-zinc-700 bg-zinc-900">
      <div className="flex items-center gap-3 border-b border-zinc-700 px-5 py-5">
        <BrainCircuit className="h-7 w-7 text-blue-500" />
        <h1 className="text-lg font-bold text-zinc-100">Resource Agent</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={isActive ? "sidebar-link-active" : "sidebar-link"}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-zinc-700 px-5 py-4">
        <p className="text-xs text-zinc-500">Resource Agent v0.1</p>
      </div>
    </aside>
  );
}
