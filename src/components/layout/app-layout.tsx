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
  LayoutDashboard,
  FileText,
  Users,
  Briefcase,
  TrendingUp,
  MoreHorizontal,
  Search,
  ChevronDown,
  UserCheck
} from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle
} from "@/components/ui/sheet";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { useTheme } from "next-themes";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import dynamic from "next/dynamic";

const UserProfileModal = dynamic(
  () => import("@/components/profile/user-profile-modal").then((m) => m.UserProfileModal),
  { ssr: false }
);

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);
  const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);
  const [globalSearch, setGlobalSearch] = useState<string>("");

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
    queueMicrotask(() => {
      setMobileDrawerOpen(false);
    });
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

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearch.trim()) return;
    router.push(`/clientes?q=${encodeURIComponent(globalSearch.trim())}`);
  };

  const isCurrentRoute = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  // Rutas directas para la barra inferior móvil (unificando prospección en clientes)
  const mobileBottomItems = [
    { label: "Inicio", href: "/", icon: LayoutDashboard },
    { label: "Clientes", href: "/clientes", icon: Users, badge: "CRM" },
    { label: "Cotizar", href: "/presupuestos", icon: FileText },
    { label: "Proyectos", href: "/proyectos", icon: Briefcase },
    { label: "Flujo", href: "/flujo-caja", icon: TrendingUp },
  ];

  const userDisplayName = user?.displayName || user?.email?.split("@")[0] || "Administrador";
  const userInitials = userDisplayName.substring(0, 2).toUpperCase();

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/30">
      {/* Fondo atmosférico optimizado con cero consumo de GPU */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-40 dark:opacity-30" 
        style={{
          background: "radial-gradient(circle at 10% 10%, rgba(171, 170, 253, 0.12) 0%, transparent 50%), radial-gradient(circle at 90% 90%, rgba(46, 60, 126, 0.18) 0%, transparent 50%)"
        }}
      />

      {/* Top Header Global Rediseñado (Referencia Synergy ERP) */}
      <header className={`sticky top-0 z-30 h-16 border-b border-white/10 bg-background/90 dark:bg-slate-950/90 backdrop-blur-md transition-all duration-300 flex items-center justify-between px-3 sm:px-6 md:px-8 ml-0 ${
        sidebarExpanded ? "md:ml-64" : "md:ml-16"
      }`}>
        {/* Izquierda: Drawer Móvil y Marca */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileDrawerOpen(true)}
            className="md:hidden h-9 w-9 rounded-xl hover:bg-white/10 text-foreground shrink-0"
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
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-black">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>

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

          {/* Espacio reservado para balance visual */}
          <div className="hidden md:block" />
        </div>

        {/* Derecha: Notificaciones, Theme Toggle y Perfil de Usuario Synergy ERP */}
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
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

          <div className="w-[1px] h-6 bg-white/10 mx-0.5 hidden xs:block" />

          {/* Indicador de Usuario Activo en Navbar (Synergy ERP reference) */}
          <Popover>
            <PopoverTrigger 
              className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all text-left outline-none cursor-pointer"
            >
              {/* Avatar */}
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full overflow-hidden bg-gradient-to-tr from-[#2e3c7e] to-[#abaafd] text-white flex items-center justify-center font-black text-xs sm:text-sm shadow-md border border-white/20 shrink-0">
                {user?.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={userDisplayName} 
                    className="h-full w-full object-cover" 
                  />
                ) : (
                  <span>{userInitials}</span>
                )}
              </div>

              {/* Nombre y Rol */}
              <div className="hidden lg:flex flex-col min-w-0 pr-1">
                <span className="text-xs font-black tracking-tight text-foreground truncate max-w-[130px] leading-tight">
                  {userDisplayName}
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold leading-tight">
                  Admin
                </span>
              </div>

              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
            </PopoverTrigger>

            <PopoverContent 
              align="end" 
              className="w-64 p-2 bg-card border border-white/10 shadow-2xl rounded-2xl text-foreground"
            >
              <div className="p-2.5 pb-3 border-b border-border/50">
                <p className="text-xs font-black text-foreground truncate">
                  {userDisplayName}
                </p>
                <p className="text-[11px] text-muted-foreground font-mono truncate">
                  {user?.email || "usuario@hoja.cl"}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-[9px] border border-emerald-500/25">
                    ● En línea
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary font-bold text-[9px]">
                    Firebase Auth
                  </span>
                </div>
              </div>

              <div className="p-1 space-y-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(true)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-muted font-semibold text-foreground transition-all text-left"
                >
                  <UserCheck className="h-4 w-4 text-primary" />
                  <span>Configurar Perfil</span>
                </button>

                <Link
                  href="/clientes"
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-muted font-semibold text-foreground transition-all"
                >
                  <Users className="h-4 w-4 text-sky-400" />
                  <span>CRM Clientes & Prospectos</span>
                </Link>
              </div>

              <div className="p-1 pt-1.5 border-t border-border/50">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-destructive/10 text-destructive font-bold text-xs transition-all text-left"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      {/* Modal de Configuración de Perfil de Usuario */}
      {profileModalOpen && (
        <UserProfileModal 
          open={profileModalOpen} 
          onOpenChange={setProfileModalOpen} 
        />
      )}

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

