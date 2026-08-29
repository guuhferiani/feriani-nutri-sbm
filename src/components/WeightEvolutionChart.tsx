import React, { useState, useMemo } from 'react';
import { 
  TrendingDown, 
  TrendingUp, 
  Minus, 
  Scale, 
  Activity,
  Sparkles
} from 'lucide-react';
import type { Consulta } from '../types/database';

interface WeightEvolutionChartProps {
  initialWeight?: number | null;
  initialDate?: string | null;
  consultations: Consulta[];
  onOpenNewConsultation?: () => void;
}

interface DataPoint {
  id: string;
  label: string;
  dateStr: string;
  weight: number;
  isInitial?: boolean;
}

export const WeightEvolutionChart: React.FC<WeightEvolutionChartProps> = ({
  initialWeight,
  initialDate,
  consultations,
  onOpenNewConsultation,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);

  const formatBrazilianDate = (dateVal?: any) => {
    if (!dateVal) return '-';
    try {
      let str = '';
      if (dateVal instanceof Date) {
        if (isNaN(dateVal.getTime())) return '-';
        str = dateVal.toISOString().split('T')[0];
      } else {
        str = String(dateVal).split('T')[0];
      }
      const parts = str.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return str;
    } catch {
      return String(dateVal);
    }
  };

  // Build points in chronological order (oldest to newest)
  const dataPoints: DataPoint[] = useMemo(() => {
    const validConsultations = [...consultations]
      .filter((c) => c.peso != null && !isNaN(Number(c.peso)) && Number(c.peso) > 0)
      .sort((a, b) => new Date(a.data_consulta).getTime() - new Date(b.data_consulta).getTime());

    const points: DataPoint[] = [];

    // Optional: add initial weight point if no consultations or as starting point
    if (initialWeight && Number(initialWeight) > 0) {
      points.push({
        id: 'initial',
        label: 'Início',
        dateStr: formatBrazilianDate(initialDate),
        weight: Number(initialWeight),
        isInitial: true,
      });
    }

    validConsultations.forEach((c, idx) => {
      points.push({
        id: c.id,
        label: `C${idx + 1}`,
        dateStr: formatBrazilianDate(c.data_consulta),
        weight: Number(c.peso),
        isInitial: false,
      });
    });

    return points;
  }, [consultations, initialWeight, initialDate]);

  const hasConsultations = consultations.length > 0;

  // Statistics
  const stats = useMemo(() => {
    if (dataPoints.length === 0) return null;
    const weights = dataPoints.map((p) => p.weight);
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const first = dataPoints[0].weight;
    const last = dataPoints[dataPoints.length - 1].weight;
    const diff = last - first;
    const percentDiff = first > 0 ? (diff / first) * 100 : 0;

    return {
      min,
      max,
      first,
      last,
      diff,
      percentDiff,
    };
  }, [dataPoints]);

  // SVG dimensions
  const svgWidth = 700;
  const svgHeight = 220;
  const paddingX = 45;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartAreaWidth = svgWidth - paddingX * 2;
  const chartAreaHeight = svgHeight - paddingTop - paddingBottom;

  // Scaling
  const { pointsWithCoords, minScale, maxScale } = useMemo(() => {
    if (dataPoints.length === 0) {
      return { pointsWithCoords: [], minScale: 0, maxScale: 100 };
    }

    const weights = dataPoints.map((p) => p.weight);
    let minW = Math.min(...weights);
    let maxW = Math.max(...weights);

    if (minW === maxW) {
      minW = Math.max(0, minW - 5);
      maxW = maxW + 5;
    } else {
      const margin = (maxW - minW) * 0.2;
      minW = Math.max(0, minW - margin);
      maxW = maxW + margin;
    }

    const coords = dataPoints.map((p, index) => {
      const x =
        dataPoints.length === 1
          ? paddingX + chartAreaWidth / 2
          : paddingX + (index / (dataPoints.length - 1)) * chartAreaWidth;

      const normalizedY = (p.weight - minW) / (maxW - minW);
      const y = paddingTop + (1 - normalizedY) * chartAreaHeight;

      return {
        ...p,
        x,
        y,
      };
    });

    return {
      pointsWithCoords: coords,
      minScale: minW,
      maxScale: maxW,
    };
  }, [dataPoints, chartAreaWidth, chartAreaHeight, paddingX, paddingTop]);

  // SVG Line path
  const linePath = useMemo(() => {
    if (pointsWithCoords.length === 0) return '';
    return pointsWithCoords.reduce((path, pt, i) => {
      return i === 0 ? `M ${pt.x} ${pt.y}` : `${path} L ${pt.x} ${pt.y}`;
    }, '');
  }, [pointsWithCoords]);

  // SVG Area path for gradient fill
  const areaPath = useMemo(() => {
    if (pointsWithCoords.length === 0) return '';
    const first = pointsWithCoords[0];
    const last = pointsWithCoords[pointsWithCoords.length - 1];
    const bottomY = paddingTop + chartAreaHeight;
    return `M ${first.x} ${bottomY} L ${first.x} ${first.y} ${pointsWithCoords
      .slice(1)
      .map((p) => `L ${p.x} ${p.y}`)
      .join(' ')} L ${last.x} ${bottomY} Z`;
  }, [pointsWithCoords, paddingTop, chartAreaHeight]);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
      {/* Header with Title and Evolution Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>Acompanhamento Antropométrico</span>
            </span>
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Evolução de Peso ao Longo do Tempo
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro contínuo das pesagens em cada retorno clínico.
          </p>
        </div>

        {stats && hasConsultations && (
          <div className="flex items-center gap-3 self-start sm:self-center">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Variação Total
                </span>
                <div className="flex items-center gap-1.5">
                  {stats.diff < 0 ? (
                    <span className="text-emerald-700 font-extrabold text-sm flex items-center gap-0.5">
                      <TrendingDown className="w-4 h-4 text-emerald-600" />
                      <span>{Math.abs(stats.diff).toFixed(1)} kg</span>
                    </span>
                  ) : stats.diff > 0 ? (
                    <span className="text-amber-700 font-extrabold text-sm flex items-center gap-0.5">
                      <TrendingUp className="w-4 h-4 text-amber-600" />
                      <span>+{stats.diff.toFixed(1)} kg</span>
                    </span>
                  ) : (
                    <span className="text-slate-700 font-extrabold text-sm flex items-center gap-0.5">
                      <Minus className="w-4 h-4 text-slate-400" />
                      <span>0.0 kg</span>
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-slate-500">
                    ({stats.percentDiff > 0 ? `+${stats.percentDiff.toFixed(1)}%` : `${stats.percentDiff.toFixed(1)}%`})
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                Peso Atual
              </span>
              <strong className="text-sm font-black text-emerald-900">
                {stats.last.toFixed(1)} kg
              </strong>
            </div>
          </div>
        )}
      </div>

      {/* Chart Area */}
      {!hasConsultations ? (
        <div className="py-12 px-6 text-center bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white text-slate-400 flex items-center justify-center shadow-2xs border border-slate-100">
            <Scale className="w-7 h-7 stroke-[1.7]" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h4 className="text-sm font-bold text-slate-800">
              Nenhuma consulta registrada ainda
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              O gráfico de evolução de peso será construído automaticamente conforme você registrar novas consultas deste paciente.
            </p>
          </div>
          {onOpenNewConsultation && (
            <button
              type="button"
              onClick={onOpenNewConsultation}
              className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Registrar Primeira Consulta</span>
            </button>
          )}
        </div>
      ) : (
        <div className="relative w-full overflow-hidden">
          {/* Tooltip Overlay */}
          {hoveredPoint && (
            <div
              className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-full bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-semibold shadow-xl border border-slate-700 transition-all duration-150 animate-in fade-in"
              style={{
                left: `${(hoveredPoint.id === pointsWithCoords[0]?.id ? pointsWithCoords[0].x : pointsWithCoords.find(p => p.id === hoveredPoint.id)?.x || 0) / svgWidth * 100}%`,
                top: `${(pointsWithCoords.find(p => p.id === hoveredPoint.id)?.y || 40) - 10}px`,
              }}
            >
              <div className="text-[10px] text-slate-400 font-normal">
                {hoveredPoint.isInitial ? 'Peso Inicial' : `Consulta em ${hoveredPoint.dateStr}`}
              </div>
              <div className="text-sm font-extrabold text-emerald-400">
                {hoveredPoint.weight.toFixed(1)} kg
              </div>
            </div>
          )}

          {/* SVG Vector Chart */}
          <div className="w-full h-56 sm:h-64">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-full overflow-visible select-none"
            >
              <defs>
                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>

                <filter id="pointShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#059669" floodOpacity="0.4" />
                </filter>
              </defs>

              {/* Horizontal grid lines and ticks */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = paddingTop + ratio * chartAreaHeight;
                const weightVal = maxScale - ratio * (maxScale - minScale);
                return (
                  <g key={i}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={svgWidth - paddingX}
                      y2={y}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingX - 10}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="10"
                      fontWeight="600"
                      fill="#94a3b8"
                    >
                      {weightVal.toFixed(0)} kg
                    </text>
                  </g>
                );
              })}

              {/* Gradient Area under curve */}
              {areaPath && (
                <path
                  d={areaPath}
                  fill="url(#weightGrad)"
                  className="transition-all duration-300"
                />
              )}

              {/* Main Line */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#059669"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-300"
                />
              )}

              {/* Data points */}
              {pointsWithCoords.map((pt, idx) => {
                const isLast = idx === pointsWithCoords.length - 1;
                const isHovered = hoveredPoint?.id === pt.id;

                return (
                  <g
                    key={pt.id}
                    className="cursor-pointer group"
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    {/* Outer pulse ring for last/hovered point */}
                    {(isLast || isHovered) && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 12 : 9}
                        fill="#10b981"
                        fillOpacity="0.25"
                        className="animate-pulse"
                      />
                    )}

                    {/* Point Circle */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 6.5 : isLast ? 5.5 : 4.5}
                      fill={isLast ? '#059669' : '#ffffff'}
                      stroke="#059669"
                      strokeWidth={isLast ? 2.5 : 2.5}
                      filter="url(#pointShadow)"
                      className="transition-all duration-150"
                    />

                    {/* Value label above point */}
                    <text
                      x={pt.x}
                      y={pt.y - 10}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="700"
                      fill="#0f172a"
                      className="pointer-events-none"
                    >
                      {pt.weight.toFixed(1)}
                    </text>

                    {/* X-axis date label */}
                    <text
                      x={pt.x}
                      y={svgHeight - 10}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="600"
                      fill="#64748b"
                      className="pointer-events-none"
                    >
                      {pt.dateStr}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
