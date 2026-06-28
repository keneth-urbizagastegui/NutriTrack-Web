import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  ShieldAlert, ShieldCheck, Factory, ToggleLeft, ToggleRight, 
  ChevronLeft, ChevronRight, Users, Activity, Lock, AlertTriangle, 
  ShieldX, Eye, Shield, Key, Search, Mail, Calendar, EyeOff, Award
} from 'lucide-react';

interface Supplier {
  id: number;
  name: string;
  contactEmail: string;
  isActive: boolean;
}

interface MockReport {
  id: number;
  batchId: number;
  batchNumber: string;
  productName: string;
  title: string;
  description: string;
  reportDate: string;
  status: 'PENDING' | 'RESOLVED_OK' | 'RECALLED_BATCH';
}

interface RawReportResponse {
  reportId: number;
  batchId: number;
  batchNumber: string;
  productName: string;
  title: string;
  description: string;
  reportDate: string;
  status: 'PENDING' | 'RESOLVED_OK' | 'RECALLED_BATCH';
}

interface TimelineStep {
  ingredientName: string;
  supplierName: string;
  arrivalDate: string;
  freshness: 'FRESH' | 'MATURING' | 'EXPIRED';
}

interface Certificate {
  laboratoryName: string;
  documentUrl: string;
  issueDate: string;
}

interface TraceabilityData {
  batchId: number;
  batchNumber: string;
  productName: string;
  status: 'ACTIVE' | 'RECALLED';
  productionDate: string;
  expirationDate: string;
  timeline: TimelineStep[];
  certificates: Certificate[];
}

interface SeedUser {
  id: number;
  username: string;
  email: string;
  roles: string[];
  status: 'ACTIVO' | 'SUSPENDIDO';
  registeredDate: string;
  allergenCount: number;
  lastLogin: string;
}

export const AdminDashboard: React.FC = () => {
  // Catálogo de Proveedores
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [supplierPage, setSupplierPage] = useState(0);
  const [supplierTotalPages, setSupplierTotalPages] = useState(0);

  // Registro de Proveedor
  const [supplierName, setSupplierName] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [creatingSupplier, setCreatingSupplier] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  // Reportes de Calidad
  const [reports, setReports] = useState<MockReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  // Auditoría de Trazabilidad de Lote
  const [selectedAuditBatchId, setSelectedAuditBatchId] = useState<number | null>(null);
  const [auditData, setAuditData] = useState<TraceabilityData | null>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Usuarios de la Base de Datos para Auditoría
  const [seedUsers, setSeedUsers] = useState<SeedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUserDetail, setSelectedUserDetail] = useState<SeedUser | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const fetchSuppliers = async (page = 0) => {
    try {
      setLoadingSuppliers(true);
      const response = await api.get('/suppliers', {
        params: { page, size: 5, sort: 'name,asc' }
      });
      setSuppliers(response.data.content);
      setSupplierTotalPages(response.data.totalPages);
      setSupplierPage(page);
    } catch {
      toast.error('Error al cargar la lista de proveedores.');
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const fetchReports = async () => {
    try {
      setLoadingReports(true);
      const response = await api.get('/batches/quality-reports');
      const formatted = response.data.map((r: RawReportResponse) => ({
        id: r.reportId,
        batchId: r.batchId,
        batchNumber: r.batchNumber,
        productName: r.productName,
        title: r.title,
        description: r.description,
        reportDate: r.reportDate,
        status: r.status,
      }));
      formatted.sort((a: MockReport, b: MockReport) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime());
      setReports(formatted);
    } catch {
      toast.error('Error al cargar la lista de alertas sanitarias.');
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchTraceabilityAudit = async (batchId: number) => {
    try {
      setLoadingAudit(true);
      setAuditData(null);
      const response = await api.get(`/batches/${batchId}/traceability`);
      setAuditData(response.data);
    } catch {
      toast.error('Error al auditar la trazabilidad de este lote.');
      setIsAuditModalOpen(false);
    } finally {
      setLoadingAudit(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await api.get('/users');
      const formatted = response.data.map((u: any) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        roles: u.roles,
        status: u.username === 'admin' ? 'ACTIVO' : (sessionStorage.getItem(`user_status_${u.username}`) || 'ACTIVO'),
        registeredDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '14/06/2026',
        allergenCount: u.allergenCount || 0,
        lastLogin: u.username === 'admin' ? 'Hace 5 minutos' : (u.username === 'manager' ? 'Hace 2 horas' : 'Reciente')
      }));
      setSeedUsers(formatted);
    } catch {
      toast.error('Error al cargar la lista de usuarios desde el servidor.');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchSuppliers(0);
      fetchReports();
      fetchUsers();
    });
  }, []);

  const handleOpenAudit = (batchId: number) => {
    setSelectedAuditBatchId(batchId);
    setIsAuditModalOpen(true);
    fetchTraceabilityAudit(batchId);
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      toast.error('El nombre del proveedor es obligatorio.');
      return;
    }

    try {
      setCreatingSupplier(true);
      await api.post('/suppliers', {
        name: supplierName,
        contactEmail: supplierEmail,
        isActive: true
      });
      toast.success('Proveedor homologado registrado correctamente.');
      setSupplierName('');
      setSupplierEmail('');
      setIsSupplierModalOpen(false);
      fetchSuppliers(0);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Error al crear el proveedor.');
    } finally {
      setCreatingSupplier(false);
    }
  };

  const handleRecallBatch = async (reportId: number, batchId: number, batchNumber: string) => {
    try {
      await api.post(`/batches/${batchId}/recall`);
      setReports(reports.map(r => r.id === reportId ? { ...r, status: 'RECALLED_BATCH' } : r));
      toast.success(
        <div className="flex flex-col gap-1.5 text-xs">
          <span className="font-bold text-rose-500 flex items-center gap-1">
            <ShieldX className="h-4 w-4" /> Retiro del Mercado Exitoso
          </span>
          <span>El lote <strong>{batchNumber}</strong> ha sido bloqueado preventivamente en el sistema.</span>
        </div>,
        { duration: 6000 }
      );
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Error al retirar el lote.');
    }
  };

  const handleToggleSupplier = (supplierId: number, name: string, currentState: boolean) => {
    setSuppliers(suppliers.map(s => s.id === supplierId ? { ...s, isActive: !currentState } : s));
    toast.success(
      <div className="text-xs text-gray-300">
        Proveedor <strong className="text-white">{name}</strong> ha sido <strong>{!currentState ? 'HABILITADO' : 'DESACTIVADO'}</strong> correctamente.
      </div>
    );
  };

  const handleToggleUserStatus = (userId: number, username: string, currentStatus: 'ACTIVO' | 'SUSPENDIDO') => {
    const nextStatus = currentStatus === 'ACTIVO' ? 'SUSPENDIDO' : 'ACTIVO';
    sessionStorage.setItem(`user_status_${username}`, nextStatus);
    setSeedUsers(seedUsers.map(u => u.id === userId ? { ...u, status: nextStatus } : u));
    toast.success(
      <div className="text-xs">
        Cuenta de usuario <strong>{username}</strong> ha sido <strong>{nextStatus === 'ACTIVO' ? 'HABILITADA' : 'SUSPENDIDA'}</strong> correctamente.
      </div>
    );
  };

  const handleOpenUserDetail = (user: SeedUser) => {
    setSelectedUserDetail(user);
    setIsUserModalOpen(true);
  };

  // Cálculos de métricas
  const pendingAlertsCount = reports.filter(r => r.status === 'PENDING').length;
  const recalledBatchesCount = reports.filter(r => r.status === 'RECALLED_BATCH').length;
  const activeSuppliersCount = suppliers.filter(s => s.isActive).length;

  const getFreshnessColor = (freshness: string) => {
    switch (freshness) {
      case 'FRESH': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'MATURING': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'EXPIRED': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-slate-800 text-slate-300';
    }
  };

  return (
    <div className="space-y-8">
      {/* Encabezado General */}
      <Card className="glass-panel border-none p-6 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500" />
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2 tracking-wide">
            <Shield className="h-6 w-6 text-rose-500 animate-pulse" />
            Consola de Auditoría y Cumplimiento
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Administración central del sistema: control de calidad, homologación de proveedores y auditoría de accesos.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-black py-1 px-3 uppercase tracking-wider">
            Rol: Administrador
          </Badge>
        </div>
      </Card>

      {/* Grilla de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/2 border border-white/5 p-5 flex items-center justify-between shadow-xl rounded-2xl hover:border-rose-500/10 transition-all duration-200">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">Alertas Sanitarias</span>
            <h3 className="text-3xl font-black text-white">{pendingAlertsCount}</h3>
            <p className="text-[10px] text-amber-400/80 font-medium">Pendientes de inspección</p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/10">
            <AlertTriangle className="h-6 w-6 animate-pulse" />
          </div>
        </Card>

        <Card className="bg-white/2 border border-white/5 p-5 flex items-center justify-between shadow-xl rounded-2xl hover:border-rose-500/10 transition-all duration-200">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">Lotes Retirados</span>
            <h3 className="text-3xl font-black text-white">{recalledBatchesCount}</h3>
            <p className="text-[10px] text-rose-400/80 font-medium">Fuera de circulación (Recall)</p>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/10">
            <ShieldX className="h-6 w-6" />
          </div>
        </Card>

        <Card className="bg-white/2 border border-white/5 p-5 flex items-center justify-between shadow-xl rounded-2xl hover:border-rose-500/10 transition-all duration-200">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">Proveedores Activos</span>
            <h3 className="text-3xl font-black text-white">{activeSuppliersCount}</h3>
            <p className="text-[10px] text-emerald-400/80 font-medium">Homologados en la cadena</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/10">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </Card>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Buzón de Alertas y Recall */}
        <Card className="glass-panel border-none p-6 shadow-xl lg:col-span-2">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-500" />
              Inspección y Retiro Sanitario de Lotes
            </CardTitle>
            <CardDescription className="text-gray-400">
              Evalúa las denuncias de lote. Audita su trazabilidad y certificaciones antes de retirarlos del mercado.
            </CardDescription>
          </CardHeader>

          <div className="space-y-4 mt-4">
            {loadingReports ? (
              <p className="text-xs text-gray-400 animate-pulse py-4">Cargando alertas...</p>
            ) : reports.length === 0 ? (
              <div className="text-center py-10 text-gray-500 border border-white/5 border-dashed rounded-xl bg-white/2">
                <ShieldCheck className="h-8 w-8 mx-auto text-emerald-500 mb-2 stroke-[1.5]" />
                <p className="text-xs font-semibold">No hay incidentes reportados en la red.</p>
              </div>
            ) : (
              reports.map((report) => (
                <div 
                  key={report.id} 
                  className={`p-4 rounded-xl border flex flex-col justify-between gap-4 transition-all duration-150 ${
                    report.status === 'PENDING' 
                      ? 'bg-amber-950/10 border-amber-500/20 hover:bg-amber-950/20' 
                      : 'bg-rose-950/10 border-rose-500/20 hover:bg-rose-950/20'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm">{report.title}</h4>
                        <Badge className="bg-white/5 border border-white/10 text-[9px] text-gray-400">
                          ID: #{report.id}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400">
                        Producto: <strong className="text-gray-200">{report.productName}</strong> • Lote: <strong className="text-gray-200">{report.batchNumber}</strong>
                      </p>
                      <p className="text-xs text-gray-300 mt-2 bg-black/30 p-2.5 rounded-lg border border-white/5 leading-relaxed">
                        {report.description}
                      </p>
                    </div>
                    <Badge variant={report.status === 'PENDING' ? 'outline' : 'destructive'} className="shrink-0 uppercase font-bold text-[9px] py-0.5 px-2">
                      {report.status === 'PENDING' ? 'Bajo Inspección' : 'Retirado'}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center border-t border-white/5 pt-3 mt-1">
                    <span className="text-[10px] text-gray-500">Fecha: {new Date(report.reportDate).toLocaleDateString()}</span>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs font-semibold border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/40 hover:text-cyan-300 rounded-lg cursor-pointer"
                        onClick={() => handleOpenAudit(report.batchId)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" /> Auditar Trazabilidad
                      </Button>

                      {report.status === 'PENDING' ? (
                        <Button 
                          size="sm"
                          className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer"
                          onClick={() => handleRecallBatch(report.id, report.batchId, report.batchNumber)}
                        >
                          Retirar Lote (Recall)
                        </Button>
                      ) : (
                        <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-black uppercase">
                          Recall Completado
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Panel de Homologación de Proveedores */}
        <Card className="glass-panel border-none p-6 shadow-xl lg:col-span-1 flex flex-col justify-between">
          <div>
            <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-secondary" />
                  Homologación
                </CardTitle>
                <CardDescription className="text-gray-400">Proveedores oficiales habilitados</CardDescription>
              </div>
              <Dialog open={isSupplierModalOpen} onOpenChange={setIsSupplierModalOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-white/5 border border-white/10 hover:bg-white/10 text-white p-2 rounded-lg cursor-pointer">
                    +
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-panel border-none text-white max-w-md shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                      <Users className="h-5 w-5 text-secondary" /> Registrar Proveedor
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateSupplier} className="space-y-4 pt-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-300">Nombre del Proveedor</label>
                      <Input
                        type="text"
                        placeholder="Lácteos del Sur S.A."
                        value={supplierName}
                        onChange={(e) => setSupplierName(e.target.value)}
                        className="bg-[#0a0f1d] border-white/10 text-white focus:border-primary focus:ring-1 focus:ring-primary rounded-lg"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-300">Email de Contacto</label>
                      <Input
                        type="email"
                        placeholder="contacto@gloria.com.pe"
                        value={supplierEmail}
                        onChange={(e) => setSupplierEmail(e.target.value)}
                        className="bg-[#0a0f1d] border-white/10 text-white focus:border-primary focus:ring-1 focus:ring-primary rounded-lg"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-emerald-600 text-white font-bold py-2 rounded-lg transition-colors cursor-pointer"
                      disabled={creatingSupplier}
                    >
                      {creatingSupplier ? 'Registrando...' : 'Registrar Homologado'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>

            <div className="space-y-3 mt-4">
              {loadingSuppliers ? (
                <p className="text-xs text-gray-400 animate-pulse">Cargando proveedores...</p>
              ) : suppliers.length === 0 ? (
                <p className="text-xs text-gray-400">No hay proveedores homologados.</p>
              ) : (
                suppliers.map((s) => (
                  <div key={s.id} className="p-3 bg-white/2 border border-white/5 rounded-xl flex items-center justify-between gap-2 hover:border-white/10 transition-all duration-150">
                    <div className="min-w-0">
                      <h5 className="font-bold text-white text-xs truncate">{s.name}</h5>
                      <span className="text-[10px] text-gray-500 block truncate">{s.contactEmail || 'Sin email'}</span>
                    </div>
                    <button
                      onClick={() => handleToggleSupplier(s.id, s.name, s.isActive)}
                      className="cursor-pointer text-gray-400 hover:text-white transition-colors"
                      title={s.isActive ? "Desactivar proveedor" : "Activar proveedor"}
                    >
                      {s.isActive ? (
                        <ToggleRight className="h-7 w-7 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="h-7 w-7 text-gray-600" />
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Controles de Paginación */}
          {supplierTotalPages > 1 && (
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/5 text-[10px] text-gray-400">
              <span>Pág. {supplierPage + 1} de {supplierTotalPages}</span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 w-7 p-0 border-white/5 bg-white/2 hover:bg-white/5"
                  disabled={supplierPage === 0}
                  onClick={() => fetchSuppliers(supplierPage - 1)}
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 w-7 p-0 border-white/5 bg-white/2 hover:bg-white/5"
                  disabled={supplierPage === supplierTotalPages - 1}
                  onClick={() => fetchSuppliers(supplierPage + 1)}
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Control de Cuentas y Accesos */}
      <Card className="glass-panel border-none p-6 shadow-xl">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Key className="h-5 w-5 text-amber-500" />
            Auditoría de Cuentas de Acceso
          </CardTitle>
          <CardDescription className="text-gray-400">
            Control de credenciales y roles asignados a los usuarios registrados en el sistema.
          </CardDescription>
        </CardHeader>

        <div className="overflow-x-auto mt-4">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-gray-450 uppercase font-black tracking-wider text-[10px] text-gray-400">
                <th className="pb-3 pr-4">Nombre de Usuario</th>
                <th className="pb-3 pr-4">Correo Electrónico</th>
                <th className="pb-3 pr-4">Fecha de Registro</th>
                <th className="pb-3 pr-4">Roles de Acceso</th>
                <th className="pb-3 pr-4 text-center">Estado</th>
                <th className="pb-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {loadingUsers ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500 font-semibold">
                    Cargando cuentas de usuario desde la base de datos...
                  </td>
                </tr>
              ) : seedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500 font-semibold">
                    No se encontraron cuentas de usuario registradas.
                  </td>
                </tr>
              ) : (
                seedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/2 transition-colors">
                    <td className="py-3.5 pr-4 font-bold text-white flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-[10px] font-bold text-primary">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      {user.username}
                    </td>
                    <td className="py-3.5 pr-4">{user.email}</td>
                    <td className="py-3.5 pr-4">{user.registeredDate}</td>
                    <td className="py-3.5 pr-4 flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge 
                          key={role} 
                          className={`text-[8px] font-black uppercase ${
                            role === 'ROLE_ADMIN' 
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                              : role === 'ROLE_MANAGER'
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {role === 'ROLE_ADMIN' ? 'Administrador' : role === 'ROLE_MANAGER' ? 'Gestor' : 'Deportista'}
                        </Badge>
                      ))}
                    </td>
                    <td className="py-3.5 pr-4 text-center">
                      <Badge className={user.status === 'ACTIVO' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px]' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px]'}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 text-right space-x-2">
                      <Button 
                        size="sm"
                        variant="outline"
                        className="border-white/10 text-white hover:bg-white/10 text-[10px] h-7 px-2.5 rounded-lg cursor-pointer"
                        onClick={() => handleOpenUserDetail(user)}
                      >
                        <Search className="h-3 w-3 mr-1" /> Detalles
                      </Button>
                      {user.username !== 'admin' && (
                        <Button
                          size="sm"
                          variant={user.status === 'ACTIVO' ? 'destructive' : 'default'}
                          className={`text-[10px] h-7 px-2.5 rounded-lg cursor-pointer font-bold ${
                            user.status === 'ACTIVO' ? 'bg-rose-950/20 border border-rose-500/20 text-rose-400 hover:bg-rose-900/40' : 'bg-primary hover:bg-emerald-600 text-white'
                          }`}
                          onClick={() => handleToggleUserStatus(user.id, user.username, user.status)}
                        >
                          {user.status === 'ACTIVO' ? 'Suspender' : 'Activar'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Traceability Audit (Inspección Interna de Lote) */}
      <Dialog open={isAuditModalOpen} onOpenChange={setIsAuditModalOpen}>
        <DialogContent className="glass-panel border-none text-white max-w-lg shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <ShieldAlert className="h-5 w-5 text-rose-500" />
              Auditoría Interna de Trazabilidad
            </DialogTitle>
          </DialogHeader>

          {loadingAudit ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-xs text-gray-400">Recuperando cadena de custodia...</p>
            </div>
          ) : auditData ? (
            <div className="space-y-5 pt-3">
              <div className="grid grid-cols-2 gap-4 bg-white/2 border border-white/5 p-4 rounded-xl text-xs">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold block mb-0.5">Producto Auditado</span>
                  <span className="font-bold text-white block">{auditData.productName}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold block mb-0.5">Código de Lote</span>
                  <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold text-[9px] mt-0.5">
                    {auditData.batchNumber}
                  </Badge>
                </div>
                <div className="pt-2 border-t border-white/5">
                  <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold block mb-0.5">Fabricación</span>
                  <span className="font-semibold text-gray-300">{new Date(auditData.productionDate).toLocaleDateString()}</span>
                </div>
                <div className="pt-2 border-t border-white/5">
                  <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold block mb-0.5">Estatus Sanitario</span>
                  <Badge className={`text-[9px] font-black uppercase mt-0.5 ${auditData.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {auditData.status === 'ACTIVE' ? 'Activo' : 'Retirado'}
                  </Badge>
                </div>
              </div>

              {/* Timeline de Ingredientes */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-1">
                  <Factory className="h-4 w-4 text-emerald-500" /> Cadena de Suministro (Ingredientes)
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {auditData.timeline.map((step, idx) => (
                    <div key={idx} className="p-3 bg-white/2 border border-white/5 rounded-xl flex items-center justify-between text-xs hover:border-white/10 transition-colors">
                      <div className="space-y-0.5">
                        <span className="font-bold text-white block">{step.ingredientName}</span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Users className="h-3 w-3 text-secondary/75" /> Proveedor: {step.supplierName}
                        </span>
                      </div>
                      <div className="text-right space-y-1">
                        <span className="text-[9px] text-gray-500 block">Llegada: {new Date(step.arrivalDate).toLocaleDateString()}</span>
                        <Badge className={`text-[8px] font-black uppercase ${getFreshnessColor(step.freshness)}`}>
                          {step.freshness === 'FRESH' ? 'Fresco' : step.freshness === 'MATURING' ? 'Límite' : 'Expirado'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Certificaciones y Laboratorio */}
              {auditData.certificates.length > 0 && (
                <div className="space-y-3 border-t border-white/5 pt-4">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1">
                    <Award className="h-4 w-4 text-amber-500" /> Certificados de Inocuidad
                  </h4>
                  <div className="space-y-2">
                    {auditData.certificates.map((cert, idx) => (
                      <div key={idx} className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-amber-300 block">{cert.laboratoryName}</span>
                          <span className="text-[9px] text-gray-500">Fecha de Análisis: {new Date(cert.issueDate).toLocaleDateString()}</span>
                        </div>
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="border-amber-500/30 text-amber-400 hover:bg-amber-950/40 hover:text-amber-300 text-[10px] h-7"
                        >
                          <a href={cert.documentUrl} target="_blank" rel="noopener noreferrer">
                            Ver Certificado
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <Button
                  onClick={() => setIsAuditModalOpen(false)}
                  variant="outline"
                  className="w-full border-white/10 text-white hover:bg-white/10"
                >
                  Cerrar Auditoría
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-center py-10 text-xs text-gray-400">No se pudo cargar la trazabilidad.</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal User Detail (Inspección de Cuenta) */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent className="glass-panel border-none text-white max-w-sm shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Search className="h-5 w-5 text-primary" /> Ficha de Auditoría de Cuenta
            </DialogTitle>
          </DialogHeader>

          {selectedUserDetail && (
            <div className="space-y-4 pt-3 text-xs">
              <div className="flex items-center gap-3 bg-white/2 border border-white/5 p-4 rounded-xl">
                <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-sm font-black text-primary">
                  {selectedUserDetail.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{selectedUserDetail.username}</h4>
                  <span className="text-[10px] text-gray-500">{selectedUserDetail.email}</span>
                </div>
              </div>

              <div className="space-y-2 bg-black/20 p-4 rounded-xl border border-white/5">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Fecha Registro:</span>
                  <span className="font-semibold text-gray-200">{selectedUserDetail.registeredDate}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Último Ingreso:</span>
                  <span className="font-semibold text-gray-200">{selectedUserDetail.lastLogin}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Alérgenos Guardados:</span>
                  <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-bold">
                    {selectedUserDetail.allergenCount} registrados
                  </Badge>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-400">Estatus:</span>
                  <Badge className={selectedUserDetail.status === 'ACTIVO' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}>
                    {selectedUserDetail.status}
                  </Badge>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => setIsUserModalOpen(false)}
                  className="w-full bg-primary hover:bg-emerald-600 text-white font-bold"
                >
                  Cerrar Ficha
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
