/**
 * Module 5: 六大系统动力学实战案例库 (Case Studies Library)
 * Curated case studies covering ecology, supply chains, urban dynamics, epidemiology, software engineering, and carbon cycle.
 */

import React from 'react';
import {
  Library,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Layers,
  Box,
  Droplets,
  Share2,
} from 'lucide-react';
import { SystemModel } from '../../types/system-dynamics';
import { MathText } from '../common/KatexMath';

interface CaseLibraryModuleProps {
  models: SystemModel[];
  activeModel: SystemModel;
  onSelectModel: (model: SystemModel) => void;
  onNavigateToSimulation: () => void;
}

export const CaseLibraryModule: React.FC<CaseLibraryModuleProps> = ({
  models,
  activeModel,
  onSelectModel,
  onNavigateToSimulation,
}) => {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Library className="w-4 h-4 text-teal-700" />
              <h2 className="text-base font-bold text-stone-800 tracking-tight">
                六大系统动力学实战经典案例库
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-1 max-w-2xl leading-relaxed">
              涵盖生态承载力、工业供应链牛鞭效应、城市超调、传染病SIR、布鲁克斯赶工陷阱及宏观碳中和。每一案例均内置全套微分方程组、因果回路拓扑与多情景预设。
            </p>
          </div>
          <span className="text-xs text-teal-800 font-mono bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 font-semibold shrink-0">
            已载入: {activeModel.title}
          </span>
        </div>
      </div>

      {/* Cases Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {models.map((caseItem) => {
          const isActive = caseItem.id === activeModel.id;

          return (
            <div
              key={caseItem.id}
              className={`rounded-2xl border transition-all flex flex-col justify-between p-5 relative ${
                isActive
                  ? 'bg-white border-teal-600 shadow-md ring-2 ring-teal-500/20'
                  : 'bg-white border-stone-200/90 hover:border-stone-300 shadow-2xs hover:shadow-xs'
              }`}
            >
              <div>
                {/* Header Tag */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-600 font-semibold border border-stone-200">
                    {caseItem.category}
                  </span>
                  {isActive && (
                    <span className="flex items-center gap-1 text-[11px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                      <CheckCircle className="w-3 h-3" />
                      <span>正在实验</span>
                    </span>
                  )}
                </div>

                {/* Case Title */}
                <h3 className="text-sm font-bold text-stone-900 tracking-tight mb-2">
                  {caseItem.title}
                </h3>

                {/* Short Desc */}
                <p className="text-xs text-stone-600 leading-relaxed mb-4">
                  {caseItem.shortDesc}
                </p>

                {/* Key Insights Slices */}
                <div className="space-y-1.5 mb-4 bg-stone-50/80 p-3 rounded-xl border border-stone-100 text-[11px] text-stone-700">
                  <span className="font-semibold text-stone-800 block text-[10px] uppercase tracking-wider font-mono">
                    核心机制洞见:
                  </span>
                  {caseItem.keyInsights.slice(0, 2).map((insight, idx) => (
                    <div key={idx} className="leading-snug line-clamp-2">
                      <MathText text={insight} />
                    </div>
                  ))}
                </div>

                {/* Topology quick badges */}
                <div className="flex items-center gap-3 text-[11px] text-stone-500 font-mono mb-4 pt-2 border-t border-stone-100">
                  <span className="flex items-center gap-1">
                    <Box className="w-3 h-3 text-teal-600" />
                    <span>{caseItem.stocks.length} 存量</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-sky-600" />
                    <span>{caseItem.flows.length} 流量</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Share2 className="w-3 h-3 text-amber-600" />
                    <span>{caseItem.cldLoops.length} 回路</span>
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onSelectModel(caseItem);
                    onNavigateToSimulation();
                  }}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-teal-700 text-white hover:bg-teal-800 shadow-xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                  }`}
                >
                  <span>{isActive ? '进入动态仿真演播' : '载入本案例到实验室'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
