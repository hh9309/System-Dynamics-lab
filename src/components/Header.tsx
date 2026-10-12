/**
 * Laboratory Header Component
 */

import React from 'react';
import {
  Activity,
  Bot,
  BookOpen,
  Share2,
  Play,
  RotateCcw,
  Sparkles,
  Download,
} from 'lucide-react';
import { SystemModel, PolicyScenario } from '../types/system-dynamics';

interface HeaderProps {
  models: SystemModel[];
  activeModel: SystemModel;
  onSelectModel: (model: SystemModel) => void;
  activeScenarioId: string;
  onSelectScenario: (scenarioId: string) => void;
  onOpenAiModal: () => void;
  onOpenReportModal: () => void;
  onSelectTab: (tabId: string) => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({
  models,
  activeModel,
  onSelectModel,
  activeScenarioId,
  onSelectScenario,
  onOpenAiModal,
  onOpenReportModal,
  onSelectTab,
  activeTab,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-stone-900/95 backdrop-blur-md text-stone-100 border-b border-stone-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-600/30 border border-teal-500/50 flex items-center justify-center text-teal-400 shadow-inner">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif font-bold text-base sm:text-lg tracking-tight text-stone-100">
                系统动力学实验室
              </h1>
              <span className="hidden sm:inline-block text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-stone-800 text-teal-300 border border-stone-700">
                System Dynamics Lab
              </span>
            </div>
            <p className="text-[11px] text-stone-400 hidden md:block">
              因果反馈回路 · 存量流量积分 · 非线性微分建模 · 时间轴演播
            </p>
          </div>
        </div>

        {/* Model Selection Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <label className="text-[10px] text-stone-400 block -mt-1 mb-0.5 uppercase tracking-wider font-mono">
              案例选择
            </label>
            <select
              value={activeModel.id}
              onChange={(e) => {
                const found = models.find((m) => m.id === e.target.value);
                if (found) onSelectModel(found);
              }}
              className="bg-stone-800 text-stone-100 text-xs rounded-lg px-2.5 py-1.5 border border-stone-700 hover:border-teal-500 focus:outline-hidden focus:ring-1 focus:ring-teal-500 transition-colors cursor-pointer pr-7 font-medium"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>

          {/* Scenario Selector */}
          <div className="relative hidden lg:block">
            <label className="text-[10px] text-stone-400 block -mt-1 mb-0.5 uppercase tracking-wider font-mono">
              政策情景
            </label>
            <select
              value={activeScenarioId}
              onChange={(e) => onSelectScenario(e.target.value)}
              className="bg-stone-800 text-stone-100 text-xs rounded-lg px-2.5 py-1.5 border border-stone-700 hover:border-teal-500 focus:outline-hidden focus:ring-1 focus:ring-teal-500 transition-colors cursor-pointer pr-7 font-medium"
            >
              {activeModel.defaultScenarios.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {/* AI Diagnosis Floating Trigger */}
          <button
            type="button"
            onClick={onOpenAiModal}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/40 hover:bg-teal-500/30 transition-all cursor-pointer font-medium shadow-xs hover:shadow-teal-900/30"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>AI 随诊</span>
          </button>

          {/* Knowledge Slices Tab shortcut */}
          <button
            type="button"
            onClick={() => onSelectTab('knowledge')}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
              activeTab === 'knowledge'
                ? 'bg-stone-700 text-amber-300 border-amber-400/40'
                : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-750 hover:text-stone-100'
            }`}
            title="查看系统动力学机制知识"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">机制知识</span>
          </button>

          {/* Export Report Trigger */}
          <button
            type="button"
            onClick={onOpenReportModal}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-stone-800 text-stone-300 border border-stone-700 hover:bg-stone-700 hover:text-stone-100 transition-all cursor-pointer"
            title="生成并导出分析报告"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">报告导出</span>
          </button>
        </div>
      </div>
    </header>
  );
};
