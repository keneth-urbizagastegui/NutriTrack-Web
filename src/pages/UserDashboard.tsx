import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Search, Dumbbell, Calendar, Flame, ChevronLeft, ChevronRight, Activity, AlertTriangle, Lock, Eye } from 'lucide-react';

interface ConsumptionLog {
  id: number;
  productName: string;
  quantityGrams: number;
  consumptionDate: string;
  consumedMacros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  batchId: number;
}

interface Product {
  id: number;
  name: string;
  description: string;
  brand: string;
  category: string;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

interface ActiveBatch {
  id: number;
  batchNumber: string;
  productName: string;
}

interface AllergenIngredient {
  id: number;
  name: string;
}

interface MacroTotals {
  protein: number;
  carbs: number;
  fat: number;
}

export const UserDashboard: React.FC = () => {
  const [history, setHistory] = useState<ConsumptionLog[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Estados para Registro de Consumo
  const [batchId, setBatchId] = useState('');
  const [quantityGrams, setQuantityGrams] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeBatches, setActiveBatches] = useState<ActiveBatch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [activeOnly, setActiveOnly] = useState(true);

  const fetchActiveBatches = async () => {
    try {
      setLoadingBatches(true);
      const response = await api.get('/batches');
      setActiveBatches(response.data);
    } catch {
      toast.error('Error al cargar la lista de lotes activos.');
    } finally {
      setLoadingBatches(false);
    }
  };

  const fetchAllProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await api.get('/products', {
        params: { page: 0, size: 100, sort: 'name,asc' }
      });
      setAllProducts(response.data.content);
    } catch {
      toast.error('Error al cargar el catálogo de productos.');
    } finally {
      setLoadingProducts(false);
    }
  };

  // Estados para Buscador de Productos
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Lista local de alérgenos activos para búsquedas proactivas
  const [allergens, setAllergens] = useState<AllergenIngredient[]>([]);

  // Totales de macros del día
  const [dailyMacros, setDailyMacros] = useState({ protein: 0, carbs: 0, fat: 0, calories: 0 });

  const fetchHistory = async (page = 0) => {
    try {
      setLoadingHistory(true);
      const response = await api.get('/consumption', {
        params: { page, size: 5, sort: 'consumptionDate,desc' },
      });
      setHistory(response.data.content);
      setTotalPages(response.data.totalPages);
      setCurrentPage(page);

      // Calcular macros de hoy (consumos con fecha de hoy)
      const today = new Date().toISOString().split('T')[0];
      const todayConsumptions = response.data.content.filter((item: ConsumptionLog) => 
        item.consumptionDate.startsWith(today)
      );

      const totals = todayConsumptions.reduce((acc: MacroTotals, curr: ConsumptionLog) => {
        acc.protein += curr.consumedMacros.protein;
        acc.carbs += curr.consumedMacros.carbs;
        acc.fat += curr.consumedMacros.fat;
        return acc;
      }, { protein: 0, carbs: 0, fat: 0 });

      // Calorías aproximadas: 4 kcal por g de proteína/carbos, 9 kcal por g de grasa
      const calories = Math.round(totals.protein * 4 + totals.carbs * 4 + totals.fat * 9);
      setDailyMacros({
        protein: Math.round(totals.protein * 10) / 10,
        carbs: Math.round(totals.carbs * 10) / 10,
        fat: Math.round(totals.fat * 10) / 10,
        calories,
      });

    } catch {
      toast.error('Error al cargar el historial de consumo.');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory(0);
    // Cargar alérgenos guardados en la sesión
    const saved = sessionStorage.getItem('sessionAllergens');
    if (saved) {
      setAllergens(JSON.parse(saved));
    }
    fetchAllProducts();
    fetchActiveBatches();
  }, []);

  const handleRegisterConsumption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId || !quantityGrams) {
      toast.error('Todos los campos son obligatorios.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/consumption', {
        batchId: Number(batchId),
        quantityGrams: Number(quantityGrams),
        consumptionDate: new Date().toISOString(),
      });

      toast.success('Consumo registrado correctamente.');
      setBatchId('');
      setQuantityGrams('');
      setIsModalOpen(false);
      fetchHistory(0); // Recargar historial
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      const errorMsg = error.response?.data?.message || 'Error al registrar el consumo.';
      toast.error(
        <div className="flex flex-col gap-1.5">
          <span className="font-bold flex items-center gap-1 text-rose-500">
            <AlertTriangle className="h-4 w-4" /> Alerta de Consumo
          </span>
          <span>{errorMsg}</span>
        </div>,
        { duration: 5000 }
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenRegisterForProduct = (productName: string, batchIdVal: number) => {
    setSelectedProduct(productName);
    setBatchId(String(batchIdVal));
    setIsModalOpen(true);
  };

  // Función para evaluar si un producto buscado contiene alérgenos del usuario
  const getProductAllergenWarning = (productName: string, productDesc: string) => {
    if (allergens.length === 0) return null;
    
    const prodNameNorm = productName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const prodDescNorm = (productDesc || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    for (const alg of allergens) {
      const algNameNorm = alg.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      // Caso de Whey / Lactosa y Suero
      if (prodNameNorm.includes("whey") || prodNameNorm.includes("isolada") || prodNameNorm.includes("suero")) {
        if (algNameNorm.includes("suero") || algNameNorm.includes("lactosa")) {
          return alg.name;
        }
      }

      // Coincidencia directa
      if (prodNameNorm.includes(algNameNorm) || prodDescNorm.includes(algNameNorm)) {
        return alg.name;
      }
    }
    return null;
  };

  const uniqueProductsWithBatches = Array.from(new Set(activeBatches.map(b => b.productName))).sort();

  return (
    <div className="space-y-8">
      {/* Panel de Resumen Diario con Gráfico Circular SVG */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-panel border-none p-6 md:col-span-2 shadow-2xl flex flex-col md:flex-row items-center justify-around gap-6">
          <div className="space-y-4 text-center md:text-left">
            <h2 className="text-2xl font-bold text-white flex items-center justify-center md:justify-start gap-2">
              <Activity className="h-6 w-6 text-primary" />
              Consumo Diario de Hoy
            </h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/10 hover:shadow-lg flex flex-col justify-between min-h-22.5">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Proteína</span>
                <span className="text-3xl font-black text-primary mt-1">{dailyMacros.protein}<span className="text-xs font-bold text-gray-400">g</span></span>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/10 hover:shadow-lg flex flex-col justify-between min-h-22.5">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Carbohidratos</span>
                <span className="text-3xl font-black text-cyan-400 mt-1">{dailyMacros.carbs}<span className="text-xs font-bold text-gray-400">g</span></span>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/10 hover:shadow-lg flex flex-col justify-between min-h-22.5">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Grasas</span>
                <span className="text-3xl font-black text-amber-500 mt-1">{dailyMacros.fat}<span className="text-xs font-bold text-gray-400">g</span></span>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              *Los consumos corresponden al lote específico registrado por el QR.
            </p>
          </div>

          {/* Gráfico circular SVG interactivo para KCAL */}
          <div className="relative flex items-center justify-center w-40 h-40">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Círculo de fondo gris plano */}
              <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="transparent" />
              {dailyMacros.calories > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#10b981"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${(Math.min(dailyMacros.calories, 2000) / 2000) * 251.3} 251.3`}
                  strokeLinecap="round"
                  className="transition-all duration-500 ease-out"
                />
              )}
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <Flame className="h-6 w-6 text-amber-500 animate-pulse" />
              <span className="text-2xl font-black text-white">{dailyMacros.calories}</span>
              <span className="text-[10px] uppercase text-gray-400 tracking-wider font-bold">Kcal</span>
              <span className="text-[8px] text-gray-500 font-bold mt-0.5">Meta: 2000</span>
            </div>
          </div>
        </Card>

        {/* Acceso Rápido: Registrar Consumo */}
        <Card className="glass-panel border-none p-6 flex flex-col justify-center items-center text-center shadow-2xl relative overflow-hidden transition-all duration-200 hover:border-white/10">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
          <h3 className="text-lg font-bold text-white mb-2">Registrar Consumo Diario</h3>
          <p className="text-xs text-gray-400 mb-6">
            Registra los gramos que vas a ingerir de tus suplementos o alimentos trazados.
          </p>
          <Dialog open={isModalOpen} onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) {
              setSelectedProduct('');
              setBatchId('');
              setQuantityGrams('');
            }
          }}>
            <DialogTrigger asChild>
              <Button className="w-full bg-primary hover:bg-emerald-600 text-white font-bold flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer">
                <PlusCircle className="h-5 w-5" />
                Registrar Consumo
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-panel border-none text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-primary" /> Registrar Consumo
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleRegisterConsumption} className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">1. Seleccionar Producto</label>
                  {selectedProduct && batchId ? (
                    <div className="bg-[#0a0f1d] border border-white/10 rounded-lg p-2.5 text-sm font-semibold text-white flex justify-between items-center">
                      <span>{selectedProduct}</span>
                      <Badge variant="outline" className="text-primary border-primary/30 text-[10px]">Pre-seleccionado</Badge>
                    </div>
                  ) : loadingBatches ? (
                    <div className="flex items-center gap-2 text-xs text-gray-400 py-2.5">
                      <span className="animate-spin rounded-full h-3.5 w-3.5 border-b border-primary"></span>
                      Cargando catálogo...
                    </div>
                  ) : (
                    <div>
                      <select
                        value={selectedProduct}
                        onChange={(e) => {
                          setSelectedProduct(e.target.value);
                          setBatchId('');
                        }}
                        className="w-full bg-[#0a0f1d] border border-white/10 text-white rounded-lg p-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:ring-offset-0 transition-colors cursor-pointer"
                        disabled={submitting}
                        required
                      >
                        <option value="" className="text-gray-400">-- Selecciona un producto --</option>
                        {uniqueProductsWithBatches.map((name) => (
                          <option key={name} value={name} className="text-white bg-[#0a0f1d]">
                            {name}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-gray-400 mt-1.5">
                        *Tip: Utiliza el buscador del dashboard para seleccionar y registrar ingestas al instante.
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">2. Seleccionar Lote Activo</label>
                  {selectedProduct && batchId ? (
                    <div className="bg-[#0a0f1d] border border-white/10 rounded-lg p-2.5 text-sm font-semibold text-white flex justify-between items-center">
                      <span>Lote: {activeBatches.find(b => b.id === Number(batchId))?.batchNumber || batchId}</span>
                      <Badge variant="outline" className="text-cyan-400 border-cyan-400/30 text-[10px]">Lote Activo</Badge>
                    </div>
                  ) : (
                    <select
                      value={batchId}
                      onChange={(e) => setBatchId(e.target.value)}
                      className="w-full bg-[#0a0f1d] border border-white/10 text-white rounded-lg p-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:ring-offset-0 transition-colors cursor-pointer disabled:opacity-50"
                      disabled={submitting || !selectedProduct}
                      required
                    >
                      <option value="" className="text-gray-400">
                        {selectedProduct ? '-- Selecciona un lote activo --' : '-- Selecciona un producto primero --'}
                      </option>
                      {activeBatches
                        .filter((batch) => batch.productName === selectedProduct)
                        .map((batch) => (
                          <option key={batch.id} value={batch.id} className="text-white bg-[#0a0f1d]">
                            Lote: {batch.batchNumber}
                          </option>
                        ))}
                    </select>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Cantidad en gramos (g)</label>
                  <div className="relative flex items-center">
                    <Input
                      type="number"
                      min="0.1"
                      step="0.1"
                      placeholder="ej. 40.0"
                      value={quantityGrams}
                      onChange={(e) => setQuantityGrams(e.target.value)}
                      className="bg-[#0a0f1d] border-white/10 text-white focus:border-primary focus:ring-1 focus:ring-primary w-full pr-10"
                      disabled={submitting}
                      required
                    />
                    <span className="absolute right-3 text-xs font-bold text-gray-500">g</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-emerald-600 text-white font-bold mt-4 cursor-pointer"
                  disabled={submitting}
                >
                  {submitting ? 'Guardando...' : 'Registrar Consumo'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </Card>
      </div>

      {/* Buscador de Catálogo de Productos */}
      <Card className="glass-panel border-none p-6 shadow-2xl transition-all duration-200 hover:border-white/10">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-lg font-bold text-white">Buscador de Suplementos y Alimentos</CardTitle>
          <CardDescription className="text-gray-400">
            Busca y consulta el valor de tu producto, inspecciona su trazabilidad o registra tu consumo al instante
          </CardDescription>
        </CardHeader>
        
        {/* Controles de Búsqueda y Filtro */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between mb-6">
          <div className="relative group flex-1">
            <Search className="absolute left-4 top-3 h-4 w-4 text-gray-400 group-hover:text-primary transition-colors" />
            <Input
              type="text"
              placeholder="Buscar por nombre de producto, marca o categoría (ej. Proteína, Avena, Wild)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border-white/10 text-white pl-11 pr-4 focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-gray-400 transition-all duration-200"
            />
          </div>
          
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-300 cursor-pointer select-none bg-white/5 border border-white/10 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="accent-primary h-4 w-4 rounded cursor-pointer"
            />
            <span>Solo productos con lotes activos</span>
          </label>
        </div>

        {/* Resultados del Buscador */}
        {loadingProducts ? (
          <p className="text-xs text-gray-400 animate-pulse py-4">Cargando catálogo de productos...</p>
        ) : (() => {
          const filteredProducts = allProducts.filter((prod) => {
            const term = searchTerm.trim().toLowerCase();
            const matchesSearch = !term ||
              prod.name.toLowerCase().includes(term) ||
              prod.brand.toLowerCase().includes(term) ||
              prod.category.toLowerCase().includes(term);

            const hasActiveBatch = activeBatches.some(b => b.productName === prod.name);
            const matchesActiveOnly = !activeOnly || hasActiveBatch;

            return matchesSearch && matchesActiveOnly;
          });

          return filteredProducts.length > 0 ? (
            <div className="space-y-3.5">
              {filteredProducts.map((prod) => {
                const allergenWarning = getProductAllergenWarning(prod.name, prod.description);
                const activeBatch = activeBatches.find(b => b.productName === prod.name);
                
                return (
                  <div key={prod.id} className="p-4 bg-white/5 border border-white/5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/10 hover:border-white/10 transition-all duration-200 shadow-md">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-white text-sm tracking-wide">{prod.name}</h4>
                        {allergenWarning && (
                          <Badge className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] font-black flex items-center gap-1 py-0.5 px-2">
                            <AlertTriangle className="h-3 w-3 text-rose-400 animate-pulse" /> Contiene: {allergenWarning}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{prod.brand} • <span className="text-primary font-medium">{prod.category}</span></p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                      <div className="flex gap-1.5 text-[10px] font-bold">
                        <Badge className="bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">P: {prod.proteinPer100g}g</Badge>
                        <Badge className="bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">C: {prod.carbsPer100g}g</Badge>
                        <Badge className="bg-amber-950/60 text-amber-300 border border-amber-800/40">G: {prod.fatPer100g}g</Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        {activeBatch ? (
                          <>
                            <Button
                              onClick={() => handleOpenRegisterForProduct(prod.name, activeBatch.id)}
                              size="sm"
                              className="bg-primary hover:bg-emerald-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-150 flex items-center gap-1"
                            >
                              <PlusCircle className="h-3.5 w-3.5" /> Registrar Consumo
                            </Button>
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/40 hover:text-cyan-300 font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-150 flex items-center gap-1"
                            >
                              <Link to={`/traceability/${activeBatch.id}`}>
                                <Eye className="h-3.5 w-3.5" /> Ver Trazabilidad
                              </Link>
                            </Button>
                          </>
                        ) : (
                          <Badge variant="outline" className="text-gray-500 border-white/5 bg-white/2 text-[10px] py-1 px-2.5 rounded-lg">
                            Sin Lotes Activos (No Registrable)
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400 border border-white/5 border-dashed rounded-xl bg-white/2">
              <Search className="h-8 w-8 mx-auto text-gray-600 mb-2 stroke-[1.5]" />
              <p className="text-sm font-semibold">No se encontraron productos.</p>
              <p className="text-xs text-gray-500 mt-1">
                {activeOnly 
                  ? "Prueba desmarcando el filtro 'Solo productos con lotes activos' para ver el catálogo completo."
                  : "Prueba buscando otra palabra clave."}
              </p>
            </div>
          );
        })()}
      </Card>

      {/* Historial de Consumos Paginado */}
      <Card className="glass-panel border-none p-6 shadow-2xl transition-all duration-200 hover:border-white/10">
        <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-white">Historial de Consumos</CardTitle>
            <CardDescription className="text-gray-400">Tus ingestas registradas y trazadas</CardDescription>
          </div>
        </CardHeader>
        
        {loadingHistory ? (
          <p className="text-center py-6 text-sm text-gray-400">Cargando historial...</p>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3 border border-white/5 border-dashed rounded-lg bg-white/5">
            <Dumbbell className="h-10 w-10 text-gray-600 stroke-[1.5]" />
            <p className="text-sm font-medium">Aún no tienes consumos registrados.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto border border-white/5 rounded-lg shadow-inner">
              <table className="w-full text-left border-collapse text-sm text-gray-300">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 text-xs font-semibold uppercase text-gray-400">
                    <th className="p-4">Fecha</th>
                    <th className="p-4">Producto</th>
                    <th className="p-4 text-center">Gramos</th>
                    <th className="p-4 text-center">Proteína</th>
                    <th className="p-4 text-center">Carbohidratos</th>
                    <th className="p-4 text-center">Grasas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {history.map((log) => (
                    <tr key={log.id} className="odd:bg-white/2 even:bg-transparent hover:bg-white/5 transition-all duration-200 cursor-help" title="Registro de ingesta certificado e inmutable">
                      <td className="p-4 text-xs font-medium text-gray-400">
                        <div className="flex items-center gap-2">
                          <Lock className="h-3.5 w-3.5 text-gray-500" />
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-gray-600" />
                            {new Date(log.consumptionDate).toLocaleDateString()} {new Date(log.consumptionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-white">{log.productName}</td>
                      <td className="p-4 text-center font-bold text-gray-100">{log.quantityGrams}g</td>
                      <td className="p-4 text-center text-emerald-400 font-bold">{log.consumedMacros.protein}g</td>
                      <td className="p-4 text-center text-cyan-400 font-bold">{log.consumedMacros.carbs}g</td>
                      <td className="p-4 text-center text-amber-500 font-bold">{log.consumedMacros.fat}g</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Controles de Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2 pt-2 text-xs">
                <span className="text-gray-400">
                  Página <strong className="text-gray-200">{currentPage + 1}</strong> de <strong className="text-gray-200">{totalPages}</strong>
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/10 text-gray-300 hover:text-white"
                    disabled={currentPage === 0}
                    onClick={() => fetchHistory(currentPage - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" /> Anterior
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/10 text-gray-300 hover:text-white"
                    disabled={currentPage === totalPages - 1}
                    onClick={() => fetchHistory(currentPage + 1)}
                  >
                    Siguiente <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
export default UserDashboard;
