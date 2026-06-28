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
  ChevronLeft, ChevronRight, Users, Activity, Lock, AlertTriangle, ShieldX
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
      // Ordenar por fecha descendente
      formatted.sort((a: MockReport, b: MockReport) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime());
      setReports(formatted);
    } catch {
      toast.error('Error al cargar la lista de alertas sanitarias.');
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    // Evitar setState sincrónicos en el renderizado difiriendo las peticiones
    Promise.resolve().then(() => {
      fetchSuppliers(0);
      fetchReports();
    });
  }, []);

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
          <span>El lote <strong>{batchNumber}</strong> ha sido bloqueado preventivamente del sistema.</span>
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
      <div className="text-xs">
        Proveedor <strong className="text-gray-200">{name}</strong> ha sido <strong>{!currentState ? 'HABILITADO' : 'DESACTIVADO'}</strong> para la cadena de suministros.
      </div>
    );
  };

  // Cálculos de métricas
  const pendingAlertsCount = reports.filter(r => r.status === 'PENDING').length;
  const recalledBatchesCount = reports.filter(r => r.status === 'RECALLED_BATCH').length;
  const activeSuppliersCount = suppliers.filter(s => s.isActive).length;

  return (
    <div className="space-y-8">
      {/* Encabezado General del Panel de Cumplimiento */}
      <Card className="glass-panel border-none p-6 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500" />
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2 tracking-wide">
            <ShieldAlert className="h-6 w-6 text-rose-500" />
            Consola de Cumplimiento y Calidad
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Portal administrativo para la homologación de proveedores, auditoría sanitaria y retiros de mercado (Recall)
          </p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-black py-1 px-3 uppercase tracking-wider">
            Consola Administrador
          </Badge>
        </div>
      </Card>

      {/* Grilla de Métricas en Tiempo Real */}
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

      {/* Grid Principal: Alertas y Proveedores */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Panel de Alertas Sanitarias (2 Columnas) */}
        <Card className="glass-panel border-none p-6 shadow-xl lg:col-span-2">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-500" />
              Buzón de Alertas y Denuncias de Calidad
            </CardTitle>
            <CardDescription className="text-gray-400">
              Reportes ingresados por usuarios deportistas sobre defectos de lote. Retira del mercado aquellos lotes comprometidos.
            </CardDescription>
          </CardHeader>

          <div className="space-y-4 mt-4">
            {loadingReports ? (
              <p className="text-xs text-gray-400 animate-pulse py-4">Cargando alertas de calidad...</p>
            ) : reports.length === 0 ? (
              <div className="text-center py-10 text-gray-500 border border-white/5 border-dashed rounded-xl bg-white/2">
                <ShieldCheck className="h-8 w-8 mx-auto text-emerald-500 mb-2 stroke-[1.5]" />
                <p className="text-xs font-semibold">No se han registrado denuncias sanitarias ni alertas.</p>
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
                      <h4 className="font-bold text-white text-sm">{report.title}</h4>
                      <p className="text-xs text-gray-400">
                        Producto: <strong className="text-gray-200">{report.productName}</strong> • Lote: <strong className="text-gray-200">{report.batchNumber}</strong>
                      </p>
                      <p className="text-xs text-gray-400 mt-2 bg-black/20 p-2.5 rounded-lg border border-white/5 leading-relaxed">
                        {report.description}
                      </p>
                    </div>
                    <Badge variant={report.status === 'PENDING' ? 'outline' : 'destructive'} className="shrink-0 uppercase font-bold text-[9px] py-0.5 px-2">
                      {report.status === 'PENDING' ? 'Inspección Requerida' : 'Lote Bloqueado'}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center border-t border-white/5 pt-3 mt-1">
                    <span className="text-[10px] text-gray-500">Recibido: {new Date(report.reportDate).toLocaleDateString()}</span>
                    
                    {report.status === 'PENDING' ? (
                      <Button 
                        size="sm"
                        variant="destructive"
                        className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer"
                        onClick={() => handleRecallBatch(report.id, report.batchId, report.batchNumber)}
                      >
                        Retirar Lote (Recall)
                      </Button>
                    ) : (
                      <Badge className="bg-rose-950/40 text-rose-400 border border-rose-800/40 text-[9px] font-black uppercase">
                        Retirado del Mercado
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Panel de Proveedores (1 Columna) */}
        <Card className="glass-panel border-none p-6 shadow-xl lg:col-span-1 flex flex-col justify-between">
          <div>
            <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-secondary" />
                  Homologación
                </CardTitle>
                <CardDescription className="text-gray-400">Auditoría de proveedores de la planta</CardDescription>
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
                      <Users className="h-5 w-5 text-secondary" /> Nuevo Proveedor
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
    </div>
  );
};

export default AdminDashboard;
