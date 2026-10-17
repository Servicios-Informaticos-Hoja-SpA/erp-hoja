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
    label: "Clientes",
    href: "/clientes",
    icon: Users,
    badge: "CRM",
  },
  {
    label: "Presupuestos",
    href: "/presupuestos",
    icon: FileText,
    badge: null,
  },
  {
    label: "Proyectos",
    href: "/proyectos",
    icon: Briefcase,
    badge: null,
  },
  {
    label: "Servicios Recurrentes",
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
        className={`hidden md:flex fixed top-0 left-0 z-40 h-screen select-none transition-all duration-300 ease-in-out flex-col justify-between border-r border-white/10 bg-background/95 dark:bg-slate-950/95 backdrop-blur-md shadow-[10px_0_30px_rgba(0,0,0,0.15)] ${
          expanded ? "w-64" : "w-16"
        }`}
      >
        {/* Top Header & Expand Toggle */}
        <div className="flex flex-col">
          {expanded ? (
            <div className="flex h-16 items-center justify-between px-3.5 border-b border-white/10">
              <div className="flex items-center gap-2.5 overflow-hidden pl-1">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 p-1.5 shadow-md">
                  <img 
                    src="/favicon.ico" 
                    alt="Logo Hoja SpA" 
                    className="h-full w-full object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/logo.png"; }}
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-black tracking-tight text-foreground truncate">
                    Hoja SpA
                  </span>
                  <span className="text-[9px] font-bold text-primary uppercase tracking-widest leading-none mt-0.5 truncate">
                    Operaciones
                  </span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleExpand}
                className="h-8 w-8 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all shrink-0 cursor-pointer"
                title="Colapsar barra lateral"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex h-16 items-center justify-center border-b border-white/10 w-full px-0">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      onClick={toggleExpand}
                      aria-label="Expandir barra lateral"
                      className="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 p-1.5 shadow-md hover:bg-white/10 hover:border-primary/50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <img 
                        src="/favicon.ico" 
                        alt="Logo Hoja SpA" 
                        className="h-full w-full object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/logo.png"; }}
                      />
                      <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-slate-950 shadow-xs group-hover:scale-110 transition-transform">
                        <ChevronRight className="h-2.5 w-2.5 text-slate-950 stroke-[3]" />
                      </span>
                    </button>
                  }
                />
                <TooltipContent side="right" className="font-bold text-xs bg-slate-900 border-white/20 text-white shadow-xl">
                  Expandir barra lateral
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Navigation Links */}
          <nav className={`flex flex-col gap-1.5 pt-4 ${expanded ? "p-2" : "items-center px-0"}`}>
            {navItems.map((item) => {
              const active = isCurrentRoute(item.href);
              const Icon = item.icon;

              if (!expanded) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger
                      render={
                        <Link
                          href={item.href}
                          className={`group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                            active
                              ? "bg-gradient-to-r from-primary/20 to-primary/10 text-primary border border-primary/40 shadow-md shadow-primary/20"
                              : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                          }`}
                        >
                          {/* Active Indicator Bar on left edge of sidebar */}
                          {active && (
                            <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary shadow-[0_0_10px_#abaafd]" />
                          )}

                          <Icon
                            className={`h-5 w-5 transition-transform group-hover:scale-110 ${
                              active ? "text-primary drop-shadow-[0_0_8px_rgba(171,170,253,0.5)]" : "text-muted-foreground"
                            }`}
                          />
                        </Link>
                      }
                    />
                    <TooltipContent side="right" className="font-bold text-xs bg-slate-900 border-white/20 text-white shadow-xl">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
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
                  
                  <span className="truncate tracking-tight font-black">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info in sidebar */}
        <div className="p-3 border-t border-white/10 text-center flex items-center justify-center">
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
            <span className="text-[9px] font-black font-mono text-muted-foreground/50">
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
