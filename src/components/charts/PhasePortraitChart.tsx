/**
 * Phase Space Portrait Chart (相空间轨线图)
 * Visualizes trajectories in 2D state space (e.g. S1 vs S2 or Stock vs Rate),
 * revealing limit cycles, spiral attractors, and equilibrium points.
 */

import React, { useMemo } from 'react';
import { SimulationDataPoint } from '../../types/system-dynamics';

interface PhasePortraitChartProps {
  data: SimulationDataPoint[];
  xVar: { id: string; name: string; unit: string };
  yVar: { id: string; name: string; unit: string };
  currentTime?: number;
  height?: number;
}

export const PhasePortraitChart: React.FC<PhasePortraitChartProps> = ({
  data,
  xVar,
  yVar,
  currentTime,
  height = 300,
}) => {
  const margin = { top: 25, right: 25, bottom: 40, left: 55 };
  const width = 450;

  const { minX, maxX, minY, maxY } = useMemo(() => {
    if (!data || data.length === 0) return { minX: 0, maxX: 10, minY: 0, maxY: 10 };

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const d of data) {
      const vx = d[xVar.id];
      const vy = d[yVar.id];
      if (typeof vx === 'number' && !isNaN(vx)) {
        if (vx < minX) minX = vx;
        if (vx > maxX) maxX = vx;
      }
      if (typeof vy === 'number' && !isNaN(vy)) {
        if (vy < minY) minY = vy;
        if (vy > maxY) maxY = vy;
      }
    }

    if (minX === Infinity) minX = 0;
    if (maxX === -Infinity) maxX = 100;
    if (minY === Infinity) minY = 0;
    if (maxY === -Infinity) maxY = 100;

    const spanX = Math.max(1e-5, maxX - minX);
    const spanY = Math.max(1e-5, maxY - minY);

    return {
      minX: Math.max(0, minX - spanX * 0.08),
      maxX: maxX + spanX * 0.08,
      minY: Math.max(0, minY - spanY * 0.08),
      maxY: maxY + spanY * 0.08,
    };
  }, [data, xVar.id, yVar.id]);

  const scaleX = (val: number) => {
    if (maxX === minX) return margin.left;
    return margin.left + ((val - minX) / (maxX - minX)) * (width - margin.left - margin.right);
  };

  const scaleY = (val: number) => {
    if (maxY === minY) return height / 2;
    return height - margin.bottom - ((val - minY) / (maxY - minY)) * (height - margin.top - margin.bottom);
  };

  // Trajectory SVG path
  const trajectoryPath = useMemo(() => {
    if (!data || data.length === 0) return '';
    const points: string[] = [];
    for (let i = 0; i < data.length; i++) {
      const vx = data[i][xVar.id];
      const vy = data[i][yVar.id];
      if (typeof vx === 'number' && typeof vy === 'number') {
        points.push(`${i === 0 ? 'M' : 'L'} ${scaleX(vx).toFixed(1)} ${scaleY(vy).toFixed(1)}`);
      }
    }
    return points.join(' ');
  }, [data, xVar.id, yVar.id, minX, maxX, minY, maxY]);

  // Current point coordinates
  const currentPoint = useMemo(() => {
    if (!data || data.length === 0 || currentTime === undefined) return null;
    let closest = data[0];
    let minDiff = Infinity;
    for (const d of data) {
      const diff = Math.abs(d.time - currentTime);
      if (diff < minDiff) {
        minDiff = diff;
        closest = d;
      }
    }
    const vx = closest[xVar.id];
    const vy = closest[yVar.id];
    if (typeof vx === 'number' && typeof vy === 'number') {
      return {
        x: scaleX(vx),
        y: scaleY(vy),
        valX: vx,
        valY: vy,
      };
    }
    return null;
  }, [data, currentTime, xVar.id, yVar.id, minX, maxX, minY, maxY]);

  // Start & End point coordinates
  const startPoint = data && data.length > 0 ? {
    x: scaleX(data[0][xVar.id] || 0),
    y: scaleY(data[0][yVar.id] || 0),
  } : null;

  const endPoint = data && data.length > 0 ? {
    x: scaleX(data[data.length - 1][xVar.id] || 0),
    y: scaleY(data[data.length - 1][yVar.id] || 0),
  } : null;

  return (
    <div className="bg-white rounded-xl border border-stone-200/90 shadow-xs p-4 flex flex-col font-sans">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-stone-100">
        <div>
          <h4 className="text-xs font-bold text-stone-800 tracking-tight uppercase">相空间相图 (Phase Portrait)</h4>
          <span className="text-[11px] text-stone-500">
            轨线: {xVar.name} vs {yVar.name}
          </span>
        </div>
        {currentPoint && (
          <div className="font-mono text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
            ({currentPoint.valX.toFixed(1)}, {currentPoint.valY.toFixed(1)})
          </div>
        )}
      </div>

      <div className="relative w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          {/* Grid lines */}
          <line
            x1={margin.left}
            y1={height - margin.bottom}
            x2={width - margin.right}
            y2={height - margin.bottom}
            stroke="#d6d3d1"
            strokeWidth="1.2"
          />
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={height - margin.bottom}
            stroke="#d6d3d1"
            strokeWidth="1.2"
          />

          {/* Phase Trajectory */}
          {trajectoryPath && (
            <path
              d={trajectoryPath}
              fill="none"
              stroke="#0d9488"
              strokeWidth="2.0"
              strokeOpacity="0.85"
            />
          )}

          {/* Start Point Marker */}
          {startPoint && (
            <g>
              <circle cx={startPoint.x} cy={startPoint.y} r="4" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
              <text x={startPoint.x + 6} y={startPoint.y + 3} className="text-[9px] fill-sky-800 font-mono font-bold">
                t=0
              </text>
            </g>
          )}

          {/* End Point / Attractor Marker */}
          {endPoint && (
            <g>
              <circle cx={endPoint.x} cy={endPoint.y} r="4" fill="#ea580c" stroke="#ffffff" strokeWidth="1.5" />
              <text x={endPoint.x + 6} y={endPoint.y + 3} className="text-[9px] fill-orange-800 font-mono font-bold">
                稳态/终点
              </text>
            </g>
          )}

          {/* Animated Current Point Cursor */}
          {currentPoint && (
            <g>
              <circle cx={currentPoint.x} cy={currentPoint.y} r="7" fill="#0d9488" fillOpacity="0.3" />
              <circle cx={currentPoint.x} cy={currentPoint.y} r="4" fill="#0f766e" stroke="#ffffff" strokeWidth="2" />
            </g>
          )}

          {/* Axis Labels */}
          <text
            x={width / 2}
            y={height - 8}
            textAnchor="middle"
            className="text-[10px] font-sans fill-stone-500 font-medium"
          >
            {xVar.name} [{xVar.unit}]
          </text>
          <text
            x={14}
            y={height / 2}
            textAnchor="middle"
            transform={`rotate(-90 14 ${height / 2})`}
            className="text-[10px] font-sans fill-stone-500 font-medium"
          >
            {yVar.name} [{yVar.unit}]
          </text>
        </svg>
      </div>
    </div>
  );
};
