import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Loader2, ShoppingBag, Info } from 'lucide-react';

export const CreateProduct: React.FC = () => {
  const navigate = useNavigate();

  // Form states
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('SUPPLEMENT');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !brand.trim() || !protein || !carbs || !fat) {
      toast.error('Por favor completa todos los campos obligatorios.');
      return;
    }

    const protVal = Number(protein);
    const carbVal = Number(carbs);
    const fatVal = Number(fat);

    // Validaciones de rangos
    if (protVal < 0 || protVal > 100 || carbVal < 0 || carbVal > 100 || fatVal < 0 || fatVal > 100) {
      toast.error('Los valores de macronutrientes deben estar en el rango de 0g a 100g.');
      return;
    }

    if (protVal + carbVal + fatVal > 100) {
      toast.error('La suma de macronutrientes no puede exceder los 100 gramos.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/products', {
        name,
        brand,
        description,
        category,
        proteinPer100g: protVal,
        carbsPer100g: carbVal,
        fatPer100g: fatVal
      });

      toast.success('Producto creado correctamente en el catálogo.');
      navigate('/products');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Error al crear el producto.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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
            <ShoppingBag className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl font-bold text-white">Nuevo Producto Fitness</CardTitle>
          </div>
          <CardDescription className="text-gray-400">
            Registra un nuevo producto alimentario o suplemento nutricional.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Nombre del Producto *</label>
                <Input
                  type="text"
                  placeholder="ej. Ultra Whey Isolada"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  disabled={submitting}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Marca (Brand) *</label>
                <Input
                  type="text"
                  placeholder="ej. NutriFit UTEC"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  disabled={submitting}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Categoría *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-lg p-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:ring-offset-0 transition-colors"
                  disabled={submitting}
                  required
                >
                  <option value="SUPPLEMENT">Suplemento</option>
                  <option value="READY_MEAL">Comida Preparada</option>
                  <option value="BEVERAGE">Bebida Deportiva</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Descripción</label>
                <Input
                  type="text"
                  placeholder="ej. Proteína de rápida absorción libre de lactosa"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Panel de Macronutrientes */}
            <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-4 mt-2">
              <h3 className="font-bold text-white text-sm flex items-center gap-1.5 border-b border-white/5 pb-2">
                <Info className="h-4 w-4 text-secondary" />
                Macronutrientes (por cada 100g de producto)
              </h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Proteína (g) *</label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="ej. 85.0"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                    disabled={submitting}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Carbohidratos (g) *</label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="ej. 2.5"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                    disabled={submitting}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Grasas (g) *</label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="ej. 1.0"
                    value={fat}
                    onChange={(e) => setFat(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                    disabled={submitting}
                    required
                  />
                </div>
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
                  Creando Producto...
                </>
              ) : (
                'Crear Producto'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
export default CreateProduct;
