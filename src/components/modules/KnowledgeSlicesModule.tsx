/**
 * Module 10: 系统动力学机制与知识导引 (多用切片 Slices)
 * Four foundational knowledge slices, bathtub interactive probe, and conceptual quizzes.
 */

import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Droplets,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Sigma,
} from 'lucide-react';
import { KNOWLEDGE_SLICES, KnowledgeSlice } from '../../constants/knowledge-slices';
import { KatexMath, MathText } from '../common/KatexMath';

export const KnowledgeSlicesModule: React.FC = () => {
  const [activeSliceIndex, setActiveSliceIndex] = useState<number>(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number | null>>({});

  // Interactive Bathtub Probe state (Mini Slice Experiment)
  const [faucetInflow, setFaucetInflow] = useState<number>(50);
  const [drainOutflow, setDrainOutflow] = useState<number>(30);

  const activeSlice: KnowledgeSlice = KNOWLEDGE_SLICES[activeSliceIndex];

  const handleSelectOption = (sliceId: string, optIdx: number) => {
    setQuizAnswers((prev) => ({
      ...prev,
      [sliceId]: optIdx,
    }));
  };

  const netRate = faucetInflow - drainOutflow;

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-teal-700" />
            <h2 className="text-base font-bold text-stone-800 tracking-tight">
              机制知识
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl leading-relaxed">
            结构决定行为（Structure drives Behavior）。精选系统思考先驱 Donella Meadows 与 Jay Forrester 的核心思维切片，破除线性直觉盲区。
          </p>
        </div>

        {/* Slice Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {KNOWLEDGE_SLICES.map((slice, idx) => (
            <button
              key={slice.id}
              type="button"
              onClick={() => setActiveSliceIndex(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 border ${
                activeSliceIndex === idx
                  ? 'bg-stone-900 text-teal-300 border-stone-800 shadow-sm'
                  : 'bg-stone-50 text-stone-600 hover:bg-stone-100 hover:text-stone-900 border-stone-200'
              }`}
            >
              <span>{slice.tag}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Slice Detailed Presentation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Slice Content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Main Card */}
          <div className="bg-white rounded-2xl border border-stone-200/90 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-teal-700 uppercase tracking-wider block">
                  【{activeSlice.tag}】
                </span>
                <h3 className="text-lg font-bold text-stone-900 font-serif tracking-tight mt-0.5">
                  <MathText text={activeSlice.title} />
                </h3>
              </div>
              <span className="text-xs text-stone-500 font-mono hidden sm:inline">
                <MathText text={activeSlice.subtitle} />
              </span>
            </div>

            {/* Concept Summary Callout */}
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/80 text-xs text-stone-700 leading-relaxed font-sans">
              <strong className="text-stone-900 block mb-1">切片精要:</strong>
              <MathText text={activeSlice.conceptSummary} />
            </div>

            {/* Mathematical Metaphor (KaTeX Formatted) */}
            {activeSlice.mathematicalMetaphor && (
              <div className="bg-stone-900 text-stone-100 p-4 rounded-xl border border-stone-800 space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-xs border-b border-stone-800 pb-2">
                  <span className="font-mono text-teal-300 font-bold flex items-center gap-1.5">
                    <Sigma className="w-3.5 h-3.5 text-teal-400" />
                    <span>数学形式化微分切片 (Formal Mathematical Metaphor)</span>
                  </span>
                  <span className="text-[10px] text-teal-400/80 font-mono border border-teal-500/30 px-1.5 py-0.2 rounded bg-teal-950">
                    KaTeX
                  </span>
                </div>
                <div className="py-2 overflow-x-auto text-teal-200 text-sm sm:text-base flex items-center justify-center">
                  <KatexMath math={activeSlice.mathematicalMetaphor.formula} displayMode={true} />
                </div>
                <p className="text-xs text-stone-400 leading-relaxed font-sans pt-1 border-t border-stone-800/80">
                  <MathText text={activeSlice.mathematicalMetaphor.description} />
                </p>
              </div>
            )}

            {/* Core Principles */}
            <div>
              <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                <span>核心原理剖析</span>
              </h4>
              <div className="space-y-2">
                {activeSlice.corePrinciples.map((principle, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-stone-50/70 border border-stone-100 text-xs text-stone-700 leading-relaxed"
                  >
                    {principle}
                  </div>
                ))}
              </div>
            </div>

            {/* Classic Analogy */}
            <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80 space-y-1 text-xs text-amber-900">
              <div className="font-semibold flex items-center gap-1.5 text-amber-950">
                <Lightbulb className="w-3.5 h-3.5 text-amber-700" />
                <span>经典思维隐喻 (Mental Model):</span>
              </div>
              <p className="leading-relaxed pl-5">{activeSlice.classicAnalogy}</p>
            </div>

            {/* Critical Traps */}
            <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200/80 space-y-1.5 text-xs text-rose-900">
              <div className="font-semibold flex items-center gap-1.5 text-rose-950">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-700" />
                <span>必须警惕的致命认知陷阱:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-rose-800">
                {activeSlice.criticalTraps.map((trap, idx) => (
                  <li key={idx}>{trap}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Interactive Bathtub Probe widget (for Slice 1) */}
          {activeSlice.id === 'slice-stock-vs-flow' && (
            <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
                <Droplets className="w-4 h-4 text-teal-700" />
                <h4 className="text-xs font-bold text-stone-800 uppercase tracking-tight">
                  交互探针: 浴缸隐喻动态直觉实验 (The Bathtub Experiment)
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Inflow Slider */}
                <div className="space-y-1.5 bg-sky-50/60 p-3 rounded-xl border border-sky-100">
                  <div className="flex justify-between text-xs text-sky-900 font-medium">
                    <span>🚰 进水龙头流入速率 (Inflow)</span>
                    <strong className="font-mono">{faucetInflow} 升/分</strong>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={faucetInflow}
                    onChange={(e) => setFaucetInflow(parseInt(e.target.value, 10))}
                    className="w-full accent-sky-600 cursor-pointer"
                  />
                </div>

                {/* Outflow Slider */}
                <div className="space-y-1.5 bg-rose-50/60 p-3 rounded-xl border border-rose-100">
                  <div className="flex justify-between text-xs text-rose-900 font-medium">
                    <span>🕳️ 排水管道流出速率 (Outflow)</span>
                    <strong className="font-mono">{drainOutflow} 升/分</strong>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={drainOutflow}
                    onChange={(e) => setDrainOutflow(parseInt(e.target.value, 10))}
                    className="w-full accent-rose-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Dynamic State Status readout */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono font-bold ${
                  netRate > 0
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : netRate < 0
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-stone-50 border-stone-300 text-stone-900'
                }`}
              >
                <span>净变化率 dS/dt = {netRate > 0 ? `+${netRate}` : netRate} 升/分</span>
                <span>
                  {netRate > 0
                    ? '▲ 水位存量持续膨胀累积 (Rising)'
                    : netRate < 0
                    ? '▼ 水位存量持续下降流失 (Falling)'
                    : '■ 动态平衡！存量完全恒定 (Steady)'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Interactive Mini-Quiz Tester */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
              <HelpCircle className="w-4 h-4 text-teal-700" />
              <h4 className="text-xs font-bold text-stone-800 uppercase tracking-tight">
                切片认知自我检验 (Concept Quiz)
              </h4>
            </div>

            <p className="text-xs font-semibold text-stone-800 leading-snug">
              {activeSlice.interactiveQuestion.question}
            </p>

            <div className="space-y-2">
              {activeSlice.interactiveQuestion.options.map((opt, optIdx) => {
                const isSelected = quizAnswers[activeSlice.id] === optIdx;
                const isAnswered = quizAnswers[activeSlice.id] !== undefined && quizAnswers[activeSlice.id] !== null;

                let optStyle = 'bg-stone-50 border-stone-200 hover:bg-stone-100 text-stone-800';
                if (isAnswered && isSelected) {
                  optStyle = opt.isCorrect
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-900 ring-1 ring-emerald-400'
                    : 'bg-rose-50 border-rose-400 text-rose-900 ring-1 ring-rose-400';
                }

                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelectOption(activeSlice.id, optIdx)}
                    className={`w-full text-left p-3 rounded-xl border text-xs leading-relaxed transition-all cursor-pointer ${optStyle}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="font-mono font-bold text-stone-400 shrink-0">
                        {String.fromCharCode(65 + optIdx)}.
                      </span>
                      <span>{opt.text}</span>
                    </div>

                    {/* Feedback if selected */}
                    {isSelected && (
                      <div
                        className={`mt-2 pt-2 border-t text-[11px] leading-normal font-sans ${
                          opt.isCorrect
                            ? 'border-emerald-200 text-emerald-800 font-medium'
                            : 'border-rose-200 text-rose-800'
                        }`}
                      >
                        {opt.explanation}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Diagnostic Checklist */}
          <div className="bg-stone-50 rounded-2xl border border-stone-200 p-5 space-y-3">
            <h4 className="text-xs font-bold text-stone-800 uppercase tracking-tight flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
              <span>系统动力学自查清单</span>
            </h4>
            <div className="space-y-2 text-xs text-stone-600">
              {activeSlice.diagnosticChecklist.map((chk, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-teal-700 font-bold shrink-0">✓</span>
                  <span>{chk}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
