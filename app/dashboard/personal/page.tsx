'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Personal, Proyecto } from '@/lib/types';
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
import { Plus, Pencil, Trash2, Users, Loader2, Upload } from 'lucide-react';
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
  proyecto_id: '',
};

export default function PersonalPage() {
  const [data, setData] = useState<Personal[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [rowsRes, proyRes] = await Promise.all([
      supabase.from('personal').select('*, proyectos(*)').order('nombre_completo'),
      supabase.from('proyectos').select('*').order('nombre'),
    ]);
    if (rowsRes.error) {
      toast.error('Error al cargar el personal');
    }
    setData((rowsRes.data as Personal[]) || []);
    setProyectos((proyRes.data as Proyecto[]) || []);
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
      proyecto_id: item.proyecto_id || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nombre_completo.trim()) {
      toast.error('El nombre completo es obligatorio');
      return;
    }
    setSaving(true);
    const payload = { ...form, proyecto_id: form.proyecto_id || null };
    try {
      if (editingId) {
        const { error } = await supabase.from('personal').update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success('Trabajador actualizado');
      } else {
        const { error } = await supabase.from('personal').insert(payload);
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

  // --- Importación desde CSV ---
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  const parseCsvLine = (line: string, delimiter: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result.map((v) => v.replace(/^"|"$/g, ''));
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        toast.error('El archivo no tiene datos para importar');
        return;
      }

      const delimiter = lines[0].includes(';') ? ';' : ',';
      const headers = parseCsvLine(lines[0], delimiter).map(normalize);

      const findCol = (candidates: string[]) =>
        headers.findIndex((h) => candidates.some((c) => h.includes(c)));

      const idxNombre = findCol(['personal', 'nombre', 'trabajador']);
      const idxArea = findCol(['area']);
      const idxDocumento = findCol(['numero', 'documento', 'dni']);
      const idxCargo = findCol(['cargo', 'puesto']);

      if (idxNombre === -1) {
        toast.error('No se encontró una columna de nombre (Personal / Nombre)');
        return;
      }

      const rows = lines.slice(1).map((line) => {
        const cols = parseCsvLine(line, delimiter);
        return {
          nombre_completo: cols[idxNombre]?.trim() || '',
          area: idxArea !== -1 ? cols[idxArea]?.trim() || '' : '',
          documento: idxDocumento !== -1 ? cols[idxDocumento]?.trim() || '' : '',
          cargo: idxCargo !== -1 ? cols[idxCargo]?.trim() || '' : '',
          estado: 'activo',
        };
      }).filter((r) => r.nombre_completo && r.nombre_completo !== '#');

      if (rows.length === 0) {
        toast.error('No se encontraron filas válidas para importar');
        return;
      }

      const { error } = await supabase.from('personal').insert(rows);
      if (error) throw error;

      toast.success(`${rows.length} trabajadores importados correctamente`);
      loadData();
    } catch (err) {
      toast.error('Error al importar el archivo');
      console.error(err);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImportFile}
          />
          <Button
            variant="outline"
            className="gap-2"
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Importar desde CSV
          </Button>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Agregar trabajador
          </Button>
        </div>
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
                  <TableHead>Proyecto</TableHead>
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
                    <TableCell className="text-sm">{item.proyectos?.nombre || '-'}</TableCell>
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
            <div className="space-y-2">
              <Label>Proyecto asignado</Label>
              <Select
                value={form.proyecto_id || 'none'}
                onValueChange={(v) => setForm({ ...form, proyecto_id: v === 'none' ? '' : v })}
              >
                <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {proyectos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
