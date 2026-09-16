'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { StatCard } from '@/components/shared/stat-card';
import { MiniBarChart } from '@/components/shared/mini-bar-chart';
import { DonutChart } from '@/components/shared/donut-chart';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  AlertTriangle,
  HardHat,
  GraduationCap,
  ClipboardCheck,
  TrendingUp,
  PackageX,
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    incidentes: 0,
    incidentesAbiertos: 0,
    eppStockBajo: 0,
    capacitaciones: 0,
    capacitacionesProgramadas: 0,
    inspecciones: 0,
    inspeccionesPendientes: 0,
  });
  const [incidentesPorMes, setIncidentesPorMes] = useState<{ label: string; value: number }[]>([]);
  const [incidentesPorTipo, setIncidentesPorTipo] = useState<{ label: string; value: number; color: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [inc, epp, cap, insp] = await Promise.all([
        supabase.from('incidentes').select('tipo, estado, fecha'),
        supabase.from('epp_catalog').select('stock, stock_minimo'),
        supabase.from('capacitaciones').select('estado'),
        supabase.from('inspecciones').select('estado, puntaje'),
      ]);

      const incidentes = inc.data || [];
      const eppItems = epp.data || [];
      const capacitaciones = cap.data || [];
      const inspecciones = insp.data || [];

      setStats({
        incidentes: incidentes.length,
        incidentesAbiertos: incidentes.filter((i) => i.estado !== 'cerrado').length,
        eppStockBajo: eppItems.filter((e) => e.stock <= e.stock_minimo).length,
        capacitaciones: capacitaciones.length,
        capacitacionesProgramadas: capacitaciones.filter((c) => c.estado === 'programada').length,
        inspecciones: inspecciones.length,
        inspeccionesPendientes: inspecciones.filter((i) => i.estado !== 'completada').length,
      });

      // Incidentes por mes (últimos 6 meses)
      const now = new Date();
      const months: { label: string; value: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleDateString('es-ES', { month: 'short' });
        const count = incidentes.filter((inc) => {
          const incDate = new Date(inc.fecha);
          return incDate.getMonth() === d.getMonth() && incDate.getFullYear() === d.getFullYear();
        }).length;
        months.push({ label, value: count });
      }
      setIncidentesPorMes(months);

      // Incidentes por tipo
      const tipos = ['accidente', 'casi-accidente', 'condicion insegura', 'acto inseguro'];
      const colores = ['hsl(var(--chart-3))', 'hsl(var(--chart-2))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
      setIncidentesPorTipo(
        tipos.map((tipo, i) => ({
          label: tipo.charAt(0).toUpperCase() + tipo.slice(1),
          value: incidentes.filter((inc) => inc.tipo === tipo).length,
          color: colores[i],
        })).filter((t) => t.value > 0)
      );

      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="h-32 animate-pulse bg-muted/40" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Resumen general</h2>
        <p className="text-sm text-muted-foreground">
          Indicadores clave de seguridad, salud ocupacional y medio ambiente
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Incidentes totales"
          value={stats.incidentes}
          icon={AlertTriangle}
          trend={`${stats.incidentesAbiertos} abiertos`}
          variant={stats.incidentesAbiertos > 0 ? 'warning' : 'default'}
        />
        <StatCard
          title="EPP con stock bajo"
          value={stats.eppStockBajo}
          icon={PackageX}
          trend="Requieren reposición"
          variant={stats.eppStockBajo > 0 ? 'danger' : 'success'}
        />
        <StatCard
          title="Capacitaciones"
          value={stats.capacitaciones}
          icon={GraduationCap}
          trend={`${stats.capacitacionesProgramadas} programadas`}
        />
        <StatCard
          title="Inspecciones"
          value={stats.inspecciones}
          icon={ClipboardCheck}
          trend={`${stats.inspeccionesPendientes} pendientes`}
          variant={stats.inspeccionesPendientes > 0 ? 'warning' : 'default'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Incidentes por mes</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <MiniBarChart data={incidentesPorMes} />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Incidentes por tipo</CardTitle>
            <CardDescription>Distribución de reportes</CardDescription>
          </CardHeader>
          <CardContent>
            {incidentesPorTipo.length > 0 ? (
              <DonutChart segments={incidentesPorTipo} />
            ) : (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
                No hay incidentes registrados
              </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
