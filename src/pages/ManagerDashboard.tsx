import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Factory, Layers, Users, PhoneCall, ChevronLeft, ChevronRight, 
  PlusCircle, AlertTriangle, ShieldCheck, ClipboardList, MapPin
} from 'lucide-react';

interface Supplier {
  id: number;
  name: string;
  contactEmail: string;
  isActive: boolean;
  address?: string;
  latitude?: number;
  longitude?: number;
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
  // Catálogo de Proveedores (Lectura)
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [supplierPage, setSupplierPage] = useState(0);
  const [supplierTotalPages, setSupplierTotalPages] = useState(0);

  // Catálogo de Ingredientes
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loadingIngredients, setLoadingIngredients] = useState(true);
  const [ingredientPage, setIngredientPage] = useState(0);
  const [ingredientTotalPages, setIngredientTotalPages] = useState(0);
  
  // Registro de Ingrediente
  const [ingredientName, setIngredientName] = useState('');
  const [ingredientDesc, setIngredientDesc] = useState('');
  const [ingredientLife, setIngredientLife] = useState('');
  const [creatingIngredient, setCreatingIngredient] = useState(false);
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);

  // Reportes de Calidad (Monitoreo)
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

  const fetchIngredients = async (page = 0) => {
    try {
      setLoadingIngredients(true);
      const response = await api.get('/ingredients', {
        params: { page, size: 10, sort: 'name,asc' }
      });
      setIngredients(response.data.content);
      setIngredientTotalPages(response.data.totalPages);
      setIngredientPage(page);
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
      formatted.sort((a: MockReport, b: MockReport) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime());
      setReports(formatted);
    } catch {
      toast.error('Error al cargar el buzón de alertas sanitarias.');
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    // Evitar llamadas sincrónicas al montar diferiendo la carga
    Promise.resolve().then(() => {
      fetchSuppliers(0);
      fetchIngredients(0);
      fetchReports();
    });
  }, []);

  const handleCreateIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredientName.trim() || !ingredientLife) {
      toast.error('El nombre y la vida útil son campos obligatorios.');
      return;
    }

    try {
      setCreatingIngredient(true);
      await api.post('/ingredients', {
        name: ingredientName,
        description: ingredientDesc,
        shelfLifeDays: Number(ingredientLife)
      });
      toast.success('Materia prima registrada correctamente.');
      setIngredientName('');
      setIngredientDesc('');
      setIngredientLife('');
      setIsIngredientModalOpen(false);
      fetchIngredients(0);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Error al crear el ingrediente.');
    } finally {
      setCreatingIngredient(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Encabezado General del Panel de Gestión de Producción */}
      <Card className="glass-panel border-none p-6 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-emerald-500 to-cyan-500" />
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2 tracking-wide">
            <Factory className="h-6 w-6 text-emerald-500 animate-pulse" />
            Consola de Control de Producción
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Gestión operativa de suplementos, trazabilidad de lotes físicos y control de ingredientes del almacén
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild className="bg-primary hover:bg-emerald-600 text-white font-bold text-xs py-2 px-4 rounded-lg cursor-pointer transition-colors shadow-md">
            <Link to="/products" className="flex items-center gap-1">
              <ClipboardList className="h-4 w-4" /> Catálogo de Productos
            </Link>
          </Button>
        </div>
      </Card>

      {/* Grid Superior: Reportes de Calidad y Directorio de Proveedores */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Buzón de Incidentes de Calidad (2 Columnas - Solo Lectura) */}
        <Card className="glass-panel border-none p-6 shadow-xl lg:col-span-2">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Buzón de Control de Calidad e Incidentes
            </CardTitle>
            <CardDescription className="text-gray-400">
              Alertas registradas por los deportistas. Si un lote se reporta como defectuoso, coordina con Administración su retiro preventivo.
            </CardDescription>
          </CardHeader>

          <div className="space-y-4 mt-4">
            {loadingReports ? (
              <p className="text-xs text-gray-400 animate-pulse py-4">Cargando alertas de calidad...</p>
            ) : reports.length === 0 ? (
              <div className="text-center py-10 text-gray-500 border border-white/5 border-dashed rounded-xl bg-white/2">
                <ShieldCheck className="h-8 w-8 mx-auto text-emerald-500 mb-2 stroke-[1.5]" />
                <p className="text-xs font-semibold">No se han registrado reportes de incidentes en los lotes.</p>
              </div>
            ) : (
              reports.map((report) => (
                <div 
                  key={report.id} 
                  className={`p-4 rounded-xl border flex flex-col justify-between gap-4 transition-all duration-150 bg-white/2 ${
                    report.status === 'PENDING' 
                      ? 'border-amber-500/20 hover:bg-amber-950/10' 
                      : 'border-rose-500/20 hover:bg-rose-950/10'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-white text-sm">{report.title}</h4>
                      <p className="text-xs text-gray-400">
                        Producto: <strong className="text-gray-200">{report.productName}</strong> • Lote: <strong className="text-gray-200">{report.batchNumber}</strong>
                      </p>
                      <p className="text-xs text-gray-550 mt-2 bg-black/20 p-2.5 rounded-lg border border-white/5 leading-relaxed text-gray-300">
                        {report.description}
                      </p>
                    </div>
                    <Badge variant={report.status === 'PENDING' ? 'outline' : 'destructive'} className="shrink-0 uppercase font-bold text-[9px] py-0.5 px-2">
                      {report.status === 'PENDING' ? 'Bajo Inspección' : 'Lote Bloqueado'}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center border-t border-white/5 pt-3 mt-1 text-[10px] text-gray-500">
                    <span>Recibido: {new Date(report.reportDate).toLocaleDateString()}</span>
                    {report.status === 'PENDING' && (
                      <span className="text-amber-500/90 font-semibold flex items-center gap-1">
                        ⚠️ Reportado al Administrador
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Directorio de Proveedores Homologados (1 Columna - Solo Lectura) */}
        <Card className="glass-panel border-none p-6 shadow-xl lg:col-span-1 flex flex-col justify-between">
          <div>
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-cyan-400" />
                Proveedores Activos
              </CardTitle>
              <CardDescription className="text-gray-400">Proveedores habilitados por Administración para compra de insumos</CardDescription>
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
                      {s.contactEmail && (
                        <span className="text-[10px] text-gray-500 truncate flex items-center gap-1 mt-0.5">
                          <PhoneCall className="h-3 w-3 text-cyan-500/60" /> {s.contactEmail}
                        </span>
                      )}
                      {s.address && (
                        <span className="text-[9px] text-gray-400 flex items-center gap-0.5 mt-0.5 truncate" title={s.address}>
                          <MapPin className="h-3 w-3 shrink-0 text-cyan-500/60" /> {s.address}
                        </span>
                      )}
                    </div>
                    <Badge className={s.isActive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px]" : "bg-gray-800 text-gray-400 text-[8px]"}>
                      {s.isActive ? 'Habilitado' : 'Inactivo'}
                    </Badge>
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

      {/* Catálogo de Materias Primas / Ingredientes (Mantenimiento) */}
      <Card className="glass-panel border-none p-6 shadow-xl">
        <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-emerald-400" />
              Almacén de Materias Primas / Ingredientes
            </CardTitle>
            <CardDescription className="text-gray-400">Registra y monitorea el catálogo de ingredientes para mezclas de producción</CardDescription>
          </div>
          <Dialog open={isIngredientModalOpen} onOpenChange={setIsIngredientModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary hover:bg-emerald-600 text-white font-bold flex items-center gap-1.5 rounded-lg cursor-pointer transition-colors text-xs py-1.5 px-3">
                <PlusCircle className="h-4 w-4" /> Registrar Ingrediente
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-panel border-none text-white max-w-md shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="h-5 w-5 text-emerald-400" /> Registrar Nueva Materia Prima
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateIngredient} className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Nombre de la Materia Prima</label>
                  <Input
                    type="text"
                    placeholder="ej. Monohidrato de Creatina"
                    value={ingredientName}
                    onChange={(e) => setIngredientName(e.target.value)}
                    className="bg-[#0a0f1d] border-white/10 text-white focus:border-primary focus:ring-1 focus:ring-primary rounded-lg"
                    disabled={creatingIngredient}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Descripción / Origen</label>
                  <Input
                    type="text"
                    placeholder="ej. Incrementador de ATP de rápida absorción"
                    value={ingredientDesc}
                    onChange={(e) => setIngredientDesc(e.target.value)}
                    className="bg-[#0a0f1d] border-white/10 text-white focus:border-primary focus:ring-1 focus:ring-primary rounded-lg"
                    disabled={creatingIngredient}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Vida Útil Estimada (días)</label>
                  <Input
                    type="number"
                    placeholder="ej. 365"
                    value={ingredientLife}
                    onChange={(e) => setIngredientLife(e.target.value)}
                    className="bg-[#0a0f1d] border-white/10 text-white focus:border-primary focus:ring-1 focus:ring-primary rounded-lg"
                    disabled={creatingIngredient}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-emerald-600 text-white font-bold py-2 rounded-lg transition-colors cursor-pointer"
                  disabled={creatingIngredient}
                >
                  {creatingIngredient ? 'Registrando...' : 'Registrar Materia Prima'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          {loadingIngredients ? (
            <p className="text-xs text-gray-400 animate-pulse py-4">Cargando materias primas...</p>
          ) : ingredients.length === 0 ? (
            <p className="text-xs text-gray-400">No hay ingredientes registrados.</p>
          ) : (
            ingredients.map((ing) => (
              <div key={ing.id} className="p-4 bg-white/2 border border-white/5 rounded-2xl flex flex-col justify-between gap-3 hover:border-white/10 transition-all duration-150">
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-xs tracking-wide">{ing.name}</h4>
                  <p className="text-[10px] text-gray-500 leading-relaxed">{ing.description || 'Sin descripción'}</p>
                </div>
                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[9px] text-gray-500">Duración:</span>
                  <Badge className="bg-slate-800 text-slate-300 border border-slate-700 text-[9px] py-0.5 px-2 font-semibold">
                    {ing.shelfLifeDays} días
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Controles de Paginación de Ingredientes */}
        {ingredientTotalPages > 1 && (
          <div className="flex items-center justify-between pt-4 mt-6 border-t border-white/5 text-[10px] text-gray-400">
            <span>Pág. {ingredientPage + 1} de {ingredientTotalPages}</span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0 border-white/5 bg-white/2 hover:bg-white/5 cursor-pointer text-white"
                disabled={ingredientPage === 0}
                onClick={() => fetchIngredients(ingredientPage - 1)}
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0 border-white/5 bg-white/2 hover:bg-white/5 cursor-pointer text-white"
                disabled={ingredientPage === ingredientTotalPages - 1}
                onClick={() => fetchIngredients(ingredientPage + 1)}
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ManagerDashboard;
