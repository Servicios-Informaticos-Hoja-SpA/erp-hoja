"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Briefcase, 
  TrendingUp, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  Server,
  Flame
} from "lucide-react";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

export const navItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    label: "Prospección",
    href: "/prospeccion",
    icon: Flame,
    badge: "🔥",
  },
  {
    label: "Presupuestos",
    href: "/presupuestos",
    icon: FileText,
    badge: null,
  },
  {
    label: "Clientes",
    href: "/clientes",
    icon: Users,
    badge: null,
  },
  {
    label: "Proyectos",
    href: "/proyectos",
    icon: Briefcase,
    badge: null,
  },
  {
    label: "Suscripciones",
    href: "/suscripciones",
    icon: Server,
    badge: null,
  },
  {
    label: "Flujo de Caja",
    href: "/flujo-caja",
    icon: TrendingUp,
    badge: null,
  },
];

interface SidebarProps {
  onToggle?: (expanded: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onToggle }) => {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  // Cargar estado inicial desde localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      const saved = localStorage.getItem("sihoja_sidebar_expanded") ?? localStorage.getItem("sihoja_right_sidebar_expanded");
      if (saved !== null) {
        const isExp = saved === "true";
        setExpanded(isExp);
        onToggle?.(isExp);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [onToggle]);

  const toggleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    localStorage.setItem("sihoja_sidebar_expanded", String(next));
    onToggle?.(next);
  };

  const isCurrentRoute = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  if (!mounted) return null;

  return (
    <TooltipProvider delay={150}>
      <aside
        className={`hidden md:flex fixed top-0 left-0 z-40 h-screen select-none transition-all duration-300 ease-in-out flex-col justify-between border-r border-white/10 bg-background/80 dark:bg-slate-950/80 backdrop-blur-2xl shadow-[10px_0_30px_rgba(0,0,0,0.15)] ${
          expanded ? "w-64" : "w-16"
        }`}
      >
        {/* Top Header & Expand Toggle */}
        <div className="flex flex-col">
          <div className="flex h-16 items-center justify-between px-3.5 border-b border-white/10">
            {expanded ? (
              <div className="flex items-center gap-2 overflow-hidden pl-1">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#2e3c7e] to-[#abaafd] text-white shadow-md">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black tracking-tight text-foreground truncate">
                    Hoja SpA
                  </span>
                  <span className="text-[9px] font-bold text-primary uppercase tracking-widest leading-none">
                    Operaciones
                  </span>
                </div>
              </div>
            ) : (
              <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#2e3c7e] to-[#abaafd] text-white shadow-md">
                <Sparkles className="h-4 w-4" />
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleExpand}
              className="h-8 w-8 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all shrink-0"
              title={expanded ? "Colapsar barra lateral" : "Expandir barra lateral"}
            >
              {expanded ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5 p-2 pt-4">
            {navItems.map((item) => {
              const active = isCurrentRoute(item.href);
              const Icon = item.icon;

              const content = (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center gap-3.5 rounded-xl px-3 py-2.5 transition-all text-xs font-bold ${
                    active
                      ? "bg-gradient-to-r from-primary/20 to-primary/10 text-primary border border-primary/30 shadow-lg shadow-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  {/* Active Indicator Bar on left edge */}
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary shadow-[0_0_10px_#abaafd]" />
                  )}

                  <Icon
                    className={`h-5 w-5 shrink-0 transition-transform group-hover:scale-110 ${
                      active ? "text-primary drop-shadow-[0_0_8px_rgba(171,170,253,0.5)]" : "text-muted-foreground"
                    }`}
                  />
                  
                  {expanded && (
                    <span className="truncate tracking-tight font-black">
                      {item.label}
                    </span>
                  )}
                </Link>
              );

              if (!expanded) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger className="w-full">{content}</TooltipTrigger>
                    <TooltipContent side="right" className="font-bold text-xs bg-slate-900 border-white/20 text-white shadow-xl">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return content;
            })}
          </nav>
        </div>

        {/* Footer info in sidebar */}
        <div className="p-3 border-t border-white/10 text-center">
          {expanded ? (
            <div className="flex flex-col items-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                v2.0 &bull; Hoja ERP
              </p>
              <p className="text-[8px] text-muted-foreground/40 mt-0.5">
                Multi-User Cloud
              </p>
            </div>
          ) : (
            <span className="text-[8px] font-black font-mono text-muted-foreground/40">
              v2
            </span>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
};

// Re-export alias for backward compatibility
export const RightSidebar = Sidebar;
