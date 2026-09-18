export type Incidente = {
  id: string;
  fecha: string;
  tipo: string;
  severidad: string;
  descripcion: string;
  ubicacion: string;
  area: string;
  estado: string;
  acciones: string;
  created_by: string;
  created_at: string;
};

export type EppItem = {
  id: string;
  nombre: string;
  categoria: string;
  talla: string;
  stock: number;
  stock_minimo: number;
  norma: string;
  created_by: string;
  created_at: string;
};

export type EppEntrega = {
  id: string;
  fecha: string;
  trabajador: string;
  documento: string;
  epp_catalog_id: string | null;
  cantidad: number;
  firma: string;
  created_by: string;
  created_at: string;
  epp_catalog?: EppItem | null;
};

export type Capacitacion = {
  id: string;
  titulo: string;
  tema: string;
  fecha: string;
  duracion_horas: number;
  instructor: string;
  modalidad: string;
  estado: string;
  asistentes: number;
  created_by: string;
  created_at: string;
};

export type ChecklistItem = {
  label: string;
  checked: boolean;
};

export type Inspeccion = {
  id: string;
  titulo: string;
  fecha: string;
  area: string;
  inspector: string;
  tipo: string;
  checklist: ChecklistItem[];
  puntaje: number;
  hallazgos: string;
  estado: string;
  created_by: string;
  created_at: string;
};

export type Profile = {
  id: string;
  full_name: string;
  role: string;
  department: string;
  is_admin: boolean;
  created_at: string;
};

export type Personal = {
  id: string;
  nombre_completo: string;
  documento: string;
  cargo: string;
  area: string;
  estado: string;
  proyecto_id: string | null;
  created_by: string;
  created_at: string;
  proyectos?: Proyecto | null;
};

export type Proyecto = {
  id: string;
  nombre: string;
  estado: string;
  created_by: string;
  created_at: string;
};

export type PersonalDocumento = {
  id: string;
  personal_id: string;
  tipo_documento: string;
  estado: string;
  vigencia: string | null;
  observaciones: string;
  created_by: string;
  created_at: string;
};

export type Equipo = {
  id: string;
  tipo: string;
  marca_modelo: string;
  numero: string;
  proyecto_id: string | null;
  estado: string;
  created_by: string;
  created_at: string;
  proyectos?: Proyecto | null;
};

export type EquipoDocumento = {
  id: string;
  equipo_id: string;
  tipo_documento: string;
  estado: string;
  vigencia: string | null;
  observaciones: string;
  created_by: string;
  created_at: string;
};
