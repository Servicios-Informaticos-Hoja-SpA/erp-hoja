"use client";

import React, { useEffect } from "react";
import { DashboardView } from "./dashboard.view";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { getConfig, updateConfig } from "@/lib/services";

export const DashboardFeature = () => {
  const router = useRouter();

  // Inicializar configuración global si no existe
  useEffect(() => {
    const checkConfig = async () => {
      const config = await getConfig();
      if (!config) {
        console.log("Inicializando configuración global...");
        await updateConfig({
          banco: "Banco Falabella",
          tipo_cuenta: "Corriente",
          numero_cuenta: "1-983-101480-2",
          email_pago: "devhoja@gmail.com",
          email_contacto: "devhoja@gmail.com",
          web: "hojadev.xyz",
          telefono: "+56 9 54169597"
        });
      }
    };
    checkConfig();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Eliminar la cookie de sesión
      document.cookie = "session_active=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      router.push("/login");
    } catch (err) {
      console.error("Error signing out", err);
    }
  };

  const handleAppClick = (app: string) => {
    if (app === "presupuestos") {
      router.push("/presupuestos");
    } else if (app === "clientes") {
      router.push("/clientes");
    }
  };

  return (
    <DashboardView
      onLogout={handleLogout}
      onAppClick={handleAppClick}
      companyName="Servicios Informáticos Hoja SpA"
    />
  );
};
