'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Proyecto, Personal } from '@/lib/types';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Building2, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';

const estadoOptions = [
  { value: 'habilitado', label: 'Habilitado' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'deshabilitado', label: 'Deshabilitado' },
];

const estadoBadge: Record<string, string> = {
  habilitado: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  en_proceso: 'bg-amber-100 text-amber-700 border-amber-200',
  deshabilitado: 'bg-red-100 text-red-700 border-red-200',
};

const estadoLabel: Record<string, string> = {
  habilitado: 'Habilitado',
  en_proceso: 'En proceso',
  deshabilitado: 'Deshabilitado',
};

const emptyForm = {
  nombre: '',
  estado: 'en_proceso',
};

export default function ProyectosPage() {
  const [data, setData] = useState<Proyecto[]>([]);
  const [personalCounts, setPersonalCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [proy, pers] = await Promise.all([
      supabase.from('proyectos').select('*').order('nombre'),
      supabase.from('personal').select('proyecto_id'),
    ]);
    setData((proy.data as Proyecto[]) || []);

    const counts: Record<string, number> = {};
    ((pers.data as { proyecto_id: string | null }[]) || []).forEach((p) => {
      if (p.proyecto_id) counts[p.proyecto_id] = (counts[p.proyecto_id] || 0) + 1;
    });
    setPersonalCounts(counts);
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

  const openEdit = (item: Proyecto) => {
    setEditingId(item.id);
    setForm({ nombre: item.nombre, estado: item.estado });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      toast.error('El nombre del proyecto es obligatorio');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase.from('proyectos').update(form).eq('id', editingId);
        if (error) throw error;
        toast.success('Proyecto actualizado');
      } else {
        const { error } = await supabase.from('proyectos').insert(form);
        if (error) throw error;
        toast.success('Proyecto creado');
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
    const { error } = await supabase.from('proyectos').delete().eq('id', id);
    if (error) {
      toast.error('Error al eliminar');
    } else {
      toast.success('Proyecto eliminado');
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Proyectos</h2>
          <p className="text-sm text-muted-foreground">
            Obras y proyectos activos de la empresa
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo proyecto
        </Button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : data.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
            <Building2 className="h-8 w-8 opacity-50" />
            <p className="text-sm">No hay proyectos registrados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((item) => (
            <Card key={item.id} className="border-border/60">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-bold">{item.nombre}</CardTitle>
                <Badge variant="outline" className={estadoBadge[item.estado]}>
                  {estadoLabel[item.estado] || item.estado}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {personalCounts[item.id] || 0} trabajadores asignados
                </div>
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(item)} className="h-8 w-8">
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar proyecto' : 'Nuevo proyecto'}</DialogTitle>
            <DialogDescription>
              Registra una obra o proyecto activo de la empresa
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Nombre del proyecto *</Label>
              <Input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="9 NOGALES, BOSQUE REAL..."
              />
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? 'Guardar cambios' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
