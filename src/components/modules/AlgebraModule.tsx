/**
 * Module 1: 系统动力学结构代数与微分建模
 * Formal algebraic differential formulation, state space representations, and stability conditions.
 */

import React, { useState } from 'react';
import { Sigma, ArrowRight, CheckCircle2, Info, Compass, Layers, Calculator } from 'lucide-react';
import { SystemModel } from '../../types/system-dynamics';
import { KatexMath, MathText } from '../common/KatexMath';

interface AlgebraModuleProps {
  model: SystemModel;
}

export const AlgebraModule: React.FC<AlgebraModuleProps> = ({ model }) => {
  const [selectedStockId, setSelectedStockId] = useState<string>(model.stocks[0]?.id || '');

  const activeStock = model.stocks.find((s) => s.id === selectedStockId) || model.stocks[0];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-stone-900 text-stone-100 rounded-2xl p-6 border border-stone-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-500/20 text-teal-300 text-xs font-mono mb-2 border border-teal-500/30">
              <Sigma className="w-3.5 h-3.5" />
              <span>结构代数与微分方程组 (State-Space Differential Equations)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
              {model.title} · 形式化微分结构
            </h2>
            <div className="text-stone-300 text-sm mt-1 max-w-3xl leading-relaxed flex flex-wrap items-center gap-1.5">
              <span>任何复杂的系统动力学模型，其本质均等价于一组非线性一阶常微分方程自治系统：</span>
              <span className="text-teal-300 font-mono bg-stone-800/90 px-2 py-0.5 rounded border border-stone-700/80 inline-block">
                <KatexMath math="\frac{dS_i}{dt} = \sum_j \text{Inflow}_{i,j}(t) - \sum_k \text{Outflow}_{i,k}(t)" />
              </span>
              <span>。系统的记忆、相移与非线性突变均源于状态变量对速率的积分累加。</span>
            </div>
          </div>

          <div className="bg-stone-800/90 rounded-xl p-4 border border-stone-700 font-mono text-xs text-stone-300 space-y-1.5 min-w-[220px]">
            <div className="text-stone-400 uppercase text-[10px] tracking-wider font-semibold border-b border-stone-700 pb-1">
              状态空间维度
            </div>
            <div className="flex justify-between items-center">
              <span>状态存量维度 <KatexMath math="(\dim \mathbf{x}):" /></span>
              <span className="text-teal-400 font-bold">{model.stocks.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>流量方程数量 <KatexMath math="(\dim \mathbf{r}):" /></span>
              <span className="text-sky-400 font-bold">{model.flows.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>参数自由度 <KatexMath math="(\dim \mathbf{p}):" /></span>
              <span className="text-amber-400 font-bold">{model.parameters.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Equations + State Vectors + Stability Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Differential Equations & Stock Inspector */}
        <div className="lg:col-span-2 space-y-6">
          {/* Differential Equations Card */}
          <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-teal-700" />
                <h3 className="text-sm font-bold text-stone-800 tracking-tight">
                  解析微分方程组 (ODEs Formulation)
                </h3>
              </div>
              <span className="text-xs text-stone-400 font-mono">KaTeX 数学排版</span>
            </div>

            <div className="space-y-3 text-xs">
              {model.differentialEqText.map((eq, idx) => (
                <div
                  key={idx}
                  className="bg-stone-50 hover:bg-teal-50/40 transition-colors p-3.5 rounded-lg border border-stone-200/80 flex items-center justify-between gap-3 text-stone-800 shadow-2xs"
                >
                  <div className="text-stone-400 text-[11px] font-sans shrink-0 font-medium">方程 ({idx + 1}):</div>
                  <div className="text-stone-900 font-medium tracking-wide overflow-x-auto py-1 text-sm sm:text-base flex-1">
                    <KatexMath math={eq} displayMode={false} />
                  </div>
                  <span className="text-[10px] text-teal-700 bg-teal-100/70 px-2 py-0.5 rounded shrink-0 font-sans font-medium">
                    {idx < model.stocks.length ? '状态导数' : '关联辅助/速率'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Stock Derivative Inspector */}
          <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-teal-700" />
                <h3 className="text-sm font-bold text-stone-800 tracking-tight">
                  存量净流动代数剖析 (Net Inflow/Outflow Balance)
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-stone-500">选择存量:</span>
                <select
                  value={selectedStockId}
                  onChange={(e) => setSelectedStockId(e.target.value)}
                  className="text-xs bg-stone-50 border border-stone-300 rounded px-2 py-1 font-medium text-stone-800"
                >
                  {model.stocks.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {activeStock && (
              <div className="space-y-4">
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-700">
                      存量定义: {activeStock.name}
                    </span>
                    <span className="text-xs font-mono text-stone-500">
                      初值 <KatexMath math={`S(0) = ${activeStock.initialValue}`} /> [{activeStock.unit}]
                    </span>
                  </div>

                  <div className="p-3.5 bg-white rounded-lg border border-stone-200 text-stone-800 shadow-2xs overflow-x-auto text-sm sm:text-base flex items-center justify-center">
                    <KatexMath
                      math={`\\frac{d [\\text{${activeStock.id}}]}{dt} = \\left( ${
                        activeStock.inflows.length > 0
                          ? activeStock.inflows.map((f) => `\\text{${f}}`).join(' + ')
                          : '0'
                      } \\right) - \\left( ${
                        activeStock.outflows.length > 0
                          ? activeStock.outflows.map((f) => `\\text{${f}}`).join(' + ')
                          : '0'
                      } \\right)`}
                      displayMode={true}
                    />
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed font-sans">
                    {activeStock.description || '核心状态变量，其瞬时增量受流入与流出净差额控制。'}
                  </p>
                </div>

                {/* Inflows detail */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="border border-sky-200 bg-sky-50/50 rounded-lg p-3">
                    <div className="font-semibold text-sky-900 mb-2 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-sky-500" />
                      <span>流入量 (Inflows)</span>
                    </div>
                    {activeStock.inflows.length === 0 ? (
                      <div className="text-stone-400 italic">无外部或内部流入</div>
                    ) : (
                      activeStock.inflows.map((fid) => {
                        const flow = model.flows.find((f) => f.id === fid);
                        return (
                          <div key={fid} className="bg-white p-2 rounded border border-sky-100 mb-1.5 font-mono">
                            <div className="font-medium text-stone-800">{flow?.name || fid}</div>
                            <div className="text-[11px] text-sky-800 truncate mt-0.5">{flow?.equation}</div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="border border-rose-200 bg-rose-50/50 rounded-lg p-3">
                    <div className="font-semibold text-rose-900 mb-2 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span>流出量 (Outflows)</span>
                    </div>
                    {activeStock.outflows.length === 0 ? (
                      <div className="text-stone-400 italic">无耗散或下游流出</div>
                    ) : (
                      activeStock.outflows.map((fid) => {
                        const flow = model.flows.find((f) => f.id === fid);
                        return (
                          <div key={fid} className="bg-white p-2 rounded border border-rose-100 mb-1.5 font-mono">
                            <div className="font-medium text-stone-800">{flow?.name || fid}</div>
                            <div className="text-[11px] text-rose-800 truncate mt-0.5">{flow?.equation}</div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: State Vector & Jacobian Stability Analysis */}
        <div className="space-y-6">
          {/* State Vector representation */}
          <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
              <Layers className="w-4 h-4 text-teal-700" />
              <h3 className="text-sm font-bold text-stone-800">状态空间向量结构</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[11px] uppercase font-mono text-stone-600 block mb-1">
                  状态向量 <KatexMath math="\mathbf{x}(t)" /> [Stocks]
                </span>
                <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200 text-stone-800 overflow-x-auto">
                  <KatexMath
                    math={`\\mathbf{x}(t) = \\left[ ${model.algebraicStructure.stateVector
                      .map((s) => `\\text{${s}}`)
                      .join(', ')} \\right]^T`}
                  />
                </div>
              </div>

              <div>
                <span className="text-[11px] uppercase font-mono text-stone-600 block mb-1">
                  速率向量 <KatexMath math="\mathbf{r}(\mathbf{x}, \mathbf{p})" /> [Flows]
                </span>
                <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200 text-sky-800 overflow-x-auto">
                  <KatexMath
                    math={`\\mathbf{r}(t) = \\left[ ${model.algebraicStructure.rateVector
                      .map((r) => `\\text{${r}}`)
                      .join(', ')} \\right]^T`}
                  />
                </div>
              </div>

              <div>
                <span className="text-[11px] uppercase font-mono text-stone-600 block mb-1">
                  参数向量 <KatexMath math="\mathbf{p}" /> [Parameters]
                </span>
                <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200 text-stone-700 overflow-x-auto">
                  <KatexMath
                    math={`\\mathbf{p} = \\left[ ${model.algebraicStructure.parameterVector
                      .map((p) => `\\text{${p}}`)
                      .join(', ')} \\right]^T`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Jacobian & Stability Condition */}
          <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
              <Info className="w-4 h-4 text-teal-700" />
              <h3 className="text-sm font-bold text-stone-800">雅可比矩阵与局部稳定性</h3>
            </div>

            <div className="text-xs text-stone-600 leading-relaxed flex flex-wrap items-center gap-1.5">
              <span>系统的非线性反馈回路在状态空间的局部几何性质由雅可比矩阵</span>
              <span className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-900 border border-stone-200 inline-block font-mono">
                <KatexMath math="J_{ij} = \frac{\partial (dS_i/dt)}{\partial S_j}" />
              </span>
              <span>决定。</span>
            </div>

            <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 text-xs text-stone-700 leading-relaxed font-sans">
              <div className="font-semibold text-stone-900 mb-1">动力学耦合剖析:</div>
              <MathText text={model.algebraicStructure.feedbackMatrixDesc} />
            </div>

            <div className="bg-teal-50/60 p-3 rounded-lg border border-teal-200/80 text-xs text-teal-900 space-y-1.5">
              <div className="font-semibold text-teal-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
                <span>特征值判据法则:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-teal-800 pl-1">
                <li>
                  所有特征值实部 <KatexMath math="\text{Re}(\lambda) < 0" />: 局部渐进稳定汇（Stable Attractor）
                </li>
                <li>
                  存在实部 <KatexMath math="\text{Re}(\lambda) > 0" />: 系统指数级发散或逃逸（Unstable Source / Saddle）
                </li>
                <li>
                  含非零虚部 <KatexMath math="\text{Im}(\lambda) \neq 0" />: 伴随周期性相位振荡（Spiral Focus / Limit Cycle）
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
