import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { api } from '../services/api';
import { Timeline } from '../components/trace/Timeline';
import type { TimelineStep } from '../components/trace/Timeline';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, ShieldAlert, Calendar, Info, CornerDownRight, Award } from 'lucide-react';

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

export const Traceability: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const { isAuthenticated } = useAuthStore();
  const [data, setData] = useState<TraceabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchTraceability = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/batches/${batchId}/traceability`, {
          signal: controller.signal,
        });
        setData(response.data);
        setError(null);
      } catch (err: any) {
        if (!axios.isCancel(err)) {
          const msg = err.response?.data?.message || 'No se pudo recuperar la trazabilidad de este lote.';
          setError(msg);
          toast.error(msg);
        }
      } finally {
        setLoading(false);
      }
    };

    if (batchId) {
      fetchTraceability();
    }

    return () => {
      controller.abort();
    };
  }, [batchId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="text-sm text-gray-400">Recuperando trazabilidad del lote...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto mt-12">
        <Card className="glass-panel border-none p-6 text-center shadow-xl">
          <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Error de Trazabilidad</h2>
          <p className="text-gray-400 text-sm mb-6">{error || 'El lote especificado no existe.'}</p>
          <Button asChild className="bg-primary hover:bg-emerald-600">
            <Link to="/">Volver al Inicio</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Encabezado del Producto y Lote */}
      <Card className="glass-panel border-none relative overflow-hidden shadow-2xl transition-all duration-200 hover:border-white/10">
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${data.status === 'ACTIVE' ? 'bg-primary' : 'bg-rose-500'}`} />
        
        <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-primary uppercase bg-primary/10 px-2.5 py-0.5 rounded border border-primary/20 flex items-center gap-1">
                🛡️ Datos de Trazabilidad Inmutables
              </span>
              <Badge variant={data.status === 'ACTIVE' ? 'default' : 'destructive'} className="font-bold text-xs uppercase">
                {data.status === 'ACTIVE' ? 'Lote Activo (Apto)' : 'Retirado (Recall)'}
              </Badge>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">{data.productName}</h1>
            <p className="text-sm text-gray-400 flex items-center gap-1.5">
              <CornerDownRight className="h-4 w-4 text-primary" />
              Código de Lote: <strong className="text-gray-200">{data.batchNumber}</strong>
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto">
            {data.status === 'ACTIVE' ? (
              <Button asChild variant="destructive" className="flex items-center gap-2 font-bold w-full md:w-auto transition-all duration-200 hover:-translate-y-0.5">
                <Link to={isAuthenticated ? `/quality-reports/new/${data.batchId}` : '/login'}>
                  <ShieldAlert className="h-4 w-4" />
                  Reportar Lote Defectuoso
                </Link>
              </Button>
            ) : (
              <div className="p-3 bg-rose-950/20 border border-rose-800 text-rose-300 rounded-lg text-xs max-w-xs flex gap-2">
                <ShieldAlert className="h-5 w-5 shrink-0" />
                <p><strong>Alerta:</strong> Este lote fue retirado por fallas de inocuidad. Evita su consumo.</p>
              </div>
            )}
          </div>
        </div>

        {/* Ficha técnica de producción */}
        <div className="border-t border-white/5 bg-white/5 py-4 px-6 md:px-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <Calendar className="h-4 w-4 text-secondary" />
            <span>Fecha de Producción: <strong className="text-gray-200">{data.productionDate}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Calendar className="h-4 w-4 text-secondary" />
            <span>Fecha de Expiración: <strong className="text-gray-200">{data.expirationDate}</strong></span>
          </div>
        </div>
      </Card>

      {/* Certificados del Lote */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 ml-2">
          <Award className="h-5 w-5 text-secondary animate-pulse" />
          Certificados Químicos y de Calidad
        </h2>
        {data.certificates && data.certificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.certificates.map((cert, index) => (
              <Card key={index} className="glass-panel border-none p-5 flex items-center justify-between shadow-lg hover:bg-white/10 hover:border-white/10 transition-all duration-250">
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm">{cert.laboratoryName}</h4>
                  <p className="text-xs text-gray-400">Fecha: {cert.issueDate}</p>
                </div>
                <Button asChild size="sm" className="bg-primary hover:bg-emerald-600 text-white font-bold transition-all duration-200 hover:-translate-y-0.5 shadow-md border-none">
                  <a href={cert.documentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-white" />
                    Certificado Oficial Calidad
                  </a>
                </Button>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="glass-panel border-none p-5 text-center text-gray-400 flex items-center justify-center gap-2">
            <Info className="h-4 w-4 text-gray-500" />
            <span>No se han adjuntado certificados a este lote aún.</span>
          </Card>
        )}
      </div>


      {/* Línea de tiempo de Ingredientes */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 ml-2">
          <Info className="h-5 w-5 text-secondary" />
          Línea de Tiempo de Trazabilidad de Ingredientes
        </h2>
        <Timeline steps={data.timeline} />
      </div>
    </div>
  );
};
export default Traceability;
