"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FolderOpen,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { clearTokens } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

const STORAGE_KEY = "kivia-sidebar-collapsed";

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "1") setCollapsed(true);
    setHydrated(true);
  }, []);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  function handleLogout() {
    clearTokens();
    router.push("/login");
  }

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r bg-sidebar border-sidebar-border transition-[width] duration-200",
        collapsed ? "w-[68px]" : "w-[220px]",
        !hydrated && "invisible"
      )}
    >
      {/* Logo + Toggle */}
      <div
        className={cn(
          "flex items-center h-16 shrink-0",
          collapsed ? "flex-col justify-center gap-1 px-2" : "justify-between px-5"
        )}
      >
        <div className={cn("flex items-center", !collapsed && "gap-2.5")}>
          <Image
            src="/logo.svg"
            alt="Kivia"
            width={28}
            height={28}
            priority
            className="rounded-lg shrink-0"
          />
          {!collapsed && (
            <span className="text-base font-display font-bold tracking-tight text-sidebar-foreground">
              Kivia
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="h-7 w-7 text-sidebar-foreground/45 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          onClick={toggle}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="mx-4 h-px bg-sidebar-border" />

      {/* Nav */}
      <nav className={cn("flex-1 space-y-1 py-4", collapsed ? "px-2" : "px-3")}>
        {!collapsed && (
          <p className="px-3 pb-2.5 text-[11px] font-display font-semibold uppercase tracking-widest text-muted-foreground/50">
            Menu
          </p>
        )}
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard" || href === "/settings"
              ? pathname === href
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center rounded-lg text-sm font-medium transition-all",
                collapsed
                  ? "justify-center h-10 w-full"
                  : "gap-3 px-3 py-2 border-l-2",
                active
                  ? collapsed
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-foreground shadow-sm"
                  : collapsed
                    ? "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-transparent"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && label}
            </Link>
          );
        })}
      </nav>

      <div className="mx-4 h-px bg-sidebar-border" />

      {/* Logout */}
      <div className={cn("py-4", collapsed ? "px-2" : "px-3")}>
        <Button
          variant="ghost"
          title={collapsed ? "Sign out" : undefined}
          className={cn(
            "text-sidebar-foreground/45 hover:bg-sidebar-accent hover:text-sidebar-foreground text-sm",
            collapsed ? "w-full justify-center px-0" : "w-full justify-start gap-3"
          )}
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && "Sign out"}
        </Button>
      </div>
    </aside>
  );
}
