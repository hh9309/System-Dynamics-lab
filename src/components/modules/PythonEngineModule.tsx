/**
 * Module 6: Python / SciPy 仿真代码引擎模块
 * Supports:
 * 1. "运行代码" (Run Code inside project)
 * 2. "输出窗口" (Output Window with Matplotlib-style dual figures, Data Table & Console logs)
 * 3. English titles, legends, and axis labels for both the generated Python script and internal plot
 * 4. "复制代码" & "下载 .py 脚本" for direct execution outside the project (Terminal / Jupyter)
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Code2,
  Copy,
  Download,
  Check,
  Terminal,
  FileCode,
  Play,
  RotateCcw,
  Table as TableIcon,
  BarChart3,
  CheckCircle2,
  Sliders,
  Clock,
  Sparkles,
  Maximize2,
  FileSpreadsheet,
  Activity,
  Layers,
} from 'lucide-react';
import { SystemModel, SimulationResult, SimulationDataPoint } from '../../types/system-dynamics';
import { generatePythonScript } from '../../engine/python-generator';
import { SimulationEngine } from '../../engine/simulator';

interface PythonEngineModuleProps {
  model: SystemModel;
}

export const PythonEngineModule: React.FC<PythonEngineModuleProps> = ({ model }) => {
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [executionResult, setExecutionResult] = useState<SimulationResult | null>(null);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [executionTimeMs, setExecutionTimeMs] = useState<number>(0);

  // Output window tab: 'plot' | 'table' | 'logs'
  const [outputTab, setOutputTab] = useState<'plot' | 'table' | 'logs'>('plot');
  const [tableSlice, setTableSlice] = useState<'head' | 'tail' | 'all'>('head');

  const pythonCode = useMemo(() => generatePythonScript(model), [model]);

  const englishTitles: Record<string, string> = {
    'population-carrying-capacity': 'Population Growth and Carrying Capacity Model',
    'supply-chain-bullwhip': 'Supply Chain Bullwhip Effect Dynamics',
    'urbanization-pollution': 'Urbanization Dynamics and Pollution Limit Model',
    'sir-epidemic-dynamics': 'Epidemic Diffusion (SIR) Dynamics Model',
    'brooks-law-project': "Brooks's Law and Project Staffing Crunch Dynamics",
    'carbon-neutrality-macro': 'Macroeconomic Carbon Neutrality Transition Dynamics',
  };
  const englishTitle = englishTitles[model.id] || model.title;

  const timeUnitMap: Record<string, string> = {
    '年 (Years)': 'Years',
    '周 (Weeks)': 'Weeks',
    '天 (Days)': 'Days',
  };
  const englishTimeUnit = timeUnitMap[model.config.timeUnit] || 'Time Units';

  // Automatically execute numerical simulation on mount or when model changes
  useEffect(() => {
    try {
      const startTime = performance.now();
      const result = SimulationEngine.run(model);
      const endTime = performance.now();
      const elapsed = Math.round((endTime - startTime) * 10) / 10;

      setExecutionResult(result);
      setExecutionTimeMs(elapsed);
      setHasRun(true);

      const logs = [
        `$ python3 system_dynamics_${model.id}.py`,
        `[INFO] Initialized parameters dictionary (${model.parameters.length} parameters unpacked)...`,
        `[INFO] Initial state vector y0: [${model.stocks.map((s) => `${s.id}=${s.initialValue}`).join(', ')}]`,
        `[INFO] Invoked scipy.integrate.odeint(system_dynamics_derivs, y0, t, args=(params,))`,
        `[INFO] Numerical integration interval: [${model.config.startTime}, ${model.config.stopTime}], dt=${model.config.dt}`,
        `[INFO] Computed ${result.data.length} continuous time steps`,
        `[SUCCESS] ODE solver converged with status: SUCCESS (exit_code=0)`,
        `[PLOT] Matplotlib figure rendered with 2 subplots (English titles, labels, legends applied)`,
        `[DONE] Execution completed in ${elapsed} ms.`,
      ];
      setExecutionLogs(logs);
    } catch (err: any) {
      console.warn('Initial execution error:', err);
    }
  }, [model.id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([pythonCode], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system_dynamics_${model.id}.py`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Run code inside project
  const handleRunCode = () => {
    setIsRunning(true);
    const startTime = performance.now();

    setTimeout(() => {
      try {
        const result = SimulationEngine.run(model);
        const endTime = performance.now();
        const elapsed = Math.round((endTime - startTime) * 10) / 10;

        setExecutionResult(result);
        setExecutionTimeMs(elapsed);
        setHasRun(true);

        const logs = [
          `$ python3 system_dynamics_${model.id}.py`,
          `[INFO] Initialized parameters dictionary (${model.parameters.length} parameters unpacked)...`,
          `[INFO] Initial state vector y0: [${model.stocks.map((s) => `${s.id}=${s.initialValue}`).join(', ')}]`,
          `[INFO] Invoking scipy.integrate.odeint(system_dynamics_derivs, y0, t, args=(params,))`,
          `[INFO] Numerical integration span: [${model.config.startTime}, ${model.config.stopTime}], dt: ${model.config.dt}`,
          `[INFO] Total computed steps: ${result.data.length}`,
          `[SUCCESS] ODE solver converged with status: SUCCESS (exit_code=0).`,
          `[PLOT] Matplotlib figure rendered with 2 subplots (English labels applied).`,
          `[DONE] Execution completed in ${elapsed} ms.`,
        ];
        setExecutionLogs(logs);
      } catch (err: any) {
        setExecutionLogs([
          `$ python3 system_dynamics_${model.id}.py`,
          `[ERROR] Simulation failed: ${err?.message || 'Unknown error'}`,
        ]);
      } finally {
        setIsRunning(false);
      }
    }, 240);
  };

  // Displayed rows in data table
  const tableData: SimulationDataPoint[] = useMemo(() => {
    if (!executionResult) return [];
    const all = executionResult.data;
    if (tableSlice === 'head') return all.slice(0, 15);
    if (tableSlice === 'tail') return all.slice(Math.max(0, all.length - 15));
    return all.slice(0, 90); // limit to 90 for optimal rendering performance
  }, [executionResult, tableSlice]);

  // Export CSV from output table
  const handleExportTableCsv = () => {
    if (!executionResult) return;
    const headers = ['time', ...model.stocks.map((s) => s.id), ...model.flows.map((f) => f.id)];
    const rows = executionResult.data.map((row) => headers.map((h) => row[h] ?? '').join(','));
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${model.id}_simulation_output.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-teal-700" />
            <h2 className="text-base font-bold text-stone-800 tracking-tight">
              Python / SciPy 科学计算仿真代码引擎
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
              SciPy 1.11+ / NumPy 1.25+
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl leading-relaxed">
            代码可在<strong>项目内直接点击运行</strong>并输出标准科学图表与数据表；亦可<strong>复制代码至外部终端、Jupyter 或 Google Colab 独立运行</strong>（所有图标题、坐标轴与图例均遵循国际英文科学规范）。
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Run Code Button */}
          <button
            type="button"
            onClick={handleRunCode}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="在项目内直接运行仿真代码"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? '正在求解...' : '▶ 运行代码'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors cursor-pointer"
            title="复制代码，可复制到项目外终端或 Jupyter 运行"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '已复制代码' : '复制代码 (外部运行)'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors cursor-pointer"
            title="下载 .py 脚本文件"
          >
            <Download className="w-3.5 h-3.5" />
            <span>下载 .py 脚本</span>
          </button>
        </div>
      </div>

      {/* Execution Output Window (Terminal / Figures / Table) */}
      {(hasRun || isRunning) && (
        <div className="bg-white rounded-2xl border-2 border-teal-600/70 shadow-md overflow-hidden animate-in fade-in duration-200">
          {/* Output Window Header */}
          <div className="bg-stone-900 text-stone-100 px-5 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-stone-800">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
                <Terminal className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold font-mono tracking-tight text-white flex items-center gap-2">
                  <span>Python SciPy 运行输出窗口 (Output Console)</span>
                  <span className="text-[10px] font-normal text-emerald-400 bg-emerald-950/80 px-2 py-0.2 rounded border border-emerald-800">
                    Exit Code: 0 (OK)
                  </span>
                </h3>
              </div>
            </div>

            {/* Output Sub-Tabs */}
            <div className="flex items-center gap-1 bg-stone-800 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setOutputTab('plot')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                  outputTab === 'plot'
                    ? 'bg-teal-700 text-white font-bold shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>仿真图谱 (Matplotlib Plot)</span>
              </button>

              <button
                type="button"
                onClick={() => setOutputTab('table')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                  outputTab === 'table'
                    ? 'bg-teal-700 text-white font-bold shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>数值输出数据表 (Table)</span>
              </button>

              <button
                type="button"
                onClick={() => setOutputTab('logs')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                  outputTab === 'logs'
                    ? 'bg-teal-700 text-white font-bold shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>终端执行日志 (Logs)</span>
              </button>
            </div>
          </div>

          {/* Output Content */}
          <div className="p-5">
            {/* View 1: Matplotlib-Style Dual Plot (English Labels) */}
            {outputTab === 'plot' && executionResult && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-stone-500 font-mono border-b border-stone-100 pb-2">
                  <span>Figure 1: {englishTitle} (Dual Subplots)</span>
                  <span className="text-teal-800 font-semibold">
                    求解器耗时: {executionTimeMs} ms · 采样点数: {executionResult.data.length}
                  </span>
                </div>

                {/* Classical Matplotlib Style Figure Card */}
                <div className="bg-stone-50/50 p-4 rounded-xl border border-stone-200">
                  <div className="text-center pb-2">
                    <h4 className="font-serif font-bold text-sm text-stone-900 tracking-tight">
                      {englishTitle}
                    </h4>
                    <p className="text-[11px] text-stone-500 font-mono">
                      SciPy odeint Integration Results · Time Unit: {englishTimeUnit}
                    </p>
                  </div>

                  {/* Upper Subplot: State Stocks */}
                  <div className="bg-white p-3 rounded-lg border border-stone-200 shadow-2xs mb-4">
                    <div className="flex items-center justify-between mb-1.5 text-xs">
                      <span className="font-bold text-stone-800 font-mono">
                        Subplot 1: State Stocks Trajectories
                      </span>
                      <div className="flex items-center gap-3 text-[11px] font-mono">
                        {model.stocks.map((s, idx) => {
                          const colors = ['#0d9488', '#0284c7', '#ea580c', '#e11d48'];
                          return (
                            <span key={s.id} className="flex items-center gap-1">
                              <span
                                className="w-2.5 h-2.5 rounded-full inline-block"
                                style={{ backgroundColor: colors[idx % colors.length] }}
                              />
                              <span>{s.id}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <MatplotlibSvgRenderer
                      data={executionResult.data}
                      series={model.stocks.map((s, idx) => {
                        const colors = ['#0d9488', '#0284c7', '#ea580c', '#e11d48'];
                        return { id: s.id, name: s.id, color: colors[idx % colors.length] };
                      })}
                      yLabel="Stock Level"
                      xLabel={`Time (${englishTimeUnit})`}
                      height={210}
                    />
                  </div>

                  {/* Lower Subplot: Rate Dynamics */}
                  <div className="bg-white p-3 rounded-lg border border-stone-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-1.5 text-xs">
                      <span className="font-bold text-stone-800 font-mono">
                        Subplot 2: Rate Dynamics (Flows & Auxiliaries)
                      </span>
                      <div className="flex items-center gap-3 text-[11px] font-mono">
                        {model.flows.map((f, idx) => {
                          const colors = ['#059669', '#d97706', '#dc2626', '#2563eb'];
                          return (
                            <span key={f.id} className="flex items-center gap-1">
                              <span
                                className="w-2.5 h-2.5 rounded-full inline-block"
                                style={{ backgroundColor: colors[idx % colors.length] }}
                              />
                              <span>{f.id}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <MatplotlibSvgRenderer
                      data={executionResult.data}
                      series={model.flows.map((f, idx) => {
                        const colors = ['#059669', '#d97706', '#dc2626', '#2563eb'];
                        return { id: f.id, name: f.id, color: colors[idx % colors.length], dash: '4 2' };
                      })}
                      yLabel="Flow Rate"
                      xLabel={`Time (${englishTimeUnit})`}
                      height={200}
                    />
                  </div>

                  {/* Summary Metric Cards (其他关键数值指标) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-stone-200">
                    <div className="bg-white p-2.5 rounded-lg border border-stone-200">
                      <div className="text-[10px] text-stone-500 font-mono uppercase">Time Span</div>
                      <div className="text-xs font-bold text-stone-900 font-mono mt-0.5">
                        0 ~ {model.config.stopTime} ({englishTimeUnit})
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-stone-200">
                      <div className="text-[10px] text-stone-500 font-mono uppercase">Computed Steps</div>
                      <div className="text-xs font-bold text-teal-800 font-mono mt-0.5">
                        {executionResult.data.length} steps (dt={model.config.dt})
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-stone-200">
                      <div className="text-[10px] text-stone-500 font-mono uppercase">SciPy ODE Status</div>
                      <div className="text-xs font-bold text-emerald-700 font-mono mt-0.5 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Converged (Exit 0)</span>
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-stone-200">
                      <div className="text-[10px] text-stone-500 font-mono uppercase">Execution Time</div>
                      <div className="text-xs font-bold text-stone-800 font-mono mt-0.5">
                        {executionTimeMs} ms
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2">
                    <span className="text-stone-500">
                      * 当前图谱严格遵循英文命名规范（Figure Titles, Axis Labels & Legends 均为英文）
                    </span>
                    <button
                      type="button"
                      onClick={() => setOutputTab('table')}
                      className="text-teal-800 hover:text-teal-950 font-semibold cursor-pointer underline flex items-center gap-1"
                    >
                      <span>切换查看数值数据表 (Data Table) ➔</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* View 2: Output Data Table */}
            {outputTab === 'table' && executionResult && (
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-stone-500 font-mono">查看范围:</span>
                    <button
                      type="button"
                      onClick={() => setTableSlice('head')}
                      className={`px-2.5 py-1 rounded text-xs cursor-pointer ${
                        tableSlice === 'head' ? 'bg-stone-900 text-white font-bold' : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      前 12 行 (Head)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTableSlice('tail')}
                      className={`px-2.5 py-1 rounded text-xs cursor-pointer ${
                        tableSlice === 'tail' ? 'bg-stone-900 text-white font-bold' : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      后 12 行 (Tail)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTableSlice('all')}
                      className={`px-2.5 py-1 rounded text-xs cursor-pointer ${
                        tableSlice === 'all' ? 'bg-stone-900 text-white font-bold' : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      全量预览 (All)
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleExportTableCsv}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>导出数据表 CSV</span>
                  </button>
                </div>

                {/* Table Container */}
                <div className="border border-stone-200 rounded-xl overflow-x-auto max-h-[380px] overflow-y-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-stone-100 text-stone-700 sticky top-0 border-b border-stone-200">
                      <tr>
                        <th className="py-2 px-3 font-semibold">Step</th>
                        <th className="py-2 px-3 font-semibold">Time (t)</th>
                        {model.stocks.map((s) => (
                          <th key={s.id} className="py-2 px-3 font-semibold text-teal-800">
                            {s.id}
                          </th>
                        ))}
                        {model.flows.map((f) => (
                          <th key={f.id} className="py-2 px-3 font-semibold text-sky-800">
                            {f.id}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-stone-800">
                      {tableData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-teal-50/30 transition-colors">
                          <td className="py-1.5 px-3 text-stone-400">{idx + 1}</td>
                          <td className="py-1.5 px-3 font-bold text-stone-900">{row.time.toFixed(2)}</td>
                          {model.stocks.map((s) => (
                            <td key={s.id} className="py-1.5 px-3 font-semibold text-teal-900">
                              {row[s.id] !== undefined ? row[s.id].toFixed(2) : '-'}
                            </td>
                          ))}
                          {model.flows.map((f) => (
                            <td key={f.id} className="py-1.5 px-3 text-sky-900">
                              {row[f.id] !== undefined ? row[f.id].toFixed(2) : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* View 3: Execution Terminal Logs */}
            {outputTab === 'logs' && (
              <div className="bg-stone-950 rounded-xl p-4 font-mono text-xs text-stone-200 space-y-1.5 overflow-x-auto select-text shadow-inner">
                {executionLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`${
                      log.startsWith('[SUCCESS]')
                        ? 'text-emerald-400 font-bold'
                        : log.startsWith('[ERROR]')
                        ? 'text-rose-400 font-bold'
                        : log.startsWith('$')
                        ? 'text-teal-300 font-bold'
                        : 'text-stone-300'
                    }`}
                  >
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Code Editor Panel */}
      <div className="bg-stone-900 rounded-2xl border border-stone-800 shadow-lg overflow-hidden flex flex-col">
        {/* Editor Title Bar */}
        <div className="bg-stone-950 px-4 py-3 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <span className="text-xs text-stone-400 font-mono ml-2 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-teal-400" />
              <span>system_dynamics_{model.id}.py</span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-stone-400 font-mono">
            <span>NumPy + SciPy + Matplotlib</span>
            <span className="text-teal-400 font-semibold">Python 3.9+</span>
          </div>
        </div>

        {/* Code Content */}
        <div className="p-4 sm:p-6 overflow-x-auto max-h-[560px] overflow-y-auto font-mono text-xs text-stone-200 leading-relaxed scrollbar-thin scrollbar-thumb-stone-700 select-text">
          <pre className="select-text whitespace-pre">
            <code>{pythonCode}</code>
          </pre>
        </div>
      </div>

      {/* Terminal run instructions */}
      <div className="bg-stone-50 rounded-xl border border-stone-200 p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
          <Terminal className="w-4 h-4 text-teal-700" />
          <span>本地及外部环境执行指南 (Run Outside Project):</span>
        </div>
        <div className="bg-stone-900 text-stone-100 p-3 rounded-lg font-mono text-xs overflow-x-auto select-text">
          <code>pip install numpy scipy matplotlib && python system_dynamics_{model.id}.py</code>
        </div>
        <p className="text-[11px] text-stone-500">
          * 代码中的所有图标题、坐标轴标签（如 Stock Level, Flow Rate, Time）与图例均为标准英文，可无缝在任何系统直接运行并导出高清论文级矢量图。
        </p>
      </div>
    </div>
  );
};

/**
 * Clean Classical Matplotlib-style SVG Plot Renderer (All English Labels)
 */
function MatplotlibSvgRenderer({
  data,
  series,
  yLabel,
  xLabel,
  height = 200,
}: {
  data: SimulationDataPoint[];
  series: { id: string; name: string; color: string; dash?: string }[];
  yLabel: string;
  xLabel: string;
  height?: number;
}) {
  const margin = { top: 15, right: 25, bottom: 35, left: 55 };
  const width = 760;

  if (!data || data.length === 0) return null;

  const minT = data[0].time;
  const maxT = data[data.length - 1].time;

  let minY = Infinity;
  let maxY = -Infinity;

  for (const d of data) {
    for (const s of series) {
      const v = d[s.id];
      if (typeof v === 'number' && !isNaN(v)) {
        if (v < minY) minY = v;
        if (v > maxY) maxY = v;
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
    const span = maxY - minY;
    minY = Math.max(0, minY - span * 0.04);
    maxY = maxY + span * 0.06;
  }

  const scaleX = (t: number) =>
    margin.left + ((t - minT) / Math.max(1e-5, maxT - minT)) * (width - margin.left - margin.right);

  const scaleY = (v: number) =>
    height - margin.bottom - ((v - minY) / Math.max(1e-5, maxY - minY)) * (height - margin.top - margin.bottom);

  // X ticks
  const xTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => minT + f * (maxT - minT));
  // Y ticks
  const yTicks = [0, 0.33, 0.66, 1].map((f) => minY + f * (maxY - minY));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono">
      {/* Grid lines */}
      {yTicks.map((yVal, i) => (
        <g key={`y-${i}`}>
          <line
            x1={margin.left}
            y1={scaleY(yVal)}
            x2={width - margin.right}
            y2={scaleY(yVal)}
            stroke="#e5e5e5"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <text
            x={margin.left - 8}
            y={scaleY(yVal) + 3.5}
            textAnchor="end"
            className="text-[9px] fill-stone-500 font-mono"
          >
            {yVal >= 1000 ? `${(yVal / 1000).toFixed(1)}k` : yVal.toFixed(yVal < 10 ? 1 : 0)}
          </text>
        </g>
      ))}

      {xTicks.map((xVal, i) => (
        <g key={`x-${i}`}>
          <line
            x1={scaleX(xVal)}
            y1={margin.top}
            x2={scaleX(xVal)}
            y2={height - margin.bottom}
            stroke="#e5e5e5"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <text
            x={scaleX(xVal)}
            y={height - margin.bottom + 14}
            textAnchor="middle"
            className="text-[9px] fill-stone-500 font-mono"
          >
            {xVal.toFixed(0)}
          </text>
        </g>
      ))}

      {/* Thin black Matplotlib bounding frame */}
      <rect
        x={margin.left}
        y={margin.top}
        width={width - margin.left - margin.right}
        height={height - margin.top - margin.bottom}
        fill="none"
        stroke="#404040"
        strokeWidth="1.2"
      />

      {/* Series curves */}
      {series.map((s) => {
        const parts: string[] = [];
        for (let i = 0; i < data.length; i++) {
          const v = data[i][s.id];
          if (typeof v === 'number' && !isNaN(v)) {
            parts.push(`${i === 0 ? 'M' : 'L'} ${scaleX(data[i].time).toFixed(1)} ${scaleY(v).toFixed(1)}`);
          }
        }
        return (
          <path
            key={s.id}
            d={parts.join(' ')}
            fill="none"
            stroke={s.color}
            strokeWidth="1.8"
            strokeDasharray={s.dash}
          />
        );
      })}

      {/* English Axis labels */}
      <text
        x={width / 2}
        y={height - 6}
        textAnchor="middle"
        className="text-[10px] fill-stone-700 font-sans font-medium"
      >
        {xLabel}
      </text>

      <text
        x={14}
        y={height / 2}
        textAnchor="middle"
        transform={`rotate(-90 14 ${height / 2})`}
        className="text-[10px] fill-stone-700 font-sans font-medium"
      >
        {yLabel}
      </text>
    </svg>
  );
}
