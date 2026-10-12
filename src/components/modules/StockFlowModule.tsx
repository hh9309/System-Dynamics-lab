/**
 * Module 3: 存量-流量 (Stock & Flow) 模型构建与方程配置
 * Configures Stocks (Levels), Flows (Rates), Auxiliaries, Parameters, Initial Values, and Delays.
 */

import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Box,
  Droplets,
  CircleDot,
  Gauge,
  Edit3,
  Clock,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Save,
} from 'lucide-react';
import {
  SystemModel,
  StockVar,
  FlowVar,
  AuxiliaryVar,
  ParameterVar,
} from '../../types/system-dynamics';
import { KatexMath, MathText } from '../common/KatexMath';

interface StockFlowModuleProps {
  model: SystemModel;
  onUpdateStockInitial?: (stockId: string, val: number) => void;
  onUpdateFlowEquation?: (flowId: string, eq: string) => void;
  onUpdateParamValue?: (paramId: string, val: number) => void;
}

export const StockFlowModule: React.FC<StockFlowModuleProps> = ({
  model,
  onUpdateStockInitial,
  onUpdateFlowEquation,
  onUpdateParamValue,
}) => {
  const [activeTab, setActiveTab] = useState<'stocks' | 'flows' | 'aux' | 'params'>('stocks');
  const [editingFlowId, setEditingFlowId] = useState<string | null>(null);
  const [flowEqDraft, setFlowEqDraft] = useState('');

  return (
    <div className="space-y-6">
      {/* Top Banner and Navigation */}
      <div className="bg-white rounded-xl border border-stone-200/90 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-teal-700" />
            <h2 className="text-base font-bold text-stone-800 tracking-tight">
              存量-流量图 (SFD) 与微分方程配置
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 font-mono border border-teal-200 font-medium">
              {model.stocks.length} 存量 / {model.flows.length} 流量 / {model.parameters.length} 参数
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5 flex flex-wrap items-center gap-1">
            <span>配置存量初始条件</span>
            <span className="font-mono text-stone-700 bg-stone-100 px-1 rounded"><KatexMath math="S(0)" /></span>
            <span>、流量速率微分方程</span>
            <span className="font-mono text-stone-700 bg-stone-100 px-1 rounded"><KatexMath math="\frac{dS}{dt}" /></span>
            <span>、非线性辅助变量与物理/信息延迟管道</span>
          </p>
        </div>

        {/* Tab pills */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg border border-stone-200">
          <button
            type="button"
            onClick={() => setActiveTab('stocks')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'stocks'
                ? 'bg-white text-teal-800 shadow-xs border border-stone-200 font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>存量 (Stocks)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('flows')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'flows'
                ? 'bg-white text-teal-800 shadow-xs border border-stone-200 font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>流量方程 (Flows)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('aux')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'aux'
                ? 'bg-white text-teal-800 shadow-xs border border-stone-200 font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <CircleDot className="w-3.5 h-3.5" />
            <span>辅助变量 (Aux)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('params')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'params'
                ? 'bg-white text-teal-800 shadow-xs border border-stone-200 font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>常量参数 (Params)</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Stocks (Levels) */}
      {activeTab === 'stocks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {model.stocks.map((stock) => (
            <div
              key={stock.id}
              className="bg-white rounded-xl border-2 border-teal-700/60 shadow-xs p-4 flex flex-col justify-between relative overflow-hidden"
            >
              {/* Decorative top level badge */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                    <Box className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">{stock.name}</h3>
                    <span className="text-[10px] font-mono text-stone-500 uppercase">
                      ID: {stock.id}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 font-semibold">
                  [{stock.unit}]
                </span>
              </div>

              {/* Initial Value Input */}
              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 mb-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-600 font-medium flex items-center gap-1">
                    <span>初始状态积聚值</span>
                    <span className="font-mono text-stone-800"><KatexMath math="S(0)" />:</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      defaultValue={stock.initialValue}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && onUpdateStockInitial) {
                          onUpdateStockInitial(stock.id, val);
                        }
                      }}
                      className="w-24 text-right px-2 py-1 text-xs font-mono font-bold bg-white border border-stone-300 rounded focus:ring-1 focus:ring-teal-500 text-teal-900"
                    />
                    <span className="text-[11px] text-stone-500">{stock.unit}</span>
                  </div>
                </div>

                <div className="text-[11px] text-stone-500 font-mono flex items-center justify-between pt-1 border-t border-stone-200">
                  <span>非负边界保护:</span>
                  <span className="text-teal-700 font-semibold flex items-center gap-1">
                    {stock.nonNegative ? (
                      <>
                        <span>开启 (</span>
                        <KatexMath math="S \ge 0" />
                        <span>)</span>
                      </>
                    ) : (
                      '关闭 (允许负值)'
                    )}
                  </span>
                </div>
              </div>

              {/* Inflow & Outflow Links */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-sky-700 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    流入通道 (Inflows):
                  </span>
                  <span className="font-mono text-stone-700">
                    {stock.inflows.length > 0 ? stock.inflows.join(', ') : '无 (封闭源)'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-rose-700 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    流出通道 (Outflows):
                  </span>
                  <span className="font-mono text-stone-700">
                    {stock.outflows.length > 0 ? stock.outflows.join(', ') : '无 (封闭汇)'}
                  </span>
                </div>
              </div>

              {stock.description && (
                <p className="text-[11px] text-stone-500 mt-3 pt-2 border-t border-stone-100 italic leading-relaxed">
                  {stock.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Flows (Rates) */}
      {activeTab === 'flows' && (
        <div className="space-y-4">
          {model.flows.map((flow) => {
            const isEditing = editingFlowId === flow.id;
            return (
              <div
                key={flow.id}
                className="bg-white rounded-xl border border-stone-200/90 shadow-xs p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center">
                      <Droplets className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-sm font-bold text-stone-800">{flow.name}</h3>
                    <span className="text-xs font-mono text-stone-400">({flow.id})</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">
                      [{flow.unit}]
                    </span>
                  </div>

                  {flow.description && (
                    <p className="text-xs text-stone-500">{flow.description}</p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-stone-600 font-mono pt-1">
                    <span>
                      从: <strong className="text-stone-800">{flow.fromStockId || '☁️ 外部源云朵'}</strong>
                    </span>
                    <span>→</span>
                    <span>
                      至: <strong className="text-stone-800">{flow.toStockId || '☁️ 外部汇云朵'}</strong>
                    </span>
                  </div>
                </div>

                {/* Equation editor or display */}
                <div className="flex-1 md:max-w-md">
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={flowEqDraft}
                          onChange={(e) => setFlowEqDraft(e.target.value)}
                          className="w-full text-xs font-mono px-3 py-1.5 border border-teal-500 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (onUpdateFlowEquation && flowEqDraft.trim()) {
                              onUpdateFlowEquation(flow.id, flowEqDraft.trim());
                            }
                            setEditingFlowId(null);
                          }}
                          className="p-1.5 rounded-lg bg-teal-700 text-white hover:bg-teal-800 cursor-pointer"
                          title="保存方程"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-[10px] text-stone-400 flex items-center gap-1.5">
                        <span>支持: step(t,t0,h), pulse, min, max, exp, log, ^</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                      <code className="text-xs font-mono text-stone-800 font-semibold truncate">
                        {flow.equation}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingFlowId(flow.id);
                          setFlowEqDraft(flow.equation);
                        }}
                        className="text-stone-400 hover:text-stone-700 cursor-pointer p-1"
                        title="编辑速率方程"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Auxiliaries */}
      {activeTab === 'aux' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {model.auxiliaries.map((aux) => (
            <div
              key={aux.id}
              className="bg-white rounded-xl border border-stone-200/90 shadow-xs p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CircleDot className="w-4 h-4 text-amber-700" />
                    <h3 className="text-sm font-bold text-stone-800">{aux.name}</h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    [{aux.unit}]
                  </span>
                </div>
                {aux.description && (
                  <p className="text-xs text-stone-500 mb-2">{aux.description}</p>
                )}
              </div>

              <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200 font-mono text-xs text-stone-800 mt-2">
                <span className="text-stone-400">{aux.id} = </span>
                <span className="font-semibold text-stone-900">{aux.equation}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Parameters & Live Sliders */}
      {activeTab === 'params' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {model.parameters.map((param) => (
            <div
              key={param.id}
              className="bg-white rounded-xl border border-stone-200/90 shadow-xs p-4 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xs font-bold text-stone-800">{param.name}</h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                    [{param.unit}]
                  </span>
                </div>
                {param.description && (
                  <p className="text-[11px] text-stone-500 leading-snug">{param.description}</p>
                )}
              </div>

              <div className="space-y-1.5 pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-400 font-mono text-[11px]">{param.id}</span>
                  <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {param.value}
                  </span>
                </div>

                <input
                  type="range"
                  min={param.min}
                  max={param.max}
                  step={param.step}
                  value={param.value}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && onUpdateParamValue) {
                      onUpdateParamValue(param.id, val);
                    }
                  }}
                  className="w-full accent-teal-600 cursor-pointer"
                />

                <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                  <span>min: {param.min}</span>
                  <span>max: {param.max}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
