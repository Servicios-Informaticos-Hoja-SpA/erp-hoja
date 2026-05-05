"use client";

import React from "react";
import { AppIcon } from "@/components/ui/app-icon";
import { 
  FileText, 
  Users, 
  Briefcase, 
  TrendingUp, 
  LogOut, 
  Moon, 
  Sun,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

interface DashboardViewProps {
  onLogout: () => void;
  onAppClick: (app: string) => void;
  companyName: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onLogout,
  onAppClick,
  companyName,
}) => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="relative flex min-h-screen flex-col bg-background overflow-hidden selection:bg-primary/30">
      
      {/* FONDO ATMOSFÉRICO DE HOJA SPA - LILAS Y MORADOS */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Glow Lavanda principal */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#abaafd]/20 blur-[140px] animate-pulse" />
        {/* Glow Morado Profundo secundario */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#2e3c7e]/20 blur-[140px]" />
        
        {/* ELEMENTOS DECORATIVOS PARA MODO CLARO */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-0" 
             style={{ backgroundImage: 'radial-gradient(#2e3c7e 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute top-[20%] left-[5%] w-32 h-32 border border-[#abaafd]/20 rounded-full dark:hidden" />
        <div className="absolute bottom-[20%] right-[5%] w-48 h-48 border border-[#2e3c7e]/10 rounded-full dark:hidden" />
      </div>

      {/* Header Premium */}
      <header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-16">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl p-2">
            <img src="/logo.png" alt="Logo Hoja SpA" className="h-full w-full object-contain drop-shadow-lg" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-foreground leading-none">
              {companyName}
            </h1>
            <p className="text-[8px] sm:text-[9px] uppercase font-bold text-primary tracking-[0.2em] sm:tracking-[0.3em] mt-1 sm:mt-1.5 ml-0.5">Control de Operaciones</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 bg-white/5 backdrop-blur-xl border border-white/10 p-1.5 sm:p-2 rounded-2xl">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-xl h-9 w-9 sm:h-10 sm:w-10 hover:bg-white/10 text-primary"
          >
            <Sun className="h-4 w-4 sm:h-5 sm:w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 sm:h-5 sm:w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          <div className="w-[1px] h-6 bg-white/10 mx-0.5 sm:mx-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            className="rounded-xl h-9 w-9 sm:h-10 sm:w-10 text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6">
        <div className="mb-12 text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
            <Sparkles className="h-3 w-3" /> ¡Hola de nuevo!
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-foreground max-w-xl mx-auto leading-tight">
            ¿Qué te gustaría <span className="text-[#abaafd] italic">realizar</span> hoy?
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 w-full max-w-7xl mx-auto px-4">
          <AppIcon
            icon={FileText}
            label="Presupuestos"
            description="Cotizaciones y propuestas comerciales"
            onClick={() => onAppClick("presupuestos")}
            color="from-[#2e3c7e] to-[#abaafd]"
          />
          <AppIcon
            icon={Users}
            label="Clientes"
            description="Gestión de contactos CRM"
            onClick={() => onAppClick("clientes")}
            color="from-[#abaafd] to-[#2e3c7e]"
          />
          <AppIcon
            icon={Briefcase}
            label="Proyectos"
            description="Gestión de tareas y cronogramas"
            disabled
          />
          <AppIcon
            icon={TrendingUp}
            label="Flujo de Caja"
            description="Reportes financieros"
            disabled
          />
        </div>
      </main>

      {/* Footer Minimalista */}
      <footer className="relative z-10 py-8 text-center">
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.4em] opacity-30">
          &copy; {new Date().getFullYear()} {companyName} &bull; Panel Interno
        </p>
      </footer>
    </div>
  );
};
