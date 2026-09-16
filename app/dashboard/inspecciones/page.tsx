'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Inspeccion, ChecklistItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { StatCard } from '@/components/shared/stat-card';
import { Plus, Pencil, Trash2, ClipboardCheck, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const tipoOptions = [
  { value: 'rutina', label: 'Rutina' },
  { value: 'especial', label: 'Especial' },
  { value: 'seguimiento', label: 'Seguimiento' },
];

const estadoOptions = [
  { value: 'programada', label: 'Programada' },
  { value: 'en-proceso', label: 'En proceso' },
  { value: 'completada', label: 'Completada' },
];

const defaultChecklist: ChecklistItem[] = [
  { label: 'Condiciones de orden y limpieza', checked: false },
  { label: 'Señalización de seguridad visible', checked: false },
  { label: 'Extintores vigentes y accesibles', checked: false },
  { label: 'EPP en uso por trabajadores', checked: false },
  { label: 'Rutas de evacuación despejadas', checked: false },
  { label: 'Equipos de trabajo en buen estado', checked: false },
  { label: 'Procedimientos de seguridad documentados', checked: false },
  { label: 'Brigada de emergencia asignada', checked: false },
];

const emptyForm = {
  titulo: '',
  fecha: format(new Date(), 'yyyy-MM-dd'),
  area: '',
  inspector: '',
  tipo: 'rutina',
  estado: 'programada',
  hallazgos: '',
};

export default function InspeccionesPage() {
  const [data, setData] = useState<Inspeccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(defaultChecklist);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase
      .from('inspecciones')
      .select('*')
      .order('fecha', { ascending: false });
    setData((rows as Inspeccion[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const promedioPuntaje = data.length > 0
    ? Math.round(data.reduce((s, i) => s + i.puntaje, 0) / data.length)
    : 0;
  const completadas = data.filter((i) => i.estado === 'completada').length;
  const pendientes = data.filter((i) => i.estado !== 'completada').length;

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setChecklist(defaultChecklist);
    setDialogOpen(true);
  };

  const openEdit = (item: Inspeccion) => {
    setEditingId(item.id);
    setForm({
      titulo: item.titulo,
      fecha: item.fecha,
      area: item.area,
      inspector: item.inspector,
      tipo: item.tipo,
      estado: item.estado,
      hallazgos: item.hallazgos,
    });
    setChecklist(item.checklist?.length > 0 ? item.checklist : defaultChecklist);
    setDialogOpen(true);
  };

  const toggleChecklist = (index: number) => {
    setChecklist((prev) => prev.map((item, i) => (i === index ? { ...item, checked: !item.checked } : item)));
  };

  const addChecklistItem = () => {
    setChecklist((prev) => [...prev, { label: 'Nuevo ítem', checked: false }]);
  };

  const removeChecklistItem = (index: number) => {
    setChecklist((prev) => prev.filter((_, i) => i !== index));
  };

  const updateChecklistLabel = (index: number, label: string) => {
    setChecklist((prev) => prev.map((item, i) => (i === index ? { ...item, label } : item)));
  };

  const puntaje = checklist.length > 0
    ? Math.round((checklist.filter((c) => c.checked).length / checklist.length) * 100)
    : 0;

  const handleSave = async () => {
    if (!form.titulo.trim()) {
      toast.error('El título es obligatorio');
      return;
    }
    setSaving(true);
    const payload = { ...form, checklist, puntaje };
    try {
      if (editingId) {
        const { error } = await supabase.from('inspecciones').update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success('Inspección actualizada');
      } else {
        const { error } = await supabase.from('inspecciones').insert(payload);
        if (error) throw error;
        toast.success('Inspección registrada');
      }
      setDialogOpen(false);
      loadData();
    } catch (err) {
      toast.error('Error al guardar');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('inspecciones').delete().eq('id', id);
    if (error) {
      toast.error('Error al eliminar');
    } else {
      toast.success('Inspección eliminada');
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Inspecciones</h2>
          <p className="text-sm text-muted-foreground">
            Registro de inspecciones de seguridad con checklist y puntaje de cumplimiento
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva inspección
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total inspecciones" value={data.length} icon={ClipboardCheck} />
        <StatCard title="Cumplimiento promedio" value={`${promedioPuntaje}%`} icon={CheckCircle2} variant={promedioPuntaje >= 80 ? 'success' : 'warning'} />
        <StatCard title="Completadas" value={completadas} icon={CheckCircle2} variant="success" />
        <StatCard title="Pendientes" value={pendientes} icon={ClipboardCheck} variant={pendientes > 0 ? 'warning' : 'default'} />
      </div>

      <Card className="border-border/60">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : data.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
              <ClipboardCheck className="h-8 w-8 opacity-50" />
              <p className="text-sm">No hay inspecciones registradas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="min-w-[180px]">Título</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Inspector</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cumplimiento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {format(new Date(item.fecha), 'dd MMM yyyy', { locale: es })}
                    </TableCell>
                    <TableCell className="font-medium">{item.titulo}</TableCell>
                    <TableCell className="text-sm">{item.area || '-'}</TableCell>
                    <TableCell className="text-sm">{item.inspector || '-'}</TableCell>
                    <TableCell className="capitalize text-sm">{item.tipo}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full transition-all ${
                              item.puntaje >= 80 ? 'bg-success' : item.puntaje >= 50 ? 'bg-warning' : 'bg-destructive'
                            }`}
                            style={{ width: `${item.puntaje}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{item.puntaje}%</span>
                      </div>
                    </TableCell>
                    <TableCell><StatusBadge status={item.estado} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)} className="h-8 w-8">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-destructive">
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar inspección' : 'Nueva inspección'}</DialogTitle>
            <DialogDescription>
              Completa el checklist de seguridad. El puntaje se calcula automáticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Inspección mensual de planta..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Área</Label>
                <Input
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value })}
                  placeholder="Producción, almacén..."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Inspector</Label>
                <Input
                  value={form.inspector}
                  onChange={(e) => setForm({ ...form, inspector: e.target.value })}
                  placeholder="Nombre del inspector"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {tipoOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-3 rounded-lg border border-border/60 p-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Checklist de seguridad</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Cumplimiento:</span>
                  <span className={`text-sm font-bold ${puntaje >= 80 ? 'text-success' : puntaje >= 50 ? 'text-warning' : 'text-destructive'}`}>
                    {puntaje}%
                  </span>
                </div>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    puntaje >= 80 ? 'bg-success' : puntaje >= 50 ? 'bg-warning' : 'bg-destructive'
                  }`}
                  style={{ width: `${puntaje}%` }}
                />
              </div>

              <div className="space-y-2">
                {checklist.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-md border border-border/40 p-2 hover:bg-accent/30">
                    <Checkbox checked={item.checked} onCheckedChange={() => toggleChecklist(i)} />
                    <Input
                      value={item.label}
                      onChange={(e) => updateChecklistLabel(i, e.target.value)}
                      className="h-8 flex-1 border-0 bg-transparent text-sm focus-visible:ring-1"
                    />
                    {item.checked ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground/40" />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeChecklistItem(i)}
                      className="h-7 w-7 text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button variant="outline" size="sm" onClick={addChecklistItem} className="w-full gap-2">
                <Plus className="h-3 w-3" />
                Agregar ítem
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {estadoOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Hallazgos</Label>
              <Textarea
                value={form.hallazgos}
                onChange={(e) => setForm({ ...form, hallazgos: e.target.value })}
                placeholder="Observaciones, no conformidades..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? 'Guardar cambios' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
