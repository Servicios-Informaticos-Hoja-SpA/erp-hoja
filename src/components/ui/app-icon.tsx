"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppIconProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  disabled?: boolean;
  onClick?: () => void;
  color?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({
  icon: Icon,
  label,
  description,
  disabled = false,
  onClick,
  color = "from-primary to-primary/60",
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative flex flex-col items-center p-4 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] transition-all duration-500 outline-none border border-transparent",
        disabled 
          ? "opacity-30 cursor-not-allowed grayscale" 
          : "hover:bg-white/5 hover:border-white/10 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:-translate-y-2 active:scale-95"
      )}
    >
      {/* Icon Wrapper with Gradient */}
      <div
        className={cn(
          "relative flex h-16 w-16 sm:h-24 sm:w-24 items-center justify-center rounded-2xl sm:rounded-3xl text-white shadow-2xl transition-all duration-500 overflow-hidden",
          "bg-gradient-to-br",
          color,
          !disabled && "group-hover:scale-110 group-hover:rotate-3"
        )}
      >
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        <Icon strokeWidth={1.5} className="relative z-10 drop-shadow-lg h-8 w-8 sm:h-10 sm:w-10" />
      </div>

      {/* Text Info */}
      <div className="mt-4 sm:mt-6 text-center">
        <span className="block text-base sm:text-xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors">
          {label}
        </span>
        {description && (
          <span className="mt-2 hidden sm:block text-xs font-medium text-muted-foreground leading-relaxed max-w-[150px] opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
            {description}
          </span>
        )}
      </div>

      {/* Hover Background Accent */}
      {!disabled && (
        <div className="absolute inset-0 -z-10 rounded-[2.5rem] bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  );
};
