import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Dumbbell, QrCode, Check, Link as LinkIcon, Download } from 'lucide-react';
import { useNavigate as routerNavigate } from 'react-router-dom';

interface Product {
  id: number;
  name: string;
  brand: string;
}

interface Ingredient {
  id: number;
  name: string;
}

interface Supplier {
  id: number;
  name: string;
  isActive: boolean;
}

interface LinkedIngredient {
  ingredientName: string;
  supplierName: string;
  arrivalDate: string;
  freshnessStatus: string;
}

interface CreatedBatch {
  id: number;
  batchNumber: string;
  qrCodeUrl: string;
}

export const CreateBatch: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = routerNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);

  // Form Lote states
  const [batchNumber, setBatchNumber] = useState('');
  const [productionDate, setProductionDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Lote Creado (para el paso 2: Vincular ingredientes)
  const [createdBatch, setCreatedBatch] = useState<CreatedBatch | null>(null);

  // Catálogos para vinculación
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [linking, setLinking] = useState(false);
  const [linkedIngredients, setLinkedIngredients] = useState<LinkedIngredient[]>([]);

  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        setLoadingProduct(true);
        // Obtener el producto directamente por su ID
        const prodRes = await api.get(`/products/${productId}`);
        if (prodRes.data) {
          setProduct(prodRes.data);
        } else {
          toast.error('Producto no encontrado.');
          navigate('/products');
          return;
        }

        // Cargar ingredientes y proveedores
        const ingRes = await api.get('/ingredients', { params: { size: 50 } });
        setIngredients(ingRes.data.content);

        const supRes = await api.get('/suppliers', { params: { size: 50 } });
        setSuppliers(supRes.data.content.filter((s: Supplier) => s.isActive));
      } catch (err) {
        const error = err as { response?: { data?: { message?: string } } };
        const msg = error.response?.data?.message || 'Error de conexión con el servidor.';
        toast.error(`Error al cargar datos base del lote: ${msg}`, { id: 'fetch-base-data-error' });
      } finally {
        setLoadingProduct(false);
      }
    };
    if (productId) {
      fetchBaseData();
    }
  }, [productId, navigate]);

  const handleSubmitBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchNumber.trim() || !productionDate || !expirationDate) {
      toast.error('Todos los campos son obligatorios.');
      return;
    }

    if (new Date(expirationDate) <= new Date(productionDate)) {
      toast.error('La fecha de vencimiento debe ser posterior a la de producción.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post(`/products/${productId}/batches`, {
        batchNumber,
        productionDate,
        expirationDate
      });

      setCreatedBatch(response.data);
      toast.success('Lote creado y QR dinámico generado en AWS S3.');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Error al crear el lote de producción.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLinkIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIngredient || !selectedSupplier || !arrivalDate) {
      toast.error('Completa los campos de ingrediente, proveedor y llegada.');
      return;
    }

    if (!createdBatch) return;

    try {
      setLinking(true);
      const res = await api.post(`/batches/${createdBatch.id}/ingredients`, {
        ingredientId: Number(selectedIngredient),
        supplierId: Number(selectedSupplier),
        arrivalDate
      });

      // Agregar ingrediente vinculado al listado local
      const ingName = ingredients.find(i => i.id === Number(selectedIngredient))?.name || '';
      const supName = suppliers.find(s => s.id === Number(selectedSupplier))?.name || '';
      
      setLinkedIngredients([
        ...linkedIngredients, 
        { 
          ingredientName: ingName, 
          supplierName: supName, 
          arrivalDate, 
          freshnessStatus: res.data.freshnessStatus || 'FRESH' 
        }
      ]);

      toast.success('Ingrediente asociado al lote con éxito.');
      setSelectedIngredient('');
      setSelectedSupplier('');
      setArrivalDate('');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Error al asociar ingrediente.');
    } finally {
      setLinking(false);
    }
  };

  if (loadingProduct) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="text-sm text-gray-400">Verificando producto...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="outline" className="border-white/10 text-gray-400 hover:text-white">
          <Link to="/products" className="flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Volver a Productos
          </Link>
        </Button>
      </div>

      <Card className="glass-panel border-none p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary to-secondary" />


        <CardHeader className="px-0 pt-0">
          <div className="flex items-center gap-2 mb-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl font-bold text-white">Registrar Lote de Producción</CardTitle>
          </div>
          <CardDescription className="text-gray-400">
            Producto: <strong className="text-white">{product?.name}</strong> ({product?.brand})
          </CardDescription>
        </CardHeader>

        <CardContent className="px-0">
          {!createdBatch ? (
            /* PASO 1: Crear Lote */
            <form onSubmit={handleSubmitBatch} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Número de Lote *</label>
                <Input
                  type="text"
                  placeholder="ej. B-102-LURIN"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  disabled={submitting}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Fecha de Producción *</label>
                  <Input
                    type="date"
                    value={productionDate}
                    onChange={(e) => setProductionDate(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                    disabled={submitting}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Fecha de Vencimiento *</label>
                  <Input
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                    disabled={submitting}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-emerald-600 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 mt-4"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Registrando Lote y Generando QR...
                  </>
                ) : (
                  'Crear Lote y Generar QR'
                )}
              </Button>
            </form>
          ) : (
            /* PASO 2: QR Generado y Vincular Ingredientes */
            <div className="space-y-8">
              {/* Código QR Generado */}
              <div className="p-5 bg-white/5 border border-white/5 rounded-xl flex flex-col sm:flex-row items-center gap-6">
                <div className="flex flex-col items-center shrink-0">
                  {createdBatch.qrCodeUrl ? (
                    <>
                      <img 
                        src={createdBatch.qrCodeUrl} 
                        alt="Lote QR" 
                        className="w-32 h-32 bg-white p-2 rounded-lg shadow-lg border border-gray-200"
                      />
                      <Button
                        size="sm"
                        className="bg-primary hover:bg-emerald-600 text-white font-bold text-[10px] h-7 px-2.5 flex items-center gap-1 mt-2 cursor-pointer shadow-md w-full justify-center"
                        onClick={async () => {
                          try {
                            if (createdBatch.qrCodeUrl.startsWith('data:')) {
                              const link = document.createElement('a');
                              link.href = createdBatch.qrCodeUrl;
                              link.download = `QR-LOTE-${createdBatch.batchNumber}.png`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            } else {
                              const response = await fetch(createdBatch.qrCodeUrl);
                              const blob = await response.blob();
                              const blobUrl = URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = blobUrl;
                              link.download = `QR-LOTE-${createdBatch.batchNumber}.png`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              URL.revokeObjectURL(blobUrl);
                            }
                            toast.success('Descarga del código QR iniciada.');
                          } catch {
                            window.open(createdBatch.qrCodeUrl, '_blank');
                            toast.info('Se abrió el código QR en otra pestaña para guardar.');
                          }
                        }}
                      >
                        <Download className="h-3.5 w-3.5" /> Descargar QR
                      </Button>
                    </>
                  ) : (
                    <div className="w-32 h-32 bg-slate-800 border border-slate-700 flex flex-col items-center justify-center rounded-lg text-center text-xs text-gray-500 p-2">
                      <QrCode className="h-8 w-8 mb-1 text-gray-600 animate-pulse" />
                      Generando QR...
                    </div>
                  )}
                </div>
                <div className="space-y-2 text-center sm:text-left">
                  <h3 className="text-lg font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
                    <Check className="h-5 w-5 text-primary" /> Lote Creado Exitosamente
                  </h3>
                  <p className="text-sm text-gray-300">Código de lote: <strong className="text-white">{createdBatch.batchNumber}</strong></p>
                  <p className="text-xs text-gray-400">
                    URL de Trazabilidad: <Link to={`/traceability/${createdBatch.id}`} className="text-primary hover:underline">{`.../traceability/${createdBatch.id}`}</Link>
                  </p>
                </div>
              </div>

              {/* Formulario de Asociación de Ingredientes */}
              <div className="space-y-4 border-t border-white/5 pt-6">
                <h3 className="font-bold text-white text-base flex items-center gap-1.5">
                  <LinkIcon className="h-4 w-4 text-secondary" />
                  Vincular Ingredientes y Proveedores al Lote
                </h3>
                <form onSubmit={handleLinkIngredient} className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-300">Ingrediente *</label>
                    <select
                      value={selectedIngredient}
                      onChange={(e) => setSelectedIngredient(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 text-white rounded-lg p-2.5 text-xs focus:outline-none focus:border-primary"
                      disabled={linking}
                      required
                    >
                      <option value="" className="bg-[#0b1329] text-white">Selecciona ingrediente...</option>
                      {ingredients.map(i => (
                        <option key={i.id} value={i.id} className="bg-[#0b1329] text-white">{i.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-300">Proveedor *</label>
                    <select
                      value={selectedSupplier}
                      onChange={(e) => setSelectedSupplier(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 text-white rounded-lg p-2.5 text-xs focus:outline-none focus:border-primary"
                      disabled={linking}
                      required
                    >
                      <option value="" className="bg-[#0b1329] text-white">Selecciona proveedor...</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id} className="bg-[#0b1329] text-white">{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-300">Llegada de materia prima *</label>
                    <Input
                      type="date"
                      value={arrivalDate}
                      onChange={(e) => setArrivalDate(e.target.value)}
                      className="bg-slate-900 border-white/10 text-xs text-white"
                      disabled={linking}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-emerald-600 text-white font-bold sm:col-span-3 text-xs mt-2"
                    disabled={linking}
                  >
                    {linking ? 'Asociando...' : 'Asociar Ingrediente a este Lote'}
                  </Button>
                </form>
              </div>

              {/* Lista de Ingredientes Asociados */}
              {linkedIngredients.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-300 text-xs uppercase tracking-wider ml-1">Ingredientes Vinculados</h4>
                  <div className="space-y-2">
                    {linkedIngredients.map((item, idx) => (
                      <div key={idx} className="p-3 bg-white/5 border border-white/5 rounded-lg flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-white">{item.ingredientName}</p>
                          <p className="text-gray-400">Proveedor: {item.supplierName} • Llegada: {item.arrivalDate}</p>
                        </div>
                        <Badge className="bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold uppercase text-[9px]">
                          {item.freshnessStatus}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botón Finalizar */}
              <div className="flex justify-end pt-4 border-t border-white/5">
                <Button asChild className="bg-primary hover:bg-emerald-600 text-white font-bold">
                  <Link to="/products">
                    Finalizar Creación de Lote
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
export default CreateBatch;
