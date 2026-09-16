'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { EppItem, EppEntrega } from '@/lib/types';
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
import { Plus, Pencil, Trash2, HardHat, Loader2, PackageX, PackageCheck } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { StatCard } from '@/components/shared/stat-card';

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

export default function EppPage() {
  const [catalog, setCatalog] = useState<EppItem[]>([]);
  const [entregas, setEntregas] = useState<EppEntrega[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('catalogo');

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
    const [cat, ent] = await Promise.all([
      supabase.from('epp_catalog').select('*').order('nombre'),
      supabase.from('epp_entregas').select('*, epp_catalog(*)').order('fecha', { ascending: false }),
    ]);
    setCatalog((cat.data as EppItem[]) || []);
    setEntregas((ent.data as EppEntrega[]) || []);
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
          <TabsTrigger value="catalogo">Catálogo</TabsTrigger>
          <TabsTrigger value="entregas">Entregas</TabsTrigger>
        </TabsList>

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
