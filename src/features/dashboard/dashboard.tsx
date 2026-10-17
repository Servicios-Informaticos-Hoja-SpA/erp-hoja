"use client";

import React, { useEffect, useState } from "react";
import { DashboardView } from "./dashboard.view";
import { useRouter } from "next/navigation";
import { getConfig, updateConfig, getDashboardMetrics, DashboardMetricsData } from "@/lib/services";
import { toast } from "sonner";

let globalConfigChecked = false;

export const DashboardFeature = () => {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetricsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Inicializar configuración global de forma diferida sólo una vez por sesión de navegador
  useEffect(() => {
    if (globalConfigChecked) return;
    const checkConfig = async () => {
      globalConfigChecked = true;
      const config = await getConfig();
      if (!config) {
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

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const data = await getDashboardMetrics(true);
      setMetrics(data);
    } catch (err) {
      console.error("Error al cargar métricas de dashboard:", err);
      toast.error("No se pudieron cargar las métricas en tiempo real");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchMetrics = async () => {
      try {
        const data = await getDashboardMetrics();
        if (isMounted) {
          setMetrics(data);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error al cargar métricas de dashboard:", err);
        if (isMounted) setLoading(false);
      }
    };

    fetchMetrics();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAppClick = (app: string) => {
    if (app === "presupuestos") {
      router.push("/presupuestos");
    } else if (app === "clientes") {
      router.push("/clientes");
    } else if (app === "proyectos") {
      router.push("/proyectos");
    } else if (app === "suscripciones") {
      router.push("/suscripciones");
    } else if (app === "flujo-caja") {
      router.push("/flujo-caja");
    }
  };

  return (
    <DashboardView
      metrics={metrics}
      loading={loading}
      onRefresh={handleRefresh}
      onAppClick={handleAppClick}
      companyName="Servicios Informáticos Hoja SpA"
    />
  );
};

