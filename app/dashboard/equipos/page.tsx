'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Equipo, EquipoDocumento, Proyecto } from '@/lib/types';
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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Truck, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const tiposEquipoComunes = [
  'Camión Grúa',
  'Compresora de Aire Portátil',
  'Excavadora',
  'Cargador Frontal',
  'Generador',
  'Otro',
];

const estadoOptions = [
  { value: 'habilitado', label: 'Habilitado' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'no_autorizado', label: 'No autorizado' },
];

const estadoBadge: Record<string, string> = {
  habilitado: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  en_proceso: 'bg-amber-100 text-amber-700 border-amber-200',
  no_autorizado: 'bg-red-100 text-red-700 border-red-200',
};

const estadoLabel: Record<string, string> = {
  habilitado: 'Habilitado',
  en_proceso: 'En proceso',
  no_autorizado: 'No autorizado',
};

const emptyForm = {
  tipo: 'Camión Grúa',
  tipo_otro: '',
  marca_modelo: '',
  numero: '',
  proyecto_id: '',
  estado: 'en_proceso',
};

const tiposDocumentoComunes = [
  'Programa de Mantenimiento',
  'Certificado de Mantenimiento',
  'Manual de Operaciones',
  'Manual de Mantenimiento',
  'Certificado de Operatividad',
  'Poliza TREC',
  'Checklist Inicial',
  'Otro',
];

const estadoDocOptions = [
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'vencido', label: 'Vencido' },
  { value: 'no_aplica', label: 'No aplica' },
];

const estadoDocBadge: Record<string, string> = {
  aprobado: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  pendiente: 'bg-amber-100 text-amber-700 border-amber-200',
  vencido: 'bg-red-100 text-red-700 border-red-200',
  no_aplica: 'bg-slate-100 text-slate-500 border-slate-200',
};

const estadoDocLabel: Record<string, string> = {
  aprobado: 'Aprobado',
  pendiente: 'Pendiente',
  vencido: 'Vencido',
  no_aplica: 'No aplica',
};

const emptyDocForm = {
  tipo_documento: 'Certificado de Operatividad',
  tipo_otro: '',
  estado: 'pendiente',
  vigencia: '',
  observaciones: '',
};

export default function EquiposPage() {
  const [data, setData] = useState<Equipo[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Documentos por equipo
  const [docsDialogOpen, setDocsDialogOpen] = useState(false);
  const [activeEquipo, setActiveEquipo] = useState<Equipo | null>(null);
  const [docs, setDocs] = useState<EquipoDocumento[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docFormOpen, setDocFormOpen] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [docForm, setDocForm] = useState(emptyDocForm);
  const [savingDoc, setSavingDoc] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [rowsRes, proyRes] = await Promise.all([
      supabase.from('equipos').select('*, proyectos(*)').order('tipo'),
      supabase.from('proyectos').select('*').order('nombre'),
    ]);
    if (rowsRes.error) toast.error('Error al cargar equipos');
    setData((rowsRes.data as Equipo[]) || []);
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

  const openEdit = (item: Equipo) => {
    setEditingId(item.id);
    const esComun = tiposEquipoComunes.slice(0, -1).includes(item.tipo);
    setForm({
      tipo: esComun ? item.tipo : 'Otro',
      tipo_otro: esComun ? '' : item.tipo,
      marca_modelo: item.marca_modelo,
      numero: item.numero,
      proyecto_id: item.proyecto_id || '',
      estado: item.estado,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const tipoFinal = form.tipo === 'Otro' ? form.tipo_otro.trim() : form.tipo;
    if (!tipoFinal) {
      toast.error('Especifica el tipo de equipo');
      return;
    }
    setSaving(true);
    const payload = {
      tipo: tipoFinal,
      marca_modelo: form.marca_modelo,
      numero: form.numero,
      proyecto_id: form.proyecto_id || null,
      estado: form.estado,
    };
    try {
      if (editingId) {
        const { error } = await supabase.from('equipos').update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success('Equipo actualizado');
      } else {
        const { error } = await supabase.from('equipos').insert(payload);
        if (error) throw error;
        toast.success('Equipo agregado');
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
    const { error } = await supabase.from('equipos').delete().eq('id', id);
    if (error) {
      toast.error('Error al eliminar');
    } else {
      toast.success('Equipo eliminado');
      loadData();
    }
  };

  // --- Documentos por equipo ---
  const openDocs = async (equipo: Equipo) => {
    setActiveEquipo(equipo);
    setDocsDialogOpen(true);
    setDocsLoading(true);
    const { data: rows, error } = await supabase
      .from('equipos_documentos')
      .select('*')
      .eq('equipo_id', equipo.id)
      .order('tipo_documento');
    if (error) toast.error('Error al cargar documentos');
    setDocs((rows as EquipoDocumento[]) || []);
    setDocsLoading(false);
  };

  const reloadDocs = async () => {
    if (!activeEquipo) return;
    const { data: rows } = await supabase
      .from('equipos_documentos')
      .select('*')
      .eq('equipo_id', activeEquipo.id)
      .order('tipo_documento');
    setDocs((rows as EquipoDocumento[]) || []);
  };

  const isVencido = (vigencia: string | null) => {
    if (!vigencia) return false;
    return new Date(vigencia) < new Date(new Date().toDateString());
  };

  const openCreateDoc = () => {
    setEditingDocId(null);
    setDocForm(emptyDocForm);
    setDocFormOpen(true);
  };

  const openEditDoc = (doc: EquipoDocumento) => {
    setEditingDocId(doc.id);
    const esComun = tiposDocumentoComunes.slice(0, -1).includes(doc.tipo_documento);
    setDocForm({
      tipo_documento: esComun ? doc.tipo_documento : 'Otro',
      tipo_otro: esComun ? '' : doc.tipo_documento,
      estado: doc.estado,
      vigencia: doc.vigencia || '',
      observaciones: doc.observaciones || '',
    });
    setDocFormOpen(true);
  };

  const handleSaveDoc = async () => {
    if (!activeEquipo) return;
    const tipoFinal = docForm.tipo_documento === 'Otro' ? docForm.tipo_otro.trim() : docForm.tipo_documento;
    if (!tipoFinal) {
      toast.error('Especifica el tipo de documento');
      return;
    }
    setSavingDoc(true);
    const payload = {
      equipo_id: activeEquipo.id,
      tipo_documento: tipoFinal,
      estado: docForm.estado,
      vigencia: docForm.vigencia || null,
      observaciones: docForm.observaciones,
    };
    try {
      if (editingDocId) {
        const { error } = await supabase.from('equipos_documentos').update(payload).eq('id', editingDocId);
        if (error) throw error;
        toast.success('Documento actualizado');
      } else {
        const { error } = await supabase.from('equipos_documentos').insert(payload);
        if (error) throw error;
        toast.success('Documento agregado');
      }
      setDocFormOpen(false);
      reloadDocs();
    } catch (err) {
      toast.error('Error al guardar el documento');
      console.error(err);
    } finally {
      setSavingDoc(false);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    const { error } = await supabase.from('equipos_documentos').delete().eq('id', id);
    if (error) {
      toast.error('Error al eliminar');
    } else {
      toast.success('Documento eliminado');
      reloadDocs();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Equipos</h2>
          <p className="text-sm text-muted-foreground">
            Maquinaria y equipos con sus documentos y vigencias
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Agregar equipo
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
              <Truck className="h-8 w-8 opacity-50" />
              <p className="text-sm">No hay equipos registrados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Marca / Modelo</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-sm font-medium">{item.tipo}</TableCell>
                    <TableCell className="text-sm">{item.marca_modelo || '-'}</TableCell>
                    <TableCell className="text-sm">{item.numero || '-'}</TableCell>
                    <TableCell className="text-sm">{item.proyectos?.nombre || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={estadoBadge[item.estado]}>
                        {estadoLabel[item.estado] || item.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openDocs(item)} className="h-8 w-8" title="Documentos">
                          <FileText className="h-4 w-4" />
                        </Button>
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
            <DialogTitle>{editingId ? 'Editar equipo' : 'Agregar equipo'}</DialogTitle>
            <DialogDescription>Registra la maquinaria o equipo de la empresa</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Tipo de equipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {tiposEquipoComunes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.tipo === 'Otro' && (
              <div className="space-y-2">
                <Label>Especifica el tipo</Label>
                <Input
                  value={form.tipo_otro}
                  onChange={(e) => setForm({ ...form, tipo_otro: e.target.value })}
                  placeholder="Nombre del equipo"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Marca / Modelo</Label>
                <Input
                  value={form.marca_modelo}
                  onChange={(e) => setForm({ ...form, marca_modelo: e.target.value })}
                  placeholder="DONGFENG C42-712"
                />
              </div>
              <div className="space-y-2">
                <Label>Número / Placa</Label>
                <Input
                  value={form.numero}
                  onChange={(e) => setForm({ ...form, numero: e.target.value })}
                  placeholder="DB113996"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
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

      {/* Documentos del equipo */}
      <Dialog open={docsDialogOpen} onOpenChange={setDocsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Documentos — {activeEquipo?.tipo} {activeEquipo?.numero && `(${activeEquipo.numero})`}</DialogTitle>
            <DialogDescription>Estado y vigencia de los documentos de este equipo</DialogDescription>
          </DialogHeader>

          <div className="flex justify-end">
            <Button size="sm" onClick={openCreateDoc} className="gap-2">
              <Plus className="h-4 w-4" />
              Agregar documento
            </Button>
          </div>

          {docsLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : docs.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
              <FileText className="h-8 w-8 opacity-50" />
              <p className="text-sm">Sin documentos registrados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Vigencia</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map((doc) => {
                  const vencido = doc.estado !== 'no_aplica' && isVencido(doc.vigencia);
                  return (
                    <TableRow key={doc.id}>
                      <TableCell className="text-sm font-medium">{doc.tipo_documento}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={estadoDocBadge[vencido ? 'vencido' : doc.estado]}>
                          {vencido ? 'Vencido' : estadoDocLabel[doc.estado] || doc.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {doc.vigencia ? format(new Date(doc.vigencia), 'dd MMM yyyy', { locale: es }) : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditDoc(doc)} className="h-8 w-8">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteDoc(doc.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDocsDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Formulario de documento */}
      <Dialog open={docFormOpen} onOpenChange={setDocFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDocId ? 'Editar documento' : 'Agregar documento'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Tipo de documento</Label>
              <Select
                value={docForm.tipo_documento}
                onValueChange={(v) => setDocForm({ ...docForm, tipo_documento: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {tiposDocumentoComunes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {docForm.tipo_documento === 'Otro' && (
              <div className="space-y-2">
                <Label>Especifica el documento</Label>
                <Input
                  value={docForm.tipo_otro}
                  onChange={(e) => setDocForm({ ...docForm, tipo_otro: e.target.value })}
                  placeholder="Nombre del documento"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={docForm.estado} onValueChange={(v) => setDocForm({ ...docForm, estado: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {estadoDocOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vigencia</Label>
                <Input
                  type="date"
                  value={docForm.vigencia}
                  onChange={(e) => setDocForm({ ...docForm, vigencia: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                value={docForm.observaciones}
                onChange={(e) => setDocForm({ ...docForm, observaciones: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveDoc} disabled={savingDoc}>
              {savingDoc && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingDocId ? 'Guardar' : 'Agregar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
