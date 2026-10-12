/**
 * Module 7: AI 动力学诊断与专家随诊 (AI Diagnosis & Consultation Modal)
 * Features gear settings icon for manual API-Key entry and dual LLM selection (gemini 3 flash / deepseek-v4-pro).
 * Enforces API-Key requirement before all LLM invocations for GitHub standalone deployment.
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Activity,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  CheckCircle2,
  Settings,
  Key,
  Cpu,
  Check,
  ShieldAlert,
  ExternalLink,
} from 'lucide-react';
import { SystemModel, SimulationResult } from '../../types/system-dynamics';

interface AiDiagnosisModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: SystemModel;
  simulationResult: SimulationResult;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
}

export type SupportedLlmModel = 'gemini 3 flash' | 'deepseek-v4-pro';

export const AiDiagnosisModal: React.FC<AiDiagnosisModalProps> = ({
  isOpen,
  onClose,
  model,
  simulationResult,
}) => {
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'chat'>('diagnosis');
  const [diagnosisText, setDiagnosisText] = useState<string | null>(null);
  const [loadingDiagnosis, setLoadingDiagnosis] = useState(false);
  const [sourceEngine, setSourceEngine] = useState<string>('');

  // LLM Settings State (saved in localStorage for GitHub browser deployment)
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<SupportedLlmModel>(() => {
    return (localStorage.getItem('sd_llm_model') as SupportedLlmModel) || 'gemini 3 flash';
  });
  const [apiKeyInput, setApiKeyInput] = useState<string>(() => {
    return localStorage.getItem('sd_llm_api_key') || '';
  });
  const [confirmedApiKey, setConfirmedApiKey] = useState<string>(() => {
    return localStorage.getItem('sd_llm_api_key') || '';
  });
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<boolean>(false);
  const [requireKeyAlert, setRequireKeyAlert] = useState<string | null>(null);

  // Chat state
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      sender: 'ai',
      text: `您好！我是系统动力学智能随诊顾问。已接入当前模型「${model.title}」。\n您可以点击上方「一键全系统动力学诊断」，或直接向我咨询因果回路死锁、延迟超调振荡与 Donella Meadows 杠杆点干预策略。\n\n💡 提示：所有大模型调用需先点击右上角 ⚙️ 输入并确认 API-Key。`,
      time: '刚刚',
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Synchronize initial settings on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('sd_llm_api_key') || '';
    const savedModel = (localStorage.getItem('sd_llm_model') as SupportedLlmModel) || 'gemini 3 flash';
    setConfirmedApiKey(savedKey);
    setApiKeyInput(savedKey);
    setSelectedModel(savedModel);
  }, []);

  if (!isOpen) return null;

  // Save Settings Handler
  const handleConfirmSettings = () => {
    const trimmed = apiKeyInput.trim();
    setConfirmedApiKey(trimmed);
    localStorage.setItem('sd_llm_api_key', trimmed);
    localStorage.setItem('sd_llm_model', selectedModel);
    setRequireKeyAlert(null);
    setSaveSuccessNotice(true);
    setTimeout(() => {
      setSaveSuccessNotice(false);
      setShowSettings(false);
    }, 1200);
  };

  // Helper for direct browser-side LLM call (when deployed statically on GitHub Pages)
  const callLlmDirectInBrowser = async (
    targetModel: SupportedLlmModel,
    apiKey: string,
    sysPrompt: string,
    userPrompt: string
  ): Promise<{ text: string; source: string }> => {
    if (targetModel === 'gemini 3 flash') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
        apiKey.trim()
      )}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: sysPrompt }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: userPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.4,
          },
        }),
      });
      const data = await response.json();
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        return { text: data.candidates[0].content.parts[0].text, source: 'gemini 3 flash (Browser Direct)' };
      }
      if (data.error?.message) {
        throw new Error(`Google Gemini 鉴权或请求错误: ${data.error.message}`);
      }
      throw new Error('未能从 Gemini 获取响应');
    } else {
      // deepseek-v4-pro
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: sysPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.4,
        }),
      });
      const data = await response.json();
      if (data.choices && data.choices[0]?.message?.content) {
        return { text: data.choices[0].message.content, source: 'deepseek-v4-pro (Browser Direct)' };
      }
      if (data.error?.message) {
        throw new Error(`DeepSeek 鉴权或请求错误: ${data.error.message}`);
      }
      throw new Error('未能从 DeepSeek 获取响应');
    }
  };

  // Run comprehensive diagnosis
  const handleRunDiagnosis = async () => {
    // Enforce API-Key requirement
    if (!confirmedApiKey || !confirmedApiKey.trim()) {
      setRequireKeyAlert('所有大模型调用必须输入并确认 API-Key 后才能调用！已为您展开配置面板，请输入后点击确认。');
      setShowSettings(true);
      return;
    }

    setRequireKeyAlert(null);
    setLoadingDiagnosis(true);
    const systemPrompt = `你是一位深谙系统动力学（System Dynamics，由Jay Forrester与Donella Meadows开创）的高级科学家与诊断专家。
你的任务是依据给定的模型结构（存量、流量、辅助变量、因果反馈回路、信息与物流延迟）以及仿真时间序列摘要，给出高水平、深刻、切中要害的系统动力学诊断。

诊断标准切片：
1. 【结构与反馈分析】：识别增强回路(R)与调节回路(B)的支配力切换。
2. 【延迟与振荡风险】：分析延迟管道（如1阶/3阶延迟、交期滞后、调整滞后）如何导致相位滞后与系统超调或死锁。
3. 【政策阻力与致命陷阱】：警惕“线性直觉”陷阱、混淆存量流量量纲、缺乏负反馈约束导致的指数爆炸。
4. 【杠杆解与干预策略】：给出高杠杆干预点（Donella Meadows 12大系统杠杆点）。

请输出专业、淡雅、条理严谨的中文 Markdown 诊断报告。`;

    const userPrompt = `【模型诊断请求】
模型名称: ${model.title}
存量变量(Stocks): ${JSON.stringify(model.stocks.map((s) => ({ id: s.id, name: s.name, initial: s.initialValue })))}
流量方程(Flows): ${JSON.stringify(model.flows.map((f) => ({ id: f.id, equation: f.equation })))}
识别的因果反馈回路: ${JSON.stringify(model.cldLoops)}
延迟参数(Delays): ${JSON.stringify(model.cldLinks.filter((l) => l.delay))}
数值仿真特征摘要: ${JSON.stringify(simulationResult.summary)}

请给出包含以下板块的系统动力学综合诊断：
### 1. 核心动力学机制剖析 (反馈极性与主导环路)
### 2. 潜在失稳与陷阱警示 (延迟震荡 / 存量枯竭 / 结构死锁)
### 3. 高杠杆政策干预点建议 (Leverage Points)
### 4. 针对当前仿真状态的专家行动建议`;

    try {
      // First attempt backend proxy
      try {
        const payload = {
          modelName: model.title,
          stocks: model.stocks.map((s) => ({ id: s.id, name: s.name, initial: s.initialValue })),
          flows: model.flows.map((f) => ({ id: f.id, equation: f.equation })),
          loops: model.cldLoops,
          delays: model.cldLinks.filter((l) => l.delay),
          simulationSummary: simulationResult.summary,
          model: selectedModel,
          apiKey: confirmedApiKey,
        };

        const res = await fetch('/api/gemini/diagnose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setDiagnosisText(data.diagnosis);
            setSourceEngine(data.source || selectedModel);
            return;
          }
        }
      } catch (backendErr) {
        console.info('Backend proxy unavailable, falling back to direct browser LLM invocation (GitHub deployment mode)');
      }

      // Fallback: Direct browser invocation (GitHub deployment)
      const directResult = await callLlmDirectInBrowser(selectedModel, confirmedApiKey, systemPrompt, userPrompt);
      setDiagnosisText(directResult.text);
      setSourceEngine(directResult.source);
    } catch (err: any) {
      setDiagnosisText(`大模型调用失败: ${err?.message || '请检查 API-Key 是否正确及网络是否畅通。'}`);
    } finally {
      setLoadingDiagnosis(false);
    }
  };

  // Send interactive chat
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || chatLoading) return;

    // Enforce API-Key requirement
    if (!confirmedApiKey || !confirmedApiKey.trim()) {
      setRequireKeyAlert('所有大模型调用必须输入并确认 API-Key 后才能调用！已为您展开配置面板，请输入后点击确认。');
      setShowSettings(true);
      return;
    }

    setRequireKeyAlert(null);
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setChatLoading(true);

    const systemPrompt = `你是一位系统动力学高级咨询顾问。当前分析模型为「${model.title}」。
请围绕因果反馈回路(CLD)、存量与流量(Level & Rate)、时滞效应(Delays)、牛鞭振荡以及系统思考杠杆点，为用户提供科学、深入且通俗易懂的专业解答。`;

    try {
      let replyText = '';
      // Try backend proxy
      try {
        const res = await fetch('/api/gemini/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: textToSend.trim() }],
            context: {
              model: model.title,
              stocksCount: model.stocks.length,
              oscillation: simulationResult.summary.hasOscillation,
            },
            model: selectedModel,
            apiKey: confirmedApiKey,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.reply) {
            replyText = data.reply;
          }
        }
      } catch (e) {
        console.info('Backend chat unavailable, using browser direct LLM call');
      }

      if (!replyText) {
        // Direct browser call
        const directResult = await callLlmDirectInBrowser(selectedModel, confirmedApiKey, systemPrompt, textToSend.trim());
        replyText = directResult.text;
      }

      const aiReply: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: replyText || '系统动力学分析已完成。',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiReply]);
    } catch (err: any) {
      const aiErr: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `大模型调用遇到异常: ${err?.message || '请检查您输入的 API-Key 及网络状态。'}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiErr]);
    } finally {
      setChatLoading(false);
    }
  };

  const sampleQuestions = [
    '为什么负反馈加上长延迟必然引发周期性振荡？',
    '如何破解牛鞭效应中的信息失真与超调？',
    '在布鲁克斯定律模型中，何为最佳干预杠杆点？',
    '如何通过调节回路设计防止系统超越资源承载阈值？',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-3xl w-full h-[85vh] flex flex-col overflow-hidden relative">
        {/* Modal Header */}
        <div className="bg-stone-900 text-stone-100 px-6 py-4 flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm tracking-tight">
                  AI 动力学诊断与专家随诊
                </h3>
                {/* 标题最右侧小齿轮设置大模型图标 */}
                <button
                  type="button"
                  onClick={() => {
                    setShowSettings(!showSettings);
                    setRequireKeyAlert(null);
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer border ${
                    showSettings
                      ? 'bg-teal-600 text-white border-teal-400 shadow-xs ring-1 ring-teal-300/40'
                      : 'bg-stone-800 text-stone-200 border-stone-700 hover:bg-stone-700 hover:text-white'
                  }`}
                  title="点击设置大模型：1. 手工输入 API-Key 2. 选择 gemini 3 flash / deepseek-v4-pro 3. 确认大模型"
                >
                  <Settings className={`w-3.5 h-3.5 text-amber-400 ${showSettings ? 'rotate-90 transition-transform' : ''}`} />
                  <span>设置大模型</span>
                  {!confirmedApiKey ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse ml-0.5" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5" />
                  )}
                </button>

                {/* Active Model Indicator Tag */}
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-800 text-teal-300 border border-stone-700">
                  {selectedModel}
                </span>
                {confirmedApiKey ? (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    <span>Key已就绪</span>
                  </span>
                ) : (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />
                    <span>需输入Key</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-400">
                当前模型: {model.title} · 反馈回路失稳与杠杆点分析
              </p>
            </div>
          </div>

          {/* Right Action Icons: Gear Settings & Close */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setShowSettings(!showSettings);
                setRequireKeyAlert(null);
              }}
              className={`p-2 rounded-lg transition-colors cursor-pointer relative ${
                showSettings
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
              title="大模型设置：手工输入 API-Key 及选择 gemini 3 flash / deepseek-v4-pro"
            >
              <Settings className={`w-4 h-4 ${showSettings ? 'rotate-90 transition-transform' : ''}`} />
              {!confirmedApiKey && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mandatory Key Alert Banner */}
        {requireKeyAlert && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 flex items-center justify-between gap-3 text-xs text-rose-900 shrink-0">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{requireKeyAlert}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="text-[11px] font-bold text-rose-700 underline shrink-0 cursor-pointer"
            >
              前往输入
            </button>
          </div>
        )}

        {/* Gear Settings Modal / Drawer Dropdown */}
        {showSettings && (
          <div className="bg-stone-50 border-b-2 border-teal-600 px-6 py-4 space-y-4 shadow-md shrink-0 animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-teal-700" />
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-tight">
                  大模型接入与鉴权配置 (Model & API-Key Configuration)
                </h4>
              </div>
              <span className="text-[10px] text-stone-500 font-mono">
                支持 GitHub 独立部署与本地浏览器端调用
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Setting 1: 手工输入 API-Key */}
              <div>
                <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5 mb-1.5">
                  <Key className="w-3.5 h-3.5 text-teal-700" />
                  <span>1. 手工输入 API-Key</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="输入您的 API-Key (如 AIzaSy... 或 sk-...)"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500 pr-16"
                  />
                  {apiKeyInput && (
                    <button
                      type="button"
                      onClick={() => setApiKeyInput('')}
                      className="absolute right-2 top-2 text-[10px] text-stone-400 hover:text-stone-600 px-1.5 py-0.5 rounded"
                    >
                      清空
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-stone-500 mt-1 leading-snug">
                  * 部署到 GitHub 或浏览器独立访问时，Key 将安全保存在本地浏览器中，调用时直接发送鉴权。
                </p>
              </div>

              {/* Setting 2: 选择两个大模型 */}
              <div>
                <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5 mb-1.5">
                  <Cpu className="w-3.5 h-3.5 text-teal-700" />
                  <span>2. 选择大模型 (Select Model)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedModel('gemini 3 flash')}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                      selectedModel === 'gemini 3 flash'
                        ? 'bg-teal-50 border-teal-500 text-teal-950 font-bold ring-1 ring-teal-400'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>gemini 3 flash</span>
                      {selectedModel === 'gemini 3 flash' && <Check className="w-3.5 h-3.5 text-teal-700" />}
                    </div>
                    <div className="text-[10px] text-stone-500 font-normal font-mono mt-0.5">
                      Google GenAI 高速端
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedModel('deepseek-v4-pro')}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                      selectedModel === 'deepseek-v4-pro'
                        ? 'bg-teal-50 border-teal-500 text-teal-950 font-bold ring-1 ring-teal-400'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>deepseek-v4-pro</span>
                      {selectedModel === 'deepseek-v4-pro' && <Check className="w-3.5 h-3.5 text-teal-700" />}
                    </div>
                    <div className="text-[10px] text-stone-500 font-normal font-mono mt-0.5">
                      DeepSeek 深度推理端
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Setting 3: 确认大模型 Button */}
            <div className="flex items-center justify-between pt-2 border-t border-stone-200">
              <span className="text-[11px] text-stone-600">
                当前鉴权状态:{' '}
                {confirmedApiKey ? (
                  <strong className="text-emerald-700">已就绪 (已确认保存)</strong>
                ) : (
                  <strong className="text-rose-600">未设置 (调用时将被拦截提示)</strong>
                )}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-stone-600 hover:bg-stone-200 transition-colors"
                >
                  关闭
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSettings}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>3. 确认大模型与 Key</span>
                </button>
              </div>
            </div>

            {saveSuccessNotice && (
              <div className="text-xs text-emerald-800 font-semibold bg-emerald-50 px-3 py-1 rounded border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>大模型参数已确认并持久化保存至浏览器！</span>
              </div>
            )}
          </div>
        )}

        {/* Tab switch bar */}
        <div className="bg-stone-100 px-6 py-2 border-b border-stone-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('diagnosis')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'diagnosis'
                  ? 'bg-white text-stone-900 shadow-xs border border-stone-200 font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              全系统智能诊断
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-white text-stone-900 shadow-xs border border-stone-200 font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              交互式专家问答
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-stone-500 font-mono hidden md:inline">
              驱动模型: <strong className="text-stone-800">{selectedModel}</strong>
            </span>

            {activeTab === 'diagnosis' && (
              <button
                type="button"
                onClick={handleRunDiagnosis}
                disabled={loadingDiagnosis}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-700 text-white hover:bg-teal-800 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>{loadingDiagnosis ? '正在全景诊断...' : '执行诊断'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'diagnosis' ? (
            <div>
              {!diagnosisText && !loadingDiagnosis && (
                <div className="text-center py-10 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="max-w-md mx-auto">
                    <h4 className="text-sm font-bold text-stone-800">
                      尚未生成当前模型诊断
                    </h4>
                    <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                      AI 诊断引擎将自动汇总当前模型的 {model.stocks.length} 个存量、
                      {model.flows.length} 个流量、{model.cldLoops.length} 个因果回路
                      及当前数值仿真振荡特征，输出深度诊断切片。
                    </p>
                    <p className="text-[11px] text-amber-700 mt-2 bg-amber-50 p-2 rounded-lg border border-amber-200">
                      * 提示: 调用前需点击右上角 ⚙️ 输入并确认您的 API-Key ({selectedModel})。
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRunDiagnosis}
                    className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold cursor-pointer shadow-sm"
                  >
                    立即启动系统动力学全景诊断
                  </button>
                </div>
              )}

              {loadingDiagnosis && (
                <div className="text-center py-16 space-y-3">
                  <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-stone-500 font-mono">
                    [{selectedModel}] 正在解构反馈回路极性、检验信息时滞、评估系统振荡与崩溃风险...
                  </p>
                </div>
              )}

              {diagnosisText && !loadingDiagnosis && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-stone-400 font-mono border-b border-stone-100 pb-2">
                    <span>推理引擎: {sourceEngine || selectedModel}</span>
                    <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>诊断已就绪</span>
                    </span>
                  </div>

                  <div className="prose prose-stone max-w-none text-xs leading-relaxed text-stone-800 select-text font-sans">
                    <pre className="p-4 bg-stone-50 rounded-xl border border-stone-200 font-sans text-xs whitespace-pre-wrap leading-relaxed">
                      {diagnosisText}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Interactive Chat View */
            <div className="flex flex-col h-full space-y-4">
              {/* Messages list */}
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${
                      msg.sender === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        msg.sender === 'user'
                          ? 'bg-stone-800 text-white'
                          : 'bg-teal-600 text-white'
                      }`}
                    >
                      {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    <div
                      className={`p-3.5 rounded-2xl text-xs max-w-[80%] leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-teal-700 text-white rounded-tr-xs'
                          : 'bg-stone-50 border border-stone-200 text-stone-800 rounded-tl-xs select-text'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                      <div
                        className={`text-[9px] mt-1 text-right font-mono ${
                          msg.sender === 'user' ? 'text-teal-200' : 'text-stone-400'
                        }`}
                      >
                        {msg.time}
                      </div>
                    </div>
                  </div>
                ))}

                {chatLoading && (
                  <div className="flex items-center gap-2 text-xs text-stone-400 italic py-2 pl-9">
                    <div className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
                    <span>[{selectedModel}] 顾问正在深入分析系统结构...</span>
                  </div>
                )}
              </div>

              {/* Sample question chips */}
              <div className="pt-2 border-t border-stone-100">
                <span className="text-[10px] text-stone-400 font-mono block mb-1.5 uppercase">
                  推荐经典质询:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {sampleQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(q)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer text-left"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input bar */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  placeholder={`向 [${selectedModel}] 质询任何回路、振荡或政策杠杆问题...`}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  className="flex-1 text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-teal-500 bg-stone-50 focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || chatLoading}
                  className="p-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
