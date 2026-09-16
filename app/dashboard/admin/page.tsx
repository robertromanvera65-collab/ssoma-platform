'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth';
import { Profile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { Pencil, Users, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminPage() {
  const { isAdmin, loading: authLoading, user } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ full_name: '', role: '', department: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [authLoading, isAdmin, router]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Error al cargar usuarios');
    }
    setData((rows as Profile[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin, loadData]);

  const openEdit = (item: Profile) => {
    setEditingId(item.id);
    setForm({
      full_name: item.full_name,
      role: item.role,
      department: item.department,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(form)
        .eq('id', editingId);
      if (error) throw error;
      toast.success('Usuario actualizado');
      setDialogOpen(false);
      loadData();
    } catch (err) {
      toast.error('Error al guardar los cambios');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleAdmin = async (item: Profile, value: boolean) => {
    if (item.id === user?.id && !value) {
      toast.error('No puedes quitarte el rol de administrador a ti mismo');
      return;
    }
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: value })
      .eq('id', item.id);
    if (error) {
      toast.error('Error al actualizar el rol');
      return;
    }
    toast.success(value ? 'Ahora es administrador' : 'Rol de administrador removido');
    setData((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, is_admin: value } : p))
    );
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Administración de usuarios</h2>
        <p className="text-sm text-muted-foreground">
          Gestiona los perfiles registrados y otorga o revoca permisos de administrador
        </p>
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
              <p className="text-sm">No hay usuarios registrados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Registrado</TableHead>
                  <TableHead>Administrador</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-sm font-medium">
                      {item.full_name || '—'}
                      {item.id === user?.id && (
                        <Badge variant="secondary" className="ml-2 text-xs">Tú</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{item.role || '—'}</TableCell>
                    <TableCell className="text-sm">{item.department || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {format(new Date(item.created_at), 'dd MMM yyyy', { locale: es })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.is_admin}
                          onCheckedChange={(v) => toggleAdmin(item, v)}
                        />
                        {item.is_admin && (
                          <ShieldCheck className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(item)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
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
            <DialogTitle>Editar usuario</DialogTitle>
            <DialogDescription>
              Actualiza los datos de perfil de este usuario
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Nombre completo</Label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Input
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="Supervisor SSOMA, Inspector..."
              />
            </div>
            <div className="space-y-2">
              <Label>Departamento</Label>
              <Input
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
