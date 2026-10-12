/**
 * Module 4: 动态仿真引擎与时间轴演播 (Simulation & Timeline Playback)
 * Integrates Euler & RK4 numerical solvers, interactive playback controls,
 * real-time multi-variable gauges, Time-Series charts, and Phase Portraits.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  FastForward,
  Activity,
  Layers,
  Settings2,
  TrendingUp,
  Cpu,
  Info,
} from 'lucide-react';
import {
  SystemModel,
  SimulationResult,
  SimulationConfig,
} from '../../types/system-dynamics';
import { SimulationEngine } from '../../engine/simulator';
import { TimeSeriesChart } from '../charts/TimeSeriesChart';
import { PhasePortraitChart } from '../charts/PhasePortraitChart';

interface SimulationModuleProps {
  model: SystemModel;
  simulationResult: SimulationResult;
  onUpdateConfig?: (config: SimulationConfig) => void;
  onRunSimulation?: () => void;
}

export const SimulationModule: React.FC<SimulationModuleProps> = ({
  model,
  simulationResult,
  onUpdateConfig,
  onRunSimulation,
}) => {
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [currentTimeIndex, setCurrentTimeIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'timeseries' | 'phase' | 'both'>('both');

  // Integrator config
  const [method, setMethod] = useState<'euler' | 'rk4'>(simulationResult.config.method || 'rk4');
  const [dtVal, setDtVal] = useState<number>(simulationResult.config.dt || 0.2);

  const requestRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number>(Date.now());

  const totalSteps = simulationResult.data.length;
  const currentDataPoint = simulationResult.data[currentTimeIndex] || simulationResult.data[0];
  const currentTime = currentDataPoint ? currentDataPoint.time : 0;

  // Animation frame playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      return;
    }

    lastTickTimeRef.current = Date.now();

    const tick = () => {
      const now = Date.now();
      const elapsed = now - lastTickTimeRef.current;

      // Adjust stepping by playback speed (approx 60 fps base)
      const stepInterval = Math.max(16, 50 / playbackSpeed);

      if (elapsed >= stepInterval) {
        lastTickTimeRef.current = now;
        setCurrentTimeIndex((prev) => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }

      requestRef.current = requestAnimationFrame(tick);
    };

    requestRef.current = requestAnimationFrame(tick);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, playbackSpeed, totalSteps]);

  // Method or dt change handler
  const handleConfigChange = (newMethod: 'euler' | 'rk4', newDt: number) => {
    setMethod(newMethod);
    setDtVal(newDt);
    if (onUpdateConfig) {
      onUpdateConfig({
        ...simulationResult.config,
        method: newMethod,
        dt: newDt,
      });
    }
  };

  // Scrub handler
  const handleScrubTime = (targetT: number) => {
    let nearestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < simulationResult.data.length; i++) {
      const diff = Math.abs(simulationResult.data[i].time - targetT);
      if (diff < minDiff) {
        minDiff = diff;
        nearestIdx = i;
      }
    }
    setCurrentTimeIndex(nearestIdx);
  };

  // Chart series definitions
  const stockColors = ['#0d9488', '#0284c7', '#ea580c', '#e11d48', '#7c3aed'];
  const stockSeries = model.stocks.map((s, idx) => ({
    id: s.id,
    name: s.name,
    unit: s.unit,
    color: stockColors[idx % stockColors.length],
  }));

  const flowColors = ['#059669', '#d97706', '#dc2626', '#2563eb', '#9333ea'];
  const flowSeries = model.flows.map((f, idx) => ({
    id: f.id,
    name: f.name,
    unit: f.unit,
    color: flowColors[idx % flowColors.length],
    dash: '4 2',
  }));

  // Selected variables for phase portrait
  const xPhaseVar = model.stocks[0] || { id: 's1', name: 'Stock 1', unit: 'u' };
  const yPhaseVar = model.stocks[1] || (model.flows[0] ? { id: model.flows[0].id, name: model.flows[0].name, unit: model.flows[0].unit } : xPhaseVar);

  return (
    <div className="space-y-6">
      {/* Playback Control Bar */}
      <div className="bg-stone-900 text-stone-100 rounded-xl p-4 border border-stone-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Buttons & Time readout */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 rounded-lg bg-teal-600 hover:bg-teal-500 text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer"
              title={isPlaying ? '暂停演播' : '开始时间轴演播'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setCurrentTimeIndex(0);
              }}
              className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
              title="重置到起点 t=0"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setCurrentTimeIndex((prev) => Math.min(totalSteps - 1, prev + 1));
              }}
              className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
              title="单步推进"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Current Time Display */}
            <div className="pl-3 border-l border-stone-700">
              <span className="text-[10px] text-stone-400 font-mono uppercase block">仿真时间 (t)</span>
              <span className="text-lg font-mono font-bold text-teal-400">
                {currentTime.toFixed(2)}
                <span className="text-xs text-stone-400 ml-1 font-sans">{model.config.timeUnit}</span>
              </span>
            </div>
          </div>

          {/* Center: Timeline Scrubber */}
          <div className="flex-1 max-w-md mx-2">
            <div className="flex justify-between text-[11px] text-stone-400 font-mono mb-1">
              <span>{simulationResult.config.startTime}</span>
              <span className="text-stone-300">
                进度: {((currentTimeIndex / Math.max(1, totalSteps - 1)) * 100).toFixed(0)}%
              </span>
              <span>{simulationResult.config.stopTime}</span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(0, totalSteps - 1)}
              value={currentTimeIndex}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentTimeIndex(parseInt(e.target.value, 10));
              }}
              className="w-full accent-teal-500 cursor-pointer h-2 bg-stone-700 rounded-lg appearance-none"
            />
          </div>

          {/* Right: Speed & Solver Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-stone-800 rounded-lg p-0.5 border border-stone-700 text-xs font-mono">
              {[0.5, 1, 2, 5].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                    playbackSpeed === spd
                      ? 'bg-teal-600 text-white font-bold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Integrator switcher */}
            <select
              value={method}
              onChange={(e) => handleConfigChange(e.target.value as 'euler' | 'rk4', dtVal)}
              className="bg-stone-800 text-xs font-mono text-stone-200 rounded-lg px-2.5 py-1.5 border border-stone-700 cursor-pointer"
            >
              <option value="rk4">算法: Runge-Kutta 4 (RK4)</option>
              <option value="euler">算法: Forward Euler</option>
            </select>
          </div>
        </div>
      </div>

      {/* Real-time State Gauges at current time point */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {model.stocks.map((stock, idx) => {
          const val = currentDataPoint ? currentDataPoint[stock.id] : stock.initialValue;
          const peak = simulationResult.summary.peakValues[stock.id]?.value;
          return (
            <div
              key={stock.id}
              className="bg-white rounded-xl border border-stone-200/90 p-3 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-mono text-stone-400 block uppercase truncate">
                  存量 · {stock.id}
                </span>
                <span className="text-xs font-bold text-stone-800 truncate block">
                  {stock.name}
                </span>
              </div>
              <div className="mt-2">
                <div className="text-lg font-mono font-bold text-teal-800">
                  {typeof val === 'number' ? val.toFixed(1) : '-'}
                  <span className="text-[10px] text-stone-400 font-sans ml-1">{stock.unit}</span>
                </div>
                {peak !== undefined && (
                  <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                    峰值: {peak.toFixed(1)}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {model.flows.slice(0, 3).map((flow) => {
          const val = currentDataPoint ? currentDataPoint[flow.id] : 0;
          return (
            <div
              key={flow.id}
              className="bg-white rounded-xl border border-stone-200/90 p-3 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-mono text-stone-400 block uppercase truncate">
                  流量 · {flow.id}
                </span>
                <span className="text-xs font-bold text-stone-800 truncate block">
                  {flow.name}
                </span>
              </div>
              <div className="mt-2">
                <div className="text-lg font-mono font-bold text-sky-800">
                  {typeof val === 'number' ? val.toFixed(1) : '-'}
                  <span className="text-[10px] text-stone-400 font-sans ml-1">{flow.unit}</span>
                </div>
                <div className="text-[10px] text-sky-600 font-mono mt-0.5">
                  瞬时速率
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* View Mode Switcher */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-700" />
          <h3 className="text-sm font-bold text-stone-800">系统动力学轨迹多重视角</h3>
        </div>

        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('timeseries')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              viewMode === 'timeseries' ? 'bg-stone-800 text-white font-medium' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            时间序列 (Time Series)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('phase')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              viewMode === 'phase' ? 'bg-stone-800 text-white font-medium' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            相空间 (Phase Portrait)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('both')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              viewMode === 'both' ? 'bg-stone-800 text-white font-medium' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            双重视角联排 (Both)
          </button>
        </div>
      </div>

      {/* Main Visualization Charts */}
      <div className="space-y-6">
        {(viewMode === 'timeseries' || viewMode === 'both') && (
          <div className="space-y-5">
            {/* Stocks Time-Series Chart */}
            <TimeSeriesChart
              data={simulationResult.data}
              series={stockSeries}
              currentTime={currentTime}
              timeUnit={model.config.timeUnit}
              onScrubTime={handleScrubTime}
              title="状态存量时间序列演化 (Stock Trajectories)"
              height={280}
            />

            {/* Flows Time-Series Chart */}
            <TimeSeriesChart
              data={simulationResult.data}
              series={flowSeries}
              currentTime={currentTime}
              timeUnit={model.config.timeUnit}
              onScrubTime={handleScrubTime}
              title="流量速率动态演化 (Flow & Rate Dynamics)"
              height={260}
            />
          </div>
        )}

        {(viewMode === 'phase' || viewMode === 'both') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <PhasePortraitChart
              data={simulationResult.data}
              xVar={{ id: xPhaseVar.id, name: xPhaseVar.name, unit: xPhaseVar.unit }}
              yVar={{ id: yPhaseVar.id, name: yPhaseVar.name, unit: yPhaseVar.unit }}
              currentTime={currentTime}
              height={280}
            />

            {/* Simulation Diagnostic Metric Card */}
            <div className="bg-white rounded-xl border border-stone-200/90 shadow-xs p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 pb-2 mb-3 border-b border-stone-100">
                  <TrendingUp className="w-4 h-4 text-teal-700" />
                  <h4 className="text-xs font-bold text-stone-800 uppercase tracking-tight">
                    动力学系统状态指标摘要
                  </h4>
                </div>

                <div className="space-y-2.5 text-xs text-stone-600">
                  <div className="flex items-center justify-between">
                    <span>系统振荡判定:</span>
                    <span
                      className={`font-semibold font-mono px-2 py-0.5 rounded ${
                        simulationResult.summary.hasOscillation
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {simulationResult.summary.hasOscillation
                        ? `检测到周期性振荡 (~${simulationResult.summary.oscillationPeriods} 个波峰)`
                        : '单调收敛 / 平滑阻尼'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>数值发散判定:</span>
                    <span
                      className={`font-semibold font-mono px-2 py-0.5 rounded ${
                        simulationResult.summary.isDiverging
                          ? 'bg-rose-100 text-rose-900'
                          : 'bg-stone-100 text-stone-800'
                      }`}
                    >
                      {simulationResult.summary.isDiverging ? '无界发散 (指数爆炸)' : '有界自稳'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>数值积分步长 dt:</span>
                    <span className="font-mono font-semibold text-stone-800">{dtVal} {model.config.timeUnit}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>离散迭代总步数:</span>
                    <span className="font-mono font-semibold text-stone-800">{totalSteps} 步</span>
                  </div>
                </div>
              </div>

              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 text-[11px] text-stone-600 mt-4 leading-relaxed font-sans">
                <strong>动力学小贴士:</strong> 相空间闭合环路代表系统具有稳定的极限环（Limit Cycle）；逐渐向中心螺旋收缩代表焦点汇（Stable Focus）；向外螺旋扩散代表失稳离心轨道。
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
