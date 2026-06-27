import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, PlusCircle, ChevronLeft, ChevronRight, CornerDownRight } from 'lucide-react';

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

export const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchProducts = async (pageToFetch = 0) => {
    try {
      setLoading(true);
      const response = await api.get('/products', {
        params: { page: pageToFetch, size: 8, sort: 'name,asc' }
      });
      setProducts(response.data.content);
      setTotalPages(response.data.totalPages);
      setPage(pageToFetch);
    } catch {
      toast.error('Error al cargar la lista de productos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts(0);
  }, []);


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShoppingBag className="h-6 w-6 text-primary" />
          Catálogo de Productos
        </h1>
        <Button asChild className="bg-primary hover:bg-emerald-600 text-white font-bold flex items-center gap-1.5">
          <Link to="/products/new">
            <PlusCircle className="h-5 w-5" />
            Nuevo Producto
          </Link>
        </Button>
      </div>

      <Card className="glass-panel border-none p-6 shadow-2xl">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-lg font-bold text-white">Productos Fitness Registrados</CardTitle>
          <CardDescription className="text-gray-400">
            Productos activos de la planta. Selecciona un producto para registrar un nuevo lote de producción.
          </CardDescription>
        </CardHeader>

        {loading ? (
          <p className="text-center py-6 text-sm text-gray-400">Cargando catálogo...</p>
        ) : products.length === 0 ? (
          <p className="text-center py-8 text-sm text-gray-400">No hay productos registrados en el sistema.</p>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((prod) => (
                <Card key={prod.id} className="bg-white/5 border border-white/5 p-4 flex flex-col justify-between hover:border-white/10 transition-colors shadow-lg">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-white text-base">{prod.name}</h3>
                      <Badge className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                        {prod.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400">{prod.brand}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{prod.description || 'Sin descripción'}</p>
                    
                    {/* Visualización de macros */}
                    <div className="flex gap-2 pt-2 text-[10px]">
                      <Badge className="bg-emerald-950 text-emerald-300 border border-emerald-800/30">Prot: {prod.proteinPer100g}g</Badge>
                      <Badge className="bg-cyan-950 text-cyan-300 border border-cyan-800/30">Carb: {prod.carbsPer100g}g</Badge>
                      <Badge className="bg-amber-950 text-amber-300 border border-amber-800/30">Gras: {prod.fatPer100g}g</Badge>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-3 mt-4 flex justify-between items-center">
                    <span className="text-[10px] text-gray-500">ID: {prod.id}</span>
                    <Button asChild size="sm" className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs flex items-center gap-1">
                      <Link to={`/products/${prod.id}/batches/new`}>
                        <CornerDownRight className="h-3.5 w-3.5 text-primary" />
                        Crear Lote
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Controles de Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2 pt-2 text-xs border-t border-white/5">
                <span className="text-gray-400">
                  Página <strong className="text-gray-200">{page + 1}</strong> de <strong className="text-gray-200">{totalPages}</strong>
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/10 text-gray-300 hover:text-white"
                    disabled={page === 0}
                    onClick={() => fetchProducts(page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" /> Anterior
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/10 text-gray-300 hover:text-white"
                    disabled={page === totalPages - 1}
                    onClick={() => fetchProducts(page + 1)}
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
export default ProductList;
