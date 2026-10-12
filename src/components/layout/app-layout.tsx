"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sidebar, navItems } from "./sidebar";
import { NotificationCenter } from "./notification-center";
import { Button } from "@/components/ui/button";
import { 
  Sun, 
  Moon, 
  LogOut, 
  Menu, 
  Sparkles, 
  X,
  LayoutDashboard,
  Flame,
  FileText,
  Users,
  TrendingUp,
  MoreHorizontal
} from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { useTheme } from "next-themes";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { usePathname } from "next/navigation";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);

  // No renderizar layout global en la pantalla de login
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    const saved = localStorage.getItem("sihoja_sidebar_expanded") ?? localStorage.getItem("sihoja_right_sidebar_expanded");
    if (saved !== null) {
      const isExp = saved === "true";
      queueMicrotask(() => {
        setSidebarExpanded(isExp);
      });
    }
  }, []);

  // Cerrar el drawer móvil al cambiar de ruta
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await signOut(auth);
      window.location.href = "/login";
    } catch (err) {
      console.error("Error signing out", err);
    }
  };

  const isCurrentRoute = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  // Rutas directas para la barra inferior móvil
  const mobileBottomItems = [
    { label: "Inicio", href: "/", icon: LayoutDashboard },
    { label: "Prospección", href: "/prospeccion", icon: Flame, badge: "🔥" },
    { label: "Cotizar", href: "/presupuestos", icon: FileText },
    { label: "Clientes", href: "/clientes", icon: Users },
    { label: "Flujo", href: "/flujo-caja", icon: TrendingUp },
  ];

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/30">
      {/* Fondo atmosférico Hoja SpA */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#abaafd]/10 blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[10%] w-[50%] h-[50%] rounded-full bg-[#2e3c7e]/15 blur-[160px]" />
      </div>

      {/* Top Header Global */}
      <header className={`sticky top-0 z-30 h-16 border-b border-white/10 bg-background/80 dark:bg-slate-950/80 backdrop-blur-2xl transition-all duration-300 flex items-center justify-between px-3 sm:px-8 ml-0 ${
        sidebarExpanded ? "md:ml-64" : "md:ml-16"
      }`}>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Botón Hamburger Móvil para abrir Menú Drawer (< md) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileDrawerOpen(true)}
            className="md:hidden h-10 w-10 rounded-xl hover:bg-white/10 text-foreground shrink-0"
            aria-label="Abrir menú de navegación"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>

            <SheetContent 
              side="left" 
              className="w-[85vw] max-w-[320px] bg-slate-950/95 border-r border-white/10 backdrop-blur-2xl p-0 flex flex-col justify-between z-50 text-foreground"
            >
              <div>
                <SheetHeader className="p-4 border-b border-white/10 text-left">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 p-1.5 shadow-md">
                      <img src="/logo.png" alt="Logo Hoja SpA" className="h-full w-full object-contain" />
                    </div>
                    <div>
                      <SheetTitle className="text-sm font-black text-white tracking-tight leading-none">
                        Hoja SpA
                      </SheetTitle>
                      <p className="text-[9px] uppercase font-bold text-primary tracking-widest mt-1">
                        Control de Operaciones
                      </p>
                    </div>
                  </div>
                </SheetHeader>

                {/* Enlaces del Drawer Móvil */}
                <nav className="p-3 space-y-1">
                  {navItems.map((item) => {
                    const active = isCurrentRoute(item.href);
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileDrawerOpen(false)}
                        className={`flex items-center justify-between rounded-xl px-3.5 py-3 transition-all text-sm font-bold ${
                          active
                            ? "bg-gradient-to-r from-primary/25 to-primary/10 text-primary border border-primary/30 shadow-md shadow-primary/10"
                            : "text-slate-300 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`h-5 w-5 ${active ? "text-primary" : "text-slate-400"}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Pie del Drawer Móvil con Logout y versión */}
              <div className="p-4 border-t border-white/10 bg-slate-950/40 space-y-3">
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full rounded-xl border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 font-bold text-xs h-10 gap-2"
                >
                  <LogOut className="h-4 w-4" /> Cerrar Sesión
                </Button>
                <div className="text-center text-[9px] font-mono text-muted-foreground/50">
                  Servicios Informáticos Hoja SpA &bull; v2.0
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo y Nombre de la Empresa */}
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg p-1.5 shrink-0">
              <img src="/logo.png" alt="Logo Hoja SpA" className="h-full w-full object-contain drop-shadow" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-base md:text-lg font-black tracking-tight text-foreground leading-none truncate max-w-[155px] sm:max-w-none">
                Servicios Informáticos Hoja SpA
              </h1>
              <p className="text-[8px] sm:text-[9px] uppercase font-bold text-primary tracking-[0.2em] mt-0.5 sm:mt-1 truncate">
                Control de Operaciones
              </p>
            </div>
          </Link>
        </div>

        {/* Acciones del Header: Notificaciones, Theme, Logout */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Centro de Notificaciones */}
          <NotificationCenter />

          {/* Toggle Modo Oscuro / Claro */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-xl h-9 w-9 sm:h-10 sm:w-10 hover:bg-white/10 text-primary transition-all"
            title="Cambiar tema"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          <div className="w-[1px] h-6 bg-white/10 mx-0.5 sm:mx-1 hidden xs:block" />

          {/* Cerrar Sesión (Desktop / Tablet) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="hidden sm:flex rounded-xl h-10 w-10 text-destructive hover:bg-destructive/10 transition-all"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Área de Contenido Principal con margen dinámico sólo en desktop y padding inferior para mobile nav */}
      <main className={`relative z-10 flex-1 transition-all duration-300 pb-24 md:pb-6 ml-0 ${
        sidebarExpanded ? "md:ml-64" : "md:ml-16"
      }`}>
        {children}
      </main>

      {/* Barra de Navegación Inferior Nativa para Móviles (< md) */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/95 dark:bg-slate-950/95 backdrop-blur-2xl border-t border-white/10 px-1 py-1.5 flex items-center justify-around shadow-[0_-8px_20px_rgba(0,0,0,0.3)]"
        aria-label="Navegación principal móvil"
      >
        {mobileBottomItems.map((item) => {
          const active = isCurrentRoute(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-1.5 rounded-xl transition-all ${
                active
                  ? "text-primary font-black scale-105"
                  : "text-muted-foreground hover:text-foreground font-semibold"
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${active ? "text-primary drop-shadow-[0_0_8px_rgba(171,170,253,0.6)]" : ""}`} />
                {item.badge && !active && (
                  <span className="absolute -top-1 -right-2 text-[9px] leading-none">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">
                {item.label}
              </span>
              {active && (
                <span className="w-1 h-1 rounded-full bg-primary mt-0.5 shadow-[0_0_6px_#abaafd]" />
              )}
            </Link>
          );
        })}

        {/* Botón "Más" para abrir el drawer con Proyectos, Suscripciones, etc. */}
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className="flex flex-col items-center justify-center min-w-[56px] py-1 px-1.5 rounded-xl text-muted-foreground hover:text-foreground font-semibold transition-all"
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="text-[10px] tracking-tight mt-0.5">Más</span>
        </button>
      </nav>

      {/* Barra Lateral Izquierda para Desktop (>= md) */}
      <Sidebar onToggle={(exp) => setSidebarExpanded(exp)} />
    </div>
  );
};

