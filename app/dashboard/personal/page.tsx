'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Personal } from '@/lib/types';
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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const estadoOptions = [
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
];

const emptyForm = {
  nombre_completo: '',
  documento: '',
  cargo: '',
  area: '',
  estado: 'activo',
};

export default function PersonalPage() {
  const [data, setData] = useState<Personal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from('personal')
      .select('*')
      .order('nombre_completo');
    if (error) {
      toast.error('Error al cargar el personal');
    }
    setData((rows as Personal[]) || []);
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

  const openEdit = (item: Personal) => {
    setEditingId(item.id);
    setForm({
      nombre_completo: item.nombre_completo,
      documento: item.documento,
      cargo: item.cargo,
      area: item.area,
      estado: item.estado,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nombre_completo.trim()) {
      toast.error('El nombre completo es obligatorio');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase.from('personal').update(form).eq('id', editingId);
        if (error) throw error;
        toast.success('Trabajador actualizado');
      } else {
        const { error } = await supabase.from('personal').insert(form);
        if (error) throw error;
        toast.success('Trabajador agregado');
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
    const { error } = await supabase.from('personal').delete().eq('id', id);
    if (error) {
      toast.error('Error al eliminar');
    } else {
      toast.success('Trabajador eliminado');
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Personal</h2>
          <p className="text-sm text-muted-foreground">
            Registro de trabajadores reutilizable en EPP, capacitaciones e incidentes
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Agregar trabajador
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
              <Users className="h-8 w-8 opacity-50" />
              <p className="text-sm">No hay trabajadores registrados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre completo</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-sm font-medium">{item.nombre_completo}</TableCell>
                    <TableCell className="text-sm">{item.documento || '-'}</TableCell>
                    <TableCell className="text-sm">{item.cargo || '-'}</TableCell>
                    <TableCell className="text-sm">{item.area || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={item.estado === 'activo' ? 'default' : 'secondary'}>
                        {item.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar trabajador' : 'Agregar trabajador'}</DialogTitle>
            <DialogDescription>
              Estos datos quedarán disponibles para usar en otros módulos
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Nombre completo *</Label>
              <Input
                value={form.nombre_completo}
                onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })}
                placeholder="Juan Pérez García"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Documento / DNI</Label>
                <Input
                  value={form.documento}
                  onChange={(e) => setForm({ ...form, documento: e.target.value })}
                  placeholder="12345678"
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Input
                  value={form.cargo}
                  onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                  placeholder="Operario, Supervisor..."
                />
              </div>
              <div className="space-y-2">
                <Label>Área</Label>
                <Input
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value })}
                  placeholder="Producción, Mantenimiento..."
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? 'Guardar cambios' : 'Agregar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
