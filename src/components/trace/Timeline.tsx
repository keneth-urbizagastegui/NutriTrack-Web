import React from 'react';
import { Calendar, Tag, ShieldCheck } from 'lucide-react';

export interface TimelineStep {
  ingredientName: string;
  supplierName: string;
  arrivalDate: string;
  freshness: 'FRESH' | 'MATURING' | 'EXPIRED';
}

interface TimelineProps {
  steps: TimelineStep[];
}

export const Timeline: React.FC<TimelineProps> = ({ steps }) => {
  const getFreshnessStyles = (status: string) => {
    switch (status) {
      case 'FRESH':
        return 'bg-emerald-950/40 border-emerald-800 text-emerald-300';
      case 'MATURING':
        return 'bg-amber-950/40 border-amber-800 text-amber-300';
      case 'EXPIRED':
        return 'bg-rose-950/40 border-rose-800 text-rose-300';
      default:
        return 'bg-slate-900 border-slate-700 text-gray-300';
    }
  };

  const getFreshnessLabel = (status: string) => {
    switch (status) {
      case 'FRESH': return 'Óptimo (Fresco)';
      case 'MATURING': return 'Madurando (Límite)';
      case 'EXPIRED': return 'Expirado (No usar)';
      default: return status;
    }
  };

  if (steps.length === 0) {
    return (
      <div className="glass-panel p-6 text-center text-gray-400">
        No hay ingredientes registrados para este lote de producción.
      </div>
    );
  }

  return (
    <div className="relative ml-4 py-2 space-y-8">
      {/* Línea conectora vertical con gradiente */}
      <div className="absolute left-3.75 top-4 bottom-4 w-0.5 bg-linear-to-b from-primary via-emerald-500/40 to-slate-800" />

      {steps.map((step, idx) => (
        <div key={idx} className="relative ml-8">
          {/* Nodo indicador en la línea con brillo */}
          <span className="absolute -left-12 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#0d1527] border-2 border-primary shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <span className={`h-3 w-3 rounded-full ${
              step.freshness === 'FRESH' ? 'bg-emerald-500 animate-pulse' :
              step.freshness === 'MATURING' ? 'bg-amber-500' : 'bg-rose-500'
            }`} />
          </span>

          <div className={`glass-panel p-5 border rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:border-white/20 ${getFreshnessStyles(step.freshness)}`}>
            <div className="space-y-1.5">
              <h4 className="font-bold text-lg text-white flex items-center gap-2">
                {step.ingredientName}
              </h4>
              <div className="flex flex-wrap gap-4 text-xs text-gray-300">
                <span className="flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5 text-gray-400" />
                  Proveedor: <strong className="text-gray-200">{step.supplierName}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  Fecha de Llegada: <strong className="text-gray-200">{step.arrivalDate}</strong>
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className={`px-3 py-1 text-xs font-bold rounded-full border uppercase ${getFreshnessStyles(step.freshness)}`}>
                {getFreshnessLabel(step.freshness)}
              </span>
              <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                <ShieldCheck className="h-3 w-3 text-emerald-500" /> Trazabilidad verificada
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
export default Timeline;

