"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  CalendarCheck,
  ListTodo,
  Inbox,
  FolderKanban,
  StickyNote,
  Library,
  Mic2,
  Brain,
} from "lucide-react";
import Image from "next/image";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { api } from "@/lib/api";

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  countKey?: keyof typeof _defaultCounts;
}

const _defaultCounts = { inbox: 0, read: 0, doing: 0 };

const navItems: NavItem[] = [
  { title: "Inbox", url: "/inbox", icon: Inbox, countKey: "inbox" },
  { title: "Dashboard", url: "/", icon: LayoutDashboard, countKey: "read" },
  { title: "Actions", url: "/actions", icon: ListTodo, countKey: "doing" },
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "Resources", url: "/resources", icon: BookOpen },
  { title: "Notes", url: "/notes", icon: StickyNote },
  { title: "Books", url: "/books", icon: Library },
  { title: "Chat", url: "/chat", icon: MessageSquare },
  { title: "Voice", url: "/voice", icon: Mic2 },
  { title: "Mental Models", url: "/mental-models", icon: Brain },
  { title: "Digest", url: "/digest", icon: CalendarCheck },
];

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();
  const [counts, setCounts] = useState(_defaultCounts);

  // Auto-close sidebar on navigation (mobile)
  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [pathname, isMobile, setOpenMobile]);

  useEffect(() => {
    Promise.all([
      api.getResources(1, "inbox"),
      api.getResources(1, "read"),
      api.getResources(1, "doing"),
    ]).then(([inbox, read, doing]) => {
      setCounts({ inbox: inbox.total, read: read.total, doing: doing.total });
    }).catch(() => {});
  }, []);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
                  <Image src="/icon192.png" alt="Rams Agent" width={32} height={32} className="object-contain" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Rams Agent</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Resource Manager
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={
                    pathname === item.url ||
                    (item.url !== "/" && pathname.startsWith(item.url))
                  }
                  tooltip={item.title}
                >
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                    {item.countKey && counts[item.countKey] > 0 && (
                      <span className="ml-auto text-xs font-medium bg-primary/10 text-primary rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center group-data-[collapsible=icon]:hidden">
                        {counts[item.countKey]}
                      </span>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="sm" className="text-muted-foreground">
              <span className="text-xs">Rams Agent v0.1</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
