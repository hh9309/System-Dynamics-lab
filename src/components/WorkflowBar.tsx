/**
 * Workflow Bar & Module Tabs Navigation
 */

import React from 'react';
import {
  Share2,
  Workflow,
  SlidersHorizontal,
  PlayCircle,
  GitCompare,
  Code2,
  Library,
  BookOpen,
  Sigma,
  FileText,
} from 'lucide-react';

export type MainTabType =
  | 'cld' // 2. 因果回路
  | 'stockflow' // 3. 存量流量
  | 'simulation' // 4. 动态仿真
  | 'scenarios' // 8. 情景对比
  | 'algebra' // 1. 结构代数
  | 'cases' // 5. 六大案例
  | 'python' // 6. Python引擎
  | 'report' // 9. 报告导出
  | 'knowledge'; // 10. 知识切片

interface WorkflowBarProps {
  activeTab: MainTabType;
  onSelectTab: (tab: MainTabType) => void;
}

export const WorkflowBar: React.FC<WorkflowBarProps> = ({ activeTab, onSelectTab }) => {
  const workflowSteps = [
    { id: 'cld', label: '1. 结构绘制', subtitle: '因果回路 CLD', icon: Share2 },
    { id: 'stockflow', label: '2. 方程设定', subtitle: '存量流量 SFD', icon: SlidersHorizontal },
    { id: 'simulation', label: '3. 动态仿真', subtitle: '数值演播与相空间', icon: PlayCircle },
    { id: 'scenarios', label: '4. 情景对比', subtitle: '政策干预对照', icon: GitCompare },
  ];

  const supplementaryModules = [
    { id: 'algebra', label: '结构代数', icon: Sigma },
    { id: 'cases', label: '六大案例库', icon: Library },
    { id: 'python', label: 'Python / SciPy', icon: Code2 },
    { id: 'report', label: '分析报告', icon: FileText },
    { id: 'knowledge', label: '机制知识', icon: BookOpen },
  ];

  return (
    <div className="bg-white border-b border-stone-200/80 shadow-2xs sticky top-16 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 py-2">
          {/* Main 4-step canonical workflow pipeline */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-[11px] font-mono text-stone-600 uppercase tracking-wider font-semibold mr-1 shrink-0">
              全流程导引:
            </span>
            {workflowSteps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = activeTab === step.id;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => onSelectTab(step.id as MainTabType)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer border ${
                    isActive
                      ? 'bg-teal-700 text-white border-teal-800 shadow-sm'
                      : 'bg-stone-50 text-stone-700 hover:bg-stone-100 hover:text-stone-900 border-stone-200'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-200' : 'text-stone-500'}`} />
                  <div className="text-left leading-tight">
                    <div>{step.label}</div>
                    <div className={`text-[10px] hidden sm:block ${isActive ? 'text-teal-100' : 'text-stone-600'}`}>
                      {step.subtitle}
                    </div>
                  </div>
                  {idx < workflowSteps.length - 1 && (
                    <span className="text-stone-300 ml-1 hidden lg:inline">→</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Supplementary core modules */}
          <div className="flex items-center gap-1 overflow-x-auto pt-1 md:pt-0 border-t md:border-t-0 border-stone-100">
            {supplementaryModules.map((m) => {
              const Icon = m.icon;
              const isActive = activeTab === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onSelectTab(m.id as MainTabType)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-stone-800 text-stone-100 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
