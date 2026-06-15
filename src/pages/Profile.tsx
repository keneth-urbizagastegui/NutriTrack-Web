import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, User, Check, Plus, AlertCircle } from 'lucide-react';

interface Ingredient {
  id: number;
  name: string;
  description: string;
  shelfLifeDays: number;
}

export const Profile: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Lista local de alérgenos registrados en esta sesión para dar feedback visual
  const [sessionAllergens, setSessionAllergens] = useState<Ingredient[]>(() => {
    const saved = sessionStorage.getItem('sessionAllergens');
    return saved ? JSON.parse(saved) : [];
  });

  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        setLoading(true);
        const response = await api.get('/ingredients', {
          params: { page: 0, size: 50, sort: 'name,asc' }
        });
        setIngredients(response.data.content);
      } catch (err: any) {
        toast.error('Error al recuperar el catálogo de ingredientes.');
      } finally {
        setLoading(false);
      }
    };
    fetchIngredients();
  }, []);

  const handleAddAllergen = async (ingredient: Ingredient) => {
    // Si ya está registrado en la sesión, evitamos re-registro
    if (sessionAllergens.some((a) => a.id === ingredient.id)) {
      toast.info('Este ingrediente ya está marcado en tu perfil.');
      return;
    }

    try {
      setSavingId(ingredient.id);
      await api.post('/users/allergens', { ingredientId: ingredient.id });
      
      const updatedAllergens = [...sessionAllergens, ingredient];
      setSessionAllergens(updatedAllergens);
      sessionStorage.setItem('sessionAllergens', JSON.stringify(updatedAllergens));
      
      toast.success(`"${ingredient.name}" marcado como alérgeno correctamente.`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al guardar el alérgeno.');
    } finally {
      setSavingId(null);
    }
  };

  const handleClearAllergens = () => {
    setSessionAllergens([]);
    sessionStorage.removeItem('sessionAllergens');
    toast.info('Se limpió el listado visual de alérgenos de la sesión.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Información del perfil */}
      <Card className="glass-panel border-none p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary" />
        <div className="flex items-center gap-4">
          <div className="bg-white/5 p-4 rounded-full border border-white/10">
            <User className="h-10 w-10 text-secondary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Mi Perfil Fitness</h1>
            <p className="text-sm text-gray-400">Gestiona tus restricciones alimentarias y alérgenos personales</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lista de alérgenos del usuario */}
        <Card className="glass-panel border-none p-6 shadow-xl md:col-span-1 flex flex-col justify-between">
          <div>
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-500" />
                Mis Alérgenos
              </CardTitle>
              <CardDescription className="text-gray-400">
                Ingredientes que tienes prohibido consumir
              </CardDescription>
            </CardHeader>
            <div className="flex flex-wrap gap-2 mt-2">
              {sessionAllergens.length > 0 ? (
                sessionAllergens.map((alg) => (
                  <Badge key={alg.id} className="bg-rose-950/40 text-rose-400 border border-rose-800 uppercase font-bold py-1 px-2.5">
                    {alg.name}
                  </Badge>
                ))
              ) : (
                <div className="p-4 bg-white/5 border border-white/5 rounded-lg text-xs text-gray-400 flex items-center gap-1.5 w-full">
                  <AlertCircle className="h-4 w-4 text-gray-500" />
                  <span>Sin restricciones marcadas en esta sesión.</span>
                </div>
              )}
            </div>
          </div>
          {sessionAllergens.length > 0 && (
            <Button
              onClick={handleClearAllergens}
              variant="outline"
              className="w-full mt-6 border-white/10 text-gray-400 hover:text-white"
            >
              Limpiar Vista Sesión
            </Button>
          )}
        </Card>

        {/* Buscador/Selector de Ingredientes */}
        <Card className="glass-panel border-none p-6 shadow-xl md:col-span-2">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-bold text-white">Marcar Alérgenos del Catálogo</CardTitle>
            <CardDescription className="text-gray-400">
              Selecciona ingredientes para bloquear consumos accidentales de lotes que los contengan
            </CardDescription>
          </CardHeader>

          {loading ? (
            <p className="text-sm text-gray-400 animate-pulse">Cargando catálogo de ingredientes...</p>
          ) : ingredients.length === 0 ? (
            <p className="text-sm text-gray-400">No hay ingredientes registrados en el sistema.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-2">
              {ingredients.map((ing) => {
                const isMarked = sessionAllergens.some((a) => a.id === ing.id);
                return (
                  <div
                    key={ing.id}
                    className="p-3 bg-white/5 rounded-lg border border-white/5 flex items-center justify-between gap-2 hover:bg-white/10 transition-colors"
                  >
                    <div>
                      <h4 className="font-bold text-white text-sm">{ing.name}</h4>
                      <p className="text-[10px] text-gray-400">Vida útil: {ing.shelfLifeDays} días</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddAllergen(ing)}
                      className={isMarked 
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                        : 'bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300'
                      }
                      disabled={savingId === ing.id}
                    >
                      {isMarked ? (
                        <Check className="h-4 w-4" />
                      ) : savingId === ing.id ? (
                        '...'
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
export default Profile;
