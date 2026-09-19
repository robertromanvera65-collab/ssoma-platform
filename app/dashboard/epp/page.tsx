'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { EppItem, EppEntrega, Personal } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Pencil,
  Trash2,
  HardHat,
  Loader2,
  PackageX,
  PackageCheck,
  Wallet,
  Receipt,
  TrendingUp,
  Users,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { StatCard } from '@/components/shared/stat-card';

const BRAND = '#C81E1E';

const categoriaOptions = [
  { value: 'cabeza', label: 'Cabeza' },
  { value: 'ojos', label: 'Ojos' },
  { value: 'oidos', label: 'Oídos' },
  { value: 'respiratorio', label: 'Respiratorio' },
  { value: 'manos', label: 'Manos' },
  { value: 'pies', label: 'Pies' },
  { value: 'cuerpo', label: 'Cuerpo' },
];

const emptyCatalog = {
  nombre: '',
  categoria: 'cuerpo',
  talla: '',
  stock: 0,
  stock_minimo: 0,
  norma: '',
};

const emptyEntrega = {
  fecha: format(new Date(), 'yyyy-MM-dd'),
  trabajador: '',
  documento: '',
  epp_catalog_id: '',
  cantidad: 1,
  firma: '',
};

// ---------- tipos del dashboard de gasto ----------
interface EppResumen {
  total_entregas: number;
  gasto_total: number;
  costo_promedio: number;
  trabajadores_atendidos: number;
  obras_atendidas: number;
}
interface RankRow {
  label: string;
  value: number;
  entregas: number;
}
interface MesRow {
  mes: string;
  label: string;
  value: number;
}

// PostgREST devuelve las columnas "numeric" como texto para no perder
// precisión (ej. "92814.37"); esto las vuelve number de forma segura.
const num = (v: unknown): number => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return parseFloat(v) || 0;
  return 0;
};

const soles = (v: number) =>
  `S/ ${v.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function EppPage() {
  const [catalog, setCatalog] = useState<EppItem[]>([]);
  const [entregas, setEntregas] = useState<EppEntrega[]>([]);
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('dashboard');

  // Dashboard de gasto
  const [resumen, setResumen] = useState<EppResumen | null>(null);
  const [porItem, setPorItem] = useState<RankRow[]>([]);
  const [porObra, setPorObra] = useState<RankRow[]>([]);
  const [porCategoria, setPorCategoria] = useState<RankRow[]>([]);
  const [porTrabajador, setPorTrabajador] = useState<RankRow[]>([]);
  const [porMes, setPorMes] = useState<MesRow[]>([]);

  // Catalog dialog
  const [catDialog, setCatDialog] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catForm, setCatForm] = useState(emptyCatalog);
  const [savingCat, setSavingCat] = useState(false);

  // Entrega dialog
  const [entDialog, setEntDialog] = useState(false);
  const [entForm, setEntForm] = useState(emptyEntrega);
  const [savingEnt, setSavingEnt] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [cat, ent, per, resumenQ, itemQ, obraQ, categoriaQ, mesQ, trabajadorQ] = await Promise.all([
      supabase.from('epp_catalog').select('*').order('nombre'),
      supabase.from('epp_entregas').select('*, epp_catalog(*)').order('fecha', { ascending: false }),
      supabase.from('personal').select('*').eq('estado', 'activo').order('nombre_completo'),
      supabase.from('epp_resumen').select('*').maybeSingle(),
      supabase.from('epp_gasto_por_item').select('*').order('gasto_total', { ascending: false }).limit(8),
      supabase.from('epp_gasto_por_obra').select('*').order('gasto_total', { ascending: false }).limit(8),
      supabase.from('epp_gasto_por_categoria').select('*').order('gasto_total', { ascending: false }),
      supabase.from('epp_gasto_por_mes').select('*').order('mes', { ascending: true }),
      supabase.from('epp_gasto_por_trabajador').select('*').order('gasto_total', { ascending: false }).limit(10),
    ]);

    setCatalog((cat.data as EppItem[]) || []);
    setEntregas((ent.data as EppEntrega[]) || []);
    setPersonal((per.data as Personal[]) || []);

    if (resumenQ.data) {
      setResumen({
        total_entregas: num(resumenQ.data.total_entregas),
        gasto_total: num(resumenQ.data.gasto_total),
        costo_promedio: num(resumenQ.data.costo_promedio),
        trabajadores_atendidos: num(resumenQ.data.trabajadores_atendidos),
        obras_atendidas: num(resumenQ.data.obras_atendidas),
      });
    }

    setPorItem(
      ((itemQ.data as any[]) || []).map((r) => ({
        label: r.nombre || 'Sin nombre',
        value: num(r.gasto_total),
        entregas: num(r.entregas),
      }))
    );
    setPorObra(
      ((obraQ.data as any[]) || []).map((r) => ({
        label: r.obra || 'Sin obra',
        value: num(r.gasto_total),
        entregas: num(r.entregas),
      }))
    );
    setPorCategoria(
      ((categoriaQ.data as any[]) || [])
        .map((r) => ({
          label: r.categoria || 'Sin categoría',
          value: num(r.gasto_total),
          entregas: num(r.entregas),
        }))
        .sort((a, b) => b.value - a.value)
    );
    setPorTrabajador(
      ((trabajadorQ.data as any[]) || []).map((r) => ({
        label: r.trabajador || 'Sin nombre',
        value: num(r.gasto_total),
        entregas: num(r.entregas),
      }))
    );
    setPorMes(
      ((mesQ.data as any[]) || []).map((r) => ({
        mes: r.mes,
        label: format(new Date(r.mes), 'MMM yyyy', { locale: es }),
        value: num(r.gasto_total),
      }))
    );

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stockBajo = catalog.filter((c) => c.stock <= c.stock_minimo).length;
  const stockTotal = catalog.reduce((s, c) => s + c.stock, 0);

  // Catalog handlers
  const openCreateCat = () => {
    setEditingCatId(null);
    setCatForm(emptyCatalog);
    setCatDialog(true);
  };

  const openEditCat = (item: EppItem) => {
    setEditingCatId(item.id);
    setCatForm({
      nombre: item.nombre,
      categoria: item.categoria,
      talla: item.talla,
      stock: item.stock,
      stock_minimo: item.stock_minimo,
      norma: item.norma,
    });
    setCatDialog(true);
  };

  const handleSaveCat = async () => {
    if (!catForm.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    setSavingCat(true);
    try {
      if (editingCatId) {
        const { error } = await supabase.from('epp_catalog').update(catForm).eq('id', editingCatId);
        if (error) throw error;
        toast.success('EPP actualizado');
      } else {
        const { error } = await supabase.from('epp_catalog').insert(catForm);
        if (error) throw error;
        toast.success('EPP agregado al catálogo');
      }
      setCatDialog(false);
      loadData();
    } catch (err) {
      toast.error('Error al guardar');
      console.error(err);
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCat = async (id: string) => {
    const { error } = await supabase.from('epp_catalog').delete().eq('id', id);
    if (error) {
      toast.error('Error al eliminar');
    } else {
      toast.success('EPP eliminado del catálogo');
      loadData();
    }
  };

  // Entrega handlers
  const openCreateEnt = () => {
    setEntForm({ ...emptyEntrega, epp_catalog_id: catalog[0]?.id || '' });
    setEntDialog(true);
  };

  const handleSaveEnt = async () => {
    if (!entForm.trabajador.trim()) {
      toast.error('El nombre del trabajador es obligatorio');
      return;
    }
    if (!entForm.epp_catalog_id) {
      toast.error('Selecciona un EPP');
      return;
    }
    setSavingEnt(true);
    try {
      const { error } = await supabase.from('epp_entregas').insert({
        fecha: entForm.fecha,
        trabajador: entForm.trabajador,
        documento: entForm.documento,
        epp_catalog_id: entForm.epp_catalog_id,
        cantidad: entForm.cantidad,
        firma: entForm.firma || 'Confirmada',
      });
      if (error) throw error;

      // Decrement stock
      await supabase.rpc('decrement_stock', {
        p_id: entForm.epp_catalog_id,
        p_qty: entForm.cantidad,
      }).then(({ error: rpcErr }) => {
        if (rpcErr) {
          // Fallback: manual update
          const item = catalog.find((c) => c.id === entForm.epp_catalog_id);
          if (item) {
            supabase
              .from('epp_catalog')
              .update({ stock: Math.max(0, item.stock - entForm.cantidad) })
              .eq('id', item.id);
          }
        }
      });

      toast.success('Entrega registrada');
      setEntDialog(false);
      loadData();
    } catch (err) {
      toast.error('Error al registrar la entrega');
      console.error(err);
    } finally {
      setSavingEnt(false);
    }
  };

  const handleDeleteEnt = async (id: string) => {
    const { error } = await supabase.from('epp_entregas').delete().eq('id', id);
    if (error) {
      toast.error('Error al eliminar');
    } else {
      toast.success('Entrega eliminada');
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Equipos de protección personal</h2>
        <p className="text-sm text-muted-foreground">
          Gestión de catálogo de EPP y registro de entregas a trabajadores
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Items en catálogo" value={catalog.length} icon={HardHat} />
        <StatCard title="Stock total" value={stockTotal} icon={PackageCheck} variant="success" />
        <StatCard
          title="Stock bajo"
          value={stockBajo}
          icon={PackageX}
          variant={stockBajo > 0 ? 'danger' : 'success'}
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="catalogo">Catálogo</TabsTrigger>
          <TabsTrigger value="entregas">Entregas</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !resumen || resumen.total_entregas === 0 ? (
            <Card className="border-border/60">
              <CardContent className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
                <BarChart3 className="h-8 w-8 opacity-50" />
                <p className="text-sm">Aún no hay entregas registradas para mostrar el gasto</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Gasto total en EPP" value={soles(resumen.gasto_total)} icon={Wallet} />
                <StatCard title="Entregas registradas" value={resumen.total_entregas} icon={Receipt} />
                <StatCard
                  title="Costo promedio / entrega"
                  value={soles(resumen.costo_promedio)}
                  icon={TrendingUp}
                />
                <StatCard title="Trabajadores atendidos" value={resumen.trabajadores_atendidos} icon={Users} />
              </div>

              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="text-base">Gasto por mes</CardTitle>
                  <CardDescription>Evolución del gasto en EPP mes a mes</CardDescription>
                </CardHeader>
                <CardContent>
                  <MonthBars data={porMes} />
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle className="text-base">EPP que más se gasta</CardTitle>
                    <CardDescription>Top 8 artículos por costo total</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <BarList data={porItem} formatValue={soles} />
                  </CardContent>
                </Card>

                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle className="text-base">Gasto por obra / taller</CardTitle>
                    <CardDescription>Top 8 obras por costo total</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <BarList data={porObra} formatValue={soles} />
                  </CardContent>
                </Card>

                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle className="text-base">Gasto por categoría</CardTitle>
                    <CardDescription>Cabeza, manos, pies, cuerpo...</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <BarList
                      data={porCategoria.map((c) => ({ ...c, label: capitalize(c.label) }))}
                      formatValue={soles}
                    />
                  </CardContent>
                </Card>

                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle className="text-base">Trabajadores con más EPP entregado</CardTitle>
                    <CardDescription>Top 10 por costo acumulado</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <BarList data={porTrabajador} formatValue={soles} />
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="catalogo" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreateCat} className="gap-2">
              <Plus className="h-4 w-4" />
              Agregar EPP
            </Button>
          </div>

          <Card className="border-border/60">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : catalog.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
                  <HardHat className="h-8 w-8 opacity-50" />
                  <p className="text-sm">No hay items en el catálogo</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Talla</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Mínimo</TableHead>
                      <TableHead>Norma</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {catalog.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.nombre}</TableCell>
                        <TableCell className="capitalize text-sm">{item.categoria}</TableCell>
                        <TableCell className="text-sm">{item.talla || '-'}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              item.stock <= item.stock_minimo
                                ? 'bg-red-100 text-red-700 border-red-200'
                                : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            }
                          >
                            {item.stock}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{item.stock_minimo}</TableCell>
                        <TableCell className="text-sm">{item.norma || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditCat(item)} className="h-8 w-8">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteCat(item.id)} className="h-8 w-8 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entregas" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreateEnt} className="gap-2" disabled={catalog.length === 0}>
              <Plus className="h-4 w-4" />
              Registrar entrega
            </Button>
          </div>

          <Card className="border-border/60">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : entregas.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
                  <PackageCheck className="h-8 w-8 opacity-50" />
                  <p className="text-sm">No hay entregas registradas</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Trabajador</TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead>EPP</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entregas.map((ent) => (
                      <TableRow key={ent.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {format(new Date(ent.fecha), 'dd MMM yyyy', { locale: es })}
                        </TableCell>
                        <TableCell className="font-medium">{ent.trabajador}</TableCell>
                        <TableCell className="text-sm">{ent.documento || '-'}</TableCell>
                        <TableCell className="text-sm">{ent.epp_catalog?.nombre || '-'}</TableCell>
                        <TableCell className="text-sm">{ent.cantidad}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteEnt(ent.id)} className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Catalog Dialog */}
      <Dialog open={catDialog} onOpenChange={setCatDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCatId ? 'Editar EPP' : 'Agregar EPP al catálogo'}</DialogTitle>
            <DialogDescription>Registra el equipo de protección personal</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={catForm.nombre}
                onChange={(e) => setCatForm({ ...catForm, nombre: e.target.value })}
                placeholder="Casco de seguridad..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select value={catForm.categoria} onValueChange={(v) => setCatForm({ ...catForm, categoria: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categoriaOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Talla</Label>
                <Input
                  value={catForm.talla}
                  onChange={(e) => setCatForm({ ...catForm, talla: e.target.value })}
                  placeholder="M, L, XL..."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stock actual</Label>
                <Input
                  type="number"
                  value={catForm.stock}
                  onChange={(e) => setCatForm({ ...catForm, stock: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Stock mínimo</Label>
                <Input
                  type="number"
                  value={catForm.stock_minimo}
                  onChange={(e) => setCatForm({ ...catForm, stock_minimo: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Norma de certificación</Label>
              <Input
                value={catForm.norma}
                onChange={(e) => setCatForm({ ...catForm, norma: e.target.value })}
                placeholder="ANSI Z89.1..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveCat} disabled={savingCat}>
              {savingCat && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingCatId ? 'Guardar' : 'Agregar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Entrega Dialog */}
      <Dialog open={entDialog} onOpenChange={setEntDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar entrega de EPP</DialogTitle>
            <DialogDescription>Registra la entrega de equipo a un trabajador</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={entForm.fecha}
                  onChange={(e) => setEntForm({ ...entForm, fecha: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  min={1}
                  value={entForm.cantidad}
                  onChange={(e) => setEntForm({ ...entForm, cantidad: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Trabajador registrado (opcional)</Label>
              <Select
                value=""
                onValueChange={(v) => {
                  const p = personal.find((x) => x.id === v);
                  if (p) {
                    setEntForm({ ...entForm, trabajador: p.nombre_completo, documento: p.documento });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={personal.length ? 'Elegir de la lista de Personal...' : 'No hay personal registrado aún'} />
                </SelectTrigger>
                <SelectContent>
                  {personal.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre_completo} {p.documento && `(${p.documento})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Trabajador *</Label>
              <Input
                value={entForm.trabajador}
                onChange={(e) => setEntForm({ ...entForm, trabajador: e.target.value })}
                placeholder="Nombre del trabajador"
              />
            </div>
            <div className="space-y-2">
              <Label>Documento / ID</Label>
              <Input
                value={entForm.documento}
                onChange={(e) => setEntForm({ ...entForm, documento: e.target.value })}
                placeholder="DNI, código..."
              />
            </div>
            <div className="space-y-2">
              <Label>EPP entregado</Label>
              <Select
                value={entForm.epp_catalog_id}
                onValueChange={(v) => setEntForm({ ...entForm, epp_catalog_id: v })}
              >
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {catalog.map((c) => (
                    <SelectItem key={c.id} value={c.id} disabled={c.stock <= 0}>
                      {c.nombre} {c.talla && `(${c.talla})`} — Stock: {c.stock}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEntDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveEnt} disabled={savingEnt}>
              {savingEnt && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar entrega
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** Lista de barras horizontales (ranking) para un solo indicador de costo. */
function BarList({
  data,
  formatValue,
}: {
  data: RankRow[];
  formatValue: (v: number) => string;
}) {
  if (data.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Sin datos todavía</p>;
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium" title={d.label}>
              {d.label}
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">{formatValue(d.value)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.max(2, (d.value / max) * 100)}%`,
                backgroundColor: BRAND,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Barras verticales de gasto por mes. */
function MonthBars({ data }: { data: MesRow[] }) {
  if (data.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Sin datos todavía</p>;
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  const H = 160;
  return (
    <div className="flex items-end gap-3 overflow-x-auto pb-1">
      {data.map((d) => {
        const h = Math.max(4, Math.round((d.value / max) * H));
        return (
          <div key={d.mes} className="flex min-w-[52px] flex-col items-center gap-2">
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}k` : Math.round(d.value)}
            </span>
            <div
              className="w-8 rounded-t-md transition-all"
              style={{ height: `${h}px`, backgroundColor: BRAND }}
              title={`${d.label}: ${soles(d.value)}`}
            />
            <span className="whitespace-nowrap text-[11px] capitalize text-muted-foreground">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
