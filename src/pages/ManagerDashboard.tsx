import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  ShieldAlert, Factory, ToggleLeft, ToggleRight, 
  ChevronLeft, ChevronRight, Layers, Users, PhoneCall 
} from 'lucide-react';

interface Supplier {
  id: number;
  name: string;
  contactEmail: string;
  isActive: boolean;
}

interface Ingredient {
  id: number;
  name: string;
  description: string;
  shelfLifeDays: number;
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

export const ManagerDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.roles.includes('ROLE_ADMIN');

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

  // Catálogo de Ingredientes
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loadingIngredients, setLoadingIngredients] = useState(true);
  
  // Registro de Ingrediente
  const [ingredientName, setIngredientName] = useState('');
  const [ingredientDesc, setIngredientDesc] = useState('');
  const [ingredientLife, setIngredientLife] = useState('');
  const [creatingIngredient, setCreatingIngredient] = useState(false);
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);

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

  const fetchIngredients = async () => {
    try {
      setLoadingIngredients(true);
      const response = await api.get('/ingredients', {
        params: { page: 0, size: 10, sort: 'name,asc' }
      });
      setIngredients(response.data.content);
    } catch {
      toast.error('Error al cargar la lista de ingredientes.');
    } finally {
      setLoadingIngredients(false);
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
    fetchSuppliers(0);
    fetchIngredients();
    fetchReports();
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
      toast.success('Proveedor creado correctamente.');
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

  const handleCreateIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredientName.trim() || !ingredientLife) {
      toast.error('Nombre y Vida Útil son obligatorios.');
      return;
    }

    try {
      setCreatingIngredient(true);
      await api.post('/ingredients', {
        name: ingredientName,
        description: ingredientDesc,
        shelfLifeDays: Number(ingredientLife)
      });
      toast.success('Ingrediente creado correctamente.');
      setIngredientName('');
      setIngredientDesc('');
      setIngredientLife('');
      setIsIngredientModalOpen(false);
      fetchIngredients();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Error al crear el ingrediente.');
    } finally {
      setCreatingIngredient(false);
    }
  };

  // Acción Exclusiva del Admin: Retirar Lote
  const handleRecallBatch = async (reportId: number, batchId: number, batchNumber: string) => {
    if (!isAdmin) {
      toast.error('Acción denegada: Solo los administradores pueden retirar lotes del mercado.');
      return;
    }

    try {
      await api.post(`/batches/${batchId}/recall`);
      
      // Actualizar estado del reporte a nivel local
      setReports(reports.map(r => r.id === reportId ? { ...r, status: 'RECALLED_BATCH' } : r));
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-bold text-rose-500">Lote Retirado</span>
          <span>El lote {batchNumber} ha sido retirado y bloqueado del sistema correctamente.</span>
        </div>,
        { duration: 5000 }
      );
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Error al retirar el lote.');
    }
  };

  // Simulación de toggle de estado de proveedor para el Admin
  const handleToggleSupplier = (supplierId: number, name: string, currentState: boolean) => {
    if (!isAdmin) {
      toast.error('Acción denegada: Solo los administradores pueden activar o desactivar proveedores.');
      return;
    }

    setSuppliers(suppliers.map(s => s.id === supplierId ? { ...s, isActive: !currentState } : s));
    toast.success(`Proveedor "${name}" ${!currentState ? 'ACTIVADO' : 'DESACTIVADO'} correctamente en el panel de auditoría.`);
  };

  return (
    <div className="space-y-8">
      {/* Encabezado General del Manager Panel */}
      <Card className="glass-panel border-none p-6 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary to-secondary" />

        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Factory className="h-6 w-6 text-primary" />
            Panel de Control Operativo
          </h1>
          <p className="text-sm text-gray-400">
            {isAdmin ? 'Administración de Sistemas, Calidad y Trazabilidad' : 'Gestión de Productos, Lotes y Proveedores'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild className="bg-primary hover:bg-emerald-600 text-white font-bold text-xs py-1.5 px-3.5">
            <Link to="/products/new">Nuevo Producto</Link>
          </Button>
        </div>
      </Card>

      {/* Grid de Reportes de Calidad e Ingredientes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Reportes de Calidad (Audit Logs) - 2 Cols */}
        <Card className="glass-panel border-none p-6 shadow-xl lg:col-span-2">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-500" />
              Alertas Sanitarias y de Calidad
            </CardTitle>
            <CardDescription className="text-gray-400">
              Reportes ingresados por deportistas. {isAdmin ? 'Como administrador puedes retirar lotes de inmediato.' : 'Visualización de reportes.'}
            </CardDescription>
          </CardHeader>

          <div className="space-y-4 mt-2">
            {loadingReports ? (
              <p className="text-xs text-gray-400">Cargando alertas de calidad...</p>
            ) : reports.length === 0 ? (
              <p className="text-xs text-gray-400">No hay alertas sanitarias ni de calidad registradas.</p>
            ) : (
              reports.map((report) => (
                <div 
                  key={report.id} 
                  className={`p-4 rounded-xl border flex flex-col justify-between gap-4 ${
                    report.status === 'PENDING' 
                      ? 'bg-amber-950/10 border-amber-900/50' 
                      : 'bg-rose-950/10 border-rose-900/50'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="font-bold text-white text-sm">{report.title}</h4>
                      <p className="text-xs text-gray-400">Lote: <strong className="text-gray-200">{report.batchNumber}</strong> ({report.productName})</p>
                      <p className="text-xs text-gray-500 mt-1 whitespace-pre-line">{report.description}</p>
                    </div>
                    <Badge variant={report.status === 'PENDING' ? 'outline' : 'destructive'} className="shrink-0 uppercase font-bold text-[10px]">
                      {report.status === 'PENDING' ? 'Pendiente' : 'Lote Bloqueado'}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center border-t border-white/5 pt-3 mt-1">
                    <span className="text-[10px] text-gray-500">Reportado: {new Date(report.reportDate).toLocaleDateString()}</span>
                    
                    {report.status === 'PENDING' && (
                      <Button 
                        size="sm"
                        variant="destructive"
                        className="text-xs font-bold"
                        onClick={() => handleRecallBatch(report.id, report.batchId, report.batchNumber)}
                        disabled={!isAdmin}
                      >
                        {!isAdmin ? 'Solo Admin' : 'Retirar Lote (Recall)'}
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Proveedores y Botón Modal - 1 Col */}
        <Card className="glass-panel border-none p-6 shadow-xl lg:col-span-1 flex flex-col justify-between">
          <div>
            <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-secondary" />
                  Proveedores
                </CardTitle>
                <CardDescription className="text-gray-400">Catálogo de proveedores de ingredientes</CardDescription>
              </div>
              <Dialog open={isSupplierModalOpen} onOpenChange={setIsSupplierModalOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-white/5 border border-white/10 hover:bg-white/10 text-white p-2">
                    +
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-panel border-none text-white max-w-md">
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
                        className="bg-white/5 border-white/10 text-white"
                        disabled={creatingSupplier}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-300">Email de Contacto</label>
                      <Input
                        type="email"
                        placeholder="contacto@lacteosdelsur.com"
                        value={supplierEmail}
                        onChange={(e) => setSupplierEmail(e.target.value)}
                        className="bg-white/5 border-white/10 text-white"
                        disabled={creatingSupplier}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-emerald-600 text-white font-bold mt-4"
                      disabled={creatingSupplier}
                    >
                      {creatingSupplier ? 'Guardando...' : 'Crear Proveedor'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>

            <div className="space-y-3 mt-4">
              {loadingSuppliers ? (
                <p className="text-xs text-gray-400">Cargando...</p>
              ) : (
                suppliers.map((s) => (
                  <div key={s.id} className="p-3 bg-white/5 rounded-lg border border-white/5 flex justify-between items-center gap-2">
                    <div>
                      <h4 className="font-bold text-white text-xs">{s.name}</h4>
                      {s.contactEmail && (
                        <p className="text-[10px] text-gray-400 flex items-center gap-1">
                          <PhoneCall className="h-3 w-3" /> {s.contactEmail}
                        </p>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleToggleSupplier(s.id, s.name, s.isActive)}
                      className="text-gray-400 hover:text-white transition-colors"
                      title={isAdmin ? 'Toggle active state' : 'Solo Admin'}
                      disabled={!isAdmin}
                    >
                      {s.isActive ? (
                        <ToggleRight className="h-6 w-6 text-primary" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-gray-600" />
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {supplierTotalPages > 1 && (
            <div className="flex justify-between items-center mt-6 text-[10px] text-gray-400 pt-2 border-t border-white/5">
              <span>Pág {supplierPage + 1} de {supplierTotalPages}</span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="p-1 h-6 w-6"
                  disabled={supplierPage === 0}
                  onClick={() => fetchSuppliers(supplierPage - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="p-1 h-6 w-6"
                  disabled={supplierPage === supplierTotalPages - 1}
                  onClick={() => fetchSuppliers(supplierPage + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Ingredientes Card */}
      <Card className="glass-panel border-none p-6 shadow-xl">
        <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-secondary" />
              Catálogo de Materias Primas / Ingredientes
            </CardTitle>
            <CardDescription className="text-gray-400">Ingredientes utilizables en los lotes de producción</CardDescription>
          </div>
          <Dialog open={isIngredientModalOpen} onOpenChange={setIsIngredientModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold flex items-center gap-1.5">
                Nuevo Ingrediente
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-panel border-none text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="h-5 w-5 text-secondary" /> Nuevo Ingrediente
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateIngredient} className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Nombre del Ingrediente</label>
                  <Input
                    type="text"
                    placeholder="ej. Concentrado de Suero de Leche"
                    value={ingredientName}
                    onChange={(e) => setIngredientName(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                    disabled={creatingIngredient}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Descripción</label>
                  <Input
                    type="text"
                    placeholder="Materia prima proteica"
                    value={ingredientDesc}
                    onChange={(e) => setIngredientDesc(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                    disabled={creatingIngredient}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Vida Útil Estimada (días)</label>
                  <Input
                    type="number"
                    placeholder="ej. 180"
                    value={ingredientLife}
                    onChange={(e) => setIngredientLife(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                    disabled={creatingIngredient}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-emerald-600 text-white font-bold mt-4"
                  disabled={creatingIngredient}
                >
                  {creatingIngredient ? 'Guardando...' : 'Crear Ingrediente'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {loadingIngredients ? (
            <p className="text-xs text-gray-400">Cargando...</p>
          ) : (
            ingredients.map((ing) => (
              <div key={ing.id} className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-1">
                <h4 className="font-bold text-white text-sm">{ing.name}</h4>
                <p className="text-xs text-gray-400">{ing.description || 'Sin descripción'}</p>
                <Badge className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] mt-1.5">
                  Vida útil: {ing.shelfLifeDays} días
                </Badge>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
export default ManagerDashboard;
