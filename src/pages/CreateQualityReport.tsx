import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldAlert, Loader2, ArrowLeft, Info, HelpCircle } from 'lucide-react';

export const CreateQualityReport: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  
  const [batchNumber, setBatchNumber] = useState('');
  const [productName, setProductName] = useState('');
  const [loadingBatch, setLoadingBatch] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchBatchDetails = async () => {
      try {
        setLoadingBatch(true);
        const response = await api.get(`/batches/${batchId}/traceability`);
        setBatchNumber(response.data.batchNumber);
        setProductName(response.data.productName);
      } catch {
        toast.error('No se pudieron recuperar los detalles del lote a reportar.');
        navigate('/dashboard');
      } finally {
        setLoadingBatch(false);
      }
    };
    if (batchId) {
      fetchBatchDetails();
    }
  }, [batchId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Por favor completa todos los campos del reporte.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/batches/${batchId}/quality-reports`, {
        title,
        description,
      });

      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-bold">Reporte Registrado</span>
          <span>El reporte de calidad se registró en estado PENDING y se ha notificado a los administradores.</span>
        </div>,
        { duration: 5000 }
      );
      
      navigate(`/traceability/${batchId}`);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Error al enviar el reporte de calidad.');
    } finally {
      setSubmitting(false);
    }
  };


  if (loadingBatch) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="text-sm text-gray-400">Verificando lote...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="outline" className="border-white/10 text-gray-400 hover:text-white">
          <Link to={`/traceability/${batchId}`} className="flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Volver a Trazabilidad
          </Link>
        </Button>
      </div>

      <Card className="glass-panel border-none p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
        
        <CardHeader className="px-0 pt-0">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="h-6 w-6 text-rose-500" />
            <CardTitle className="text-xl font-bold text-white">Reporte de Lote Defectuoso</CardTitle>
          </div>
          <CardDescription className="text-gray-400">
            Registra una queja sanitaria sobre el lote para que control de calidad inicie una investigación.
          </CardDescription>
        </CardHeader>

        {/* Ficha del lote reportado */}
        <div className="p-4 bg-rose-950/10 border border-rose-900/50 rounded-xl space-y-2 mb-6">
          <p className="text-xs font-bold text-rose-400 flex items-center gap-1">
            <Info className="h-3.5 w-3.5" /> LOTE EN OBSERVACIÓN
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400">Producto</p>
              <p className="font-bold text-white">{productName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Código de Lote</p>
              <p className="font-bold text-white">{batchNumber}</p>
            </div>
          </div>
        </div>

        <CardContent className="px-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">Asunto / Título del Defecto</label>
              <Input
                type="text"
                placeholder="ej. Presencia de partículas oscuras en el polvo"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
                disabled={submitting}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">Descripción Detallada</label>
              <textarea
                placeholder="Describe el defecto, sabor, olor o anomalía física encontrada en el producto..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full bg-white/5 border border-white/10 text-white rounded-lg p-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:ring-offset-0 transition-colors"
                disabled={submitting}
                required
              />
            </div>

            <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/5 rounded-lg text-xs text-gray-400">
              <HelpCircle className="h-4 w-4 text-gray-500 shrink-0" />
              <p>
                Al enviar este reporte, se enviará una alerta de correo automática con tus datos de contacto al Manager de planta.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando Reporte...
                </>
              ) : (
                'Enviar Reporte de Calidad'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
export default CreateQualityReport;
