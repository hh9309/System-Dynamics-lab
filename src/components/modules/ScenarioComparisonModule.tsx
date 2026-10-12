/**
 * Module 8: 情景对比分析模块 (Multi-Scenario Policy Comparison)
 * Side-by-side policy intervention comparison, multi-curve overlays, and policy trade-off tables.
 */

import React, { useState, useMemo } from 'react';
import {
  GitCompare,
  Sliders,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Sparkles,
  BarChart3,
  Layers,
} from 'lucide-react';
import {
  SystemModel,
  PolicyScenario,
  SimulationResult,
} from '../../types/system-dynamics';
import { SimulationEngine } from '../../engine/simulator';
import { TimeSeriesChart } from '../charts/TimeSeriesChart';

interface ScenarioComparisonModuleProps {
  model: SystemModel;
}

export const ScenarioComparisonModule: React.FC<ScenarioComparisonModuleProps> = ({ model }) => {
  const [selectedStockKey, setSelectedStockKey] = useState<string>(model.stocks[0]?.id || '');

  // Run simulation for all preset scenarios
  const scenarioResults = useMemo(() => {
    return SimulationEngine.runScenarios(model, model.defaultScenarios);
  }, [model]);

  // Combine scenario data for the selected variable
  const targetStock = model.stocks.find((s) => s.id === selectedStockKey) || model.stocks[0];

  const combinedData = useMemo(() => {
    const baseRes = scenarioResults[model.defaultScenarios[0]?.id];
    if (!baseRes) return [];

    const timeline = baseRes.timeline;
    return timeline.map((t, idx) => {
      const point: any = { time: t };
      model.defaultScenarios.forEach((sc) => {
        const res = scenarioResults[sc.id];
        if (res && res.data[idx]) {
          point[`sc_${sc.id}`] = res.data[idx][selectedStockKey];
        }
      });
      return point;
    });
  }, [scenarioResults, model.defaultScenarios, selectedStockKey]);

  // Comparative series for chart
  const comparativeSeries = model.defaultScenarios.map((sc) => ({
    id: `sc_${sc.id}`,
    name: sc.name,
    unit: targetStock?.unit || '',
    color: sc.color,
  }));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-teal-700" />
            <h2 className="text-base font-bold text-stone-800 tracking-tight">
              多情景政策干预对比 (Policy Scenarios Comparison)
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl leading-relaxed">
            将不同管理政策、参数扰动与结构干预置于同一系统环境，观察系统长期演化轨迹分异，评估政策鲁棒性与潜在反弹阻力。
          </p>
        </div>

        {/* Variable selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500 font-medium">比对观测存量:</span>
          <select
            value={selectedStockKey}
            onChange={(e) => setSelectedStockKey(e.target.value)}
            className="text-xs bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 font-bold text-stone-800 focus:ring-1 focus:ring-teal-500 cursor-pointer"
          >
            {model.stocks.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparative Multi-Curve Chart */}
      <TimeSeriesChart
        data={combinedData}
        series={comparativeSeries}
        timeUnit={model.config.timeUnit}
        title={`情景轨线叠加对比 · ${targetStock?.name || ''}`}
        height={320}
      />

      {/* Scenario Descriptions & Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {model.defaultScenarios.map((sc) => {
          const res = scenarioResults[sc.id];
          const finalVal = res ? res.summary.finalValues[selectedStockKey] : 0;
          const peakVal = res ? res.summary.peakValues[selectedStockKey]?.value : 0;
          const peakTime = res ? res.summary.peakValues[selectedStockKey]?.time : 0;
          const hasOsc = res ? res.summary.hasOscillation : false;

          return (
            <div
              key={sc.id}
              className="bg-white rounded-xl border border-stone-200/90 shadow-xs p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: sc.color }} />
                    <h3 className="text-sm font-bold text-stone-900">{sc.name}</h3>
                  </div>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed mb-4">
                  {sc.description}
                </p>

                {/* Overrides Table */}
                <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200 mb-4 text-[11px] font-mono space-y-1">
                  <span className="text-[10px] uppercase font-sans text-stone-500 font-semibold block">
                    参数干预覆盖:
                  </span>
                  {Object.entries(sc.parameterOverrides).map(([pk, pv]) => {
                    const paramDef = model.parameters.find((p) => p.id === pk);
                    return (
                      <div key={pk} className="flex justify-between text-stone-700">
                        <span>{paramDef?.name || pk}:</span>
                        <strong className="text-teal-800">{pv}</strong>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Trajectory Outcome Metrics */}
              <div className="border-t border-stone-100 pt-3 space-y-1.5 text-xs text-stone-600 font-mono">
                <div className="flex justify-between">
                  <span className="font-sans text-stone-500">终态水平 (t=end):</span>
                  <strong className="text-stone-900">
                    {typeof finalVal === 'number' ? finalVal.toFixed(1) : '-'} {targetStock?.unit}
                  </strong>
                </div>

                <div className="flex justify-between">
                  <span className="font-sans text-stone-500">峰值水位:</span>
                  <strong className="text-stone-900">
                    {typeof peakVal === 'number' ? peakVal.toFixed(1) : '-'} (t={peakTime.toFixed(1)})
                  </strong>
                </div>

                <div className="flex justify-between">
                  <span className="font-sans text-stone-500">系统振荡风险:</span>
                  <span
                    className={`font-semibold ${
                      hasOsc ? 'text-amber-700' : 'text-emerald-700'
                    }`}
                  >
                    {hasOsc ? '⚠️ 存在明显波动' : '✓ 稳定阻尼收敛'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
