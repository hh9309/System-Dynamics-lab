/**
 * High-Precision SVG Time-Series Chart for System Dynamics Simulation
 * Supports multi-curve toggle, current playback cursor scrubbing, hover crosshair, and auto-scaling.
 */

import React, { useState, useMemo, useRef } from 'react';
import { SimulationDataPoint } from '../../types/system-dynamics';

interface TimeSeriesChartProps {
  data: SimulationDataPoint[];
  series: {
    id: string;
    name: string;
    unit: string;
    color: string;
    dash?: string;
  }[];
  currentTime?: number;
  timeUnit?: string;
  onScrubTime?: (t: number) => void;
  height?: number;
  title?: string;
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  data,
  series,
  currentTime,
  timeUnit = '时间',
  onScrubTime,
  height = 320,
  title,
}) => {
  const [visibleSeries, setVisibleSeries] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    series.forEach((s) => (initial[s.id] = true));
    return initial;
  });

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Margins
  const margin = { top: 30, right: 30, bottom: 40, left: 60 };
  const width = 800; // viewBox width

  const activeSeries = useMemo(
    () => series.filter((s) => visibleSeries[s.id]),
    [series, visibleSeries]
  );

  // Compute domain
  const { minT, maxT, minY, maxY } = useMemo(() => {
    if (!data || data.length === 0) {
      return { minT: 0, maxT: 10, minY: 0, maxY: 10 };
    }

    const minT = data[0].time;
    const maxT = data[data.length - 1].time;

    let minY = Infinity;
    let maxY = -Infinity;

    for (const d of data) {
      for (const s of activeSeries) {
        const val = d[s.id];
        if (typeof val === 'number' && !isNaN(val)) {
          if (val < minY) minY = val;
          if (val > maxY) maxY = val;
        }
      }
    }

    if (minY === Infinity || maxY === -Infinity) {
      minY = 0;
      maxY = 100;
    } else if (minY === maxY) {
      minY = Math.max(0, minY - 10);
      maxY = maxY + 10;
    } else {
      // Add padding
      const span = maxY - minY;
      minY = Math.max(0, minY - span * 0.05);
      maxY = maxY + span * 0.08;
    }

    return { minT, maxT, minY, maxY };
  }, [data, activeSeries]);

  // Coordinate mappers
  const scaleX = (t: number) => {
    if (maxT === minT) return margin.left;
    return margin.left + ((t - minT) / (maxT - minT)) * (width - margin.left - margin.right);
  };

  const scaleY = (val: number) => {
    if (maxY === minY) return height / 2;
    return height - margin.bottom - ((val - minY) / (maxY - minY)) * (height - margin.top - margin.bottom);
  };

  // Generate path data for each series
  const paths = useMemo(() => {
    if (!data || data.length === 0) return {};

    const res: Record<string, string> = {};
    for (const s of activeSeries) {
      const parts: string[] = [];
      for (let i = 0; i < data.length; i++) {
        const d = data[i];
        const val = d[s.id];
        if (typeof val === 'number' && !isNaN(val)) {
          const x = scaleX(d.time);
          const y = scaleY(val);
          parts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
        }
      }
      res[s.id] = parts.join(' ');
    }
    return res;
  }, [data, activeSeries, minT, maxT, minY, maxY, width, height]);

  // Mouse interaction
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !data || data.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, (clientX / rect.width) * width - margin.left) / (width - margin.left - margin.right));
    const targetT = minT + ratio * (maxT - minT);

    // Find nearest data point
    let nearestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < data.length; i++) {
      const diff = Math.abs(data[i].time - targetT);
      if (diff < minDiff) {
        minDiff = diff;
        nearestIdx = i;
      }
    }
    setHoverIndex(nearestIdx);
  };

  const handleClick = () => {
    if (hoverIndex !== null && onScrubTime && data[hoverIndex]) {
      onScrubTime(data[hoverIndex].time);
    }
  };

  // Generate tick marks
  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    const count = 6;
    for (let i = 0; i <= count; i++) {
      ticks.push(minT + (i / count) * (maxT - minT));
    }
    return ticks;
  }, [minT, maxT]);

  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    const count = 5;
    for (let i = 0; i <= count; i++) {
      ticks.push(minY + (i / count) * (maxY - minY));
    }
    return ticks;
  }, [minY, maxY]);

  const hoveredPoint = hoverIndex !== null && data ? data[hoverIndex] : null;
  const currentCursorX = currentTime !== undefined ? scaleX(currentTime) : null;

  return (
    <div className="bg-white rounded-xl border border-stone-200/90 shadow-xs p-4 flex flex-col font-sans transition-all">
      {/* Header and Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-stone-100 pb-2.5">
        <div>
          {title && <h4 className="text-sm font-semibold text-stone-800 tracking-tight">{title}</h4>}
          <div className="text-xs text-stone-500 flex items-center gap-2 mt-0.5">
            <span>时间跨度: [{minT.toFixed(1)} ~ {maxT.toFixed(1)} {timeUnit}]</span>
            {currentTime !== undefined && (
              <span className="font-mono text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                当前: {currentTime.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* Legend toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {series.map((s) => {
            const isVisible = visibleSeries[s.id] !== false;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() =>
                  setVisibleSeries((prev) => ({
                    ...prev,
                    [s.id]: !prev[s.id],
                  }))
                }
                className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-all border ${
                  isVisible
                    ? 'bg-stone-50 text-stone-800 border-stone-300 font-medium'
                    : 'bg-stone-100/60 text-stone-400 border-transparent line-through'
                }`}
                title={`点击切换 ${s.name} 显示`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: isVisible ? s.color : '#a8a29e' }}
                />
                <span>{s.name}</span>
                {isVisible && hoveredPoint && hoveredPoint[s.id] !== undefined && (
                  <span className="font-mono text-stone-600 font-semibold ml-1">
                    {hoveredPoint[s.id].toFixed(1)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Container */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
          onClick={handleClick}
        >
          {/* Background Grid */}
          {yTicks.map((val, idx) => {
            const y = scaleY(val);
            return (
              <g key={`y-${idx}`}>
                <line
                  x1={margin.left}
                  y1={y}
                  x2={width - margin.right}
                  y2={y}
                  stroke="#f5f5f4"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={margin.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] font-mono fill-stone-400"
                >
                  {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(val < 10 ? 1 : 0)}
                </text>
              </g>
            );
          })}

          {xTicks.map((t, idx) => {
            const x = scaleX(t);
            return (
              <g key={`x-${idx}`}>
                <line
                  x1={x}
                  y1={margin.top}
                  x2={x}
                  y2={height - margin.bottom}
                  stroke="#f5f5f4"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={x}
                  y={height - margin.bottom + 16}
                  textAnchor="middle"
                  className="text-[10px] font-mono fill-stone-400"
                >
                  {t.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Coordinate Axes */}
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

          {/* Plotted Curves */}
          {activeSeries.map((s) => {
            const pathData = paths[s.id];
            if (!pathData) return null;
            return (
              <path
                key={s.id}
                d={pathData}
                fill="none"
                stroke={s.color}
                strokeWidth={s.dash ? 2.0 : 2.4}
                strokeDasharray={s.dash || undefined}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-opacity duration-150"
              />
            );
          })}

          {/* Current Timeline Playback Indicator */}
          {currentCursorX !== null && (
            <g>
              <line
                x1={currentCursorX}
                y1={margin.top}
                x2={currentCursorX}
                y2={height - margin.bottom}
                stroke="#0d9488"
                strokeWidth="1.8"
                strokeDasharray="3 3"
              />
              <circle
                cx={currentCursorX}
                cy={margin.top + 4}
                r="3.5"
                fill="#0d9488"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            </g>
          )}

          {/* Hover crosshair and data circles */}
          {hoveredPoint && (
            <g>
              <line
                x1={scaleX(hoveredPoint.time)}
                y1={margin.top}
                x2={scaleX(hoveredPoint.time)}
                y2={height - margin.bottom}
                stroke="#78716c"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              {activeSeries.map((s) => {
                const val = hoveredPoint[s.id];
                if (typeof val !== 'number' || isNaN(val)) return null;
                return (
                  <circle
                    key={`hover-${s.id}`}
                    cx={scaleX(hoveredPoint.time)}
                    cy={scaleY(val)}
                    r="4"
                    fill={s.color}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                );
              })}
            </g>
          )}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div
            className="absolute top-2 right-2 bg-stone-900/90 text-white rounded-lg px-3 py-2 text-xs shadow-md backdrop-blur-xs pointer-events-none border border-stone-700 font-mono"
            style={{ minWidth: 140 }}
          >
            <div className="text-stone-300 font-medium mb-1 border-b border-stone-700/80 pb-0.5 flex justify-between">
              <span>时间</span>
              <span className="text-teal-300">{hoveredPoint.time.toFixed(2)} {timeUnit}</span>
            </div>
            {activeSeries.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 text-[11px] py-0.5">
                <span className="flex items-center gap-1.5 text-stone-300 truncate max-w-[90px]">
                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: s.color }} />
                  {s.name}
                </span>
                <span className="font-semibold text-white">
                  {hoveredPoint[s.id] !== undefined ? hoveredPoint[s.id].toFixed(2) : '-'}
                  <span className="text-[10px] text-stone-400 font-normal ml-0.5">{s.unit}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
