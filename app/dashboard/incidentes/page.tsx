'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Incidente } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
} from '@/components/ui/card';
import { StatusBadge, SeverityBadge } from '@/components/shared/status-badge';
import { Plus, Pencil, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const tipoOptions = [
  { value: 'accidente', label: 'Accidente' },
  { value: 'casi-accidente', label: 'Casi-accidente' },
  { value: 'condicion insegura', label: 'Condición insegura' },
  { value: 'acto inseguro', label: 'Acto inseguro' },
];

const severidadOptions = [
  { value: 'leve', label: 'Leve' },
  { value: 'moderado', label: 'Moderado' },
  { value: 'grave', label: 'Grave' },
  { value: 'critico', label: 'Crítico' },
];

const estadoOptions = [
  { value: 'reportado', label: 'Reportado' },
  { value: 'investigando', label: 'Investigando' },
  { value: 'cerrado', label: 'Cerrado' },
];

const emptyForm = {
  fecha: format(new Date(), 'yyyy-MM-dd'),
  tipo: 'accidente',
  severidad: 'leve',
  descripcion: '',
  ubicacion: '',
  area: '',
  estado: 'reportado',
  acciones: '',
};

export default function IncidentesPage() {
  const [data, setData] = useState<Incidente[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase
      .from('incidentes')
      .select('*')
      .order('fecha', { ascending: false });
    setData((rows as Incidente[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (item: Incidente) => {
    setEditingId(item.id);
    setForm({
      fecha: item.fecha,
      tipo: item.tipo,
      severidad: item.severidad,
      descripcion: item.descripcion,
      ubicacion: item.ubicacion,
      area: item.area,
      estado: item.estado,
      acciones: item.acciones,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.descripcion.trim()) {
      toast.error('La descripción es obligatoria');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('incidentes')
          .update(form)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Incidente actualizado');
      } else {
        const { error } = await supabase.from('incidentes').insert(form);
        if (error) throw error;
        toast.success('Incidente registrado');
      }
      setDialogOpen(false);
      loadData();
    } catch (err) {
      toast.error('Error al guardar el incidente');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('incidentes').delete().eq('id', id);
    if (error) {
      toast.error('Error al eliminar');
    } else {
      toast.success('Incidente eliminado');
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestión de incidentes</h2>
          <p className="text-sm text-muted-foreground">
            Registro y seguimiento de incidentes, accidentes y condiciones inseguras
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo incidente
        </Button>
      </div>

      <Card className="border-border/60">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : data.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
              <AlertTriangle className="h-8 w-8 opacity-50" />
              <p className="text-sm">No hay incidentes registrados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Severidad</TableHead>
                  <TableHead className="min-w-[200px]">Descripción</TableHead>
                  <TableHead>Área</TableHead>
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
                    <TableCell className="text-sm capitalize">{item.tipo}</TableCell>
                    <TableCell><SeverityBadge severity={item.severidad} /></TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm" title={item.descripcion}>
                      {item.descripcion}
                    </TableCell>
                    <TableCell className="text-sm">{item.area || '-'}</TableCell>
                    <TableCell><StatusBadge status={item.estado} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(item)}
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
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
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar incidente' : 'Nuevo incidente'}</DialogTitle>
            <DialogDescription>
              Registra los detalles del incidente para su seguimiento
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Severidad</Label>
                <Select value={form.severidad} onValueChange={(v) => setForm({ ...form, severidad: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {severidadOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
              <Label>Descripción *</Label>
              <Textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Describe qué ocurrió..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ubicación</Label>
                <Input
                  value={form.ubicacion}
                  onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
                  placeholder="Planta, área..."
                />
              </div>
              <div className="space-y-2">
                <Label>Área</Label>
                <Input
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value })}
                  placeholder="Producción, mantenimiento..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Acciones correctivas</Label>
              <Textarea
                value={form.acciones}
                onChange={(e) => setForm({ ...form, acciones: e.target.value })}
                placeholder="Medidas tomadas..."
                rows={2}
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
