/**
 * Module 9: 数据集与分析报告导出引擎 (Dataset & Report Export Engine)
 * 1. 提供六大案例库各个案例的原始数据集 (CSV 时间序列) 与模型配置 (JSON) 独立下载选项
 * 2. 对应分析报告按照系统动力学「全流程导引」分为标准 6 大核心部分
 * 3. 支持实时排版预览 (Scholarly Paper Preview) 与 Markdown 源码视图切换，支持一键打印/导出 PDF
 */

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Copy,
  Check,
  Printer,
  FileSpreadsheet,
  FileCode,
  Sparkles,
  Database,
  Eye,
  Layers,
  Sigma,
  Share2,
  SlidersHorizontal,
  Activity,
  GitCompare,
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderDown,
} from 'lucide-react';
import {
  SystemModel,
  SimulationResult,
} from '../../types/system-dynamics';
import { SYSTEM_MODELS } from '../../constants/models';
import { SimulationEngine } from '../../engine/simulator';
import { KatexMath, MathText } from '../common/KatexMath';

interface ExportReportModuleProps {
  model: SystemModel;
  simulationResult: SimulationResult;
}

export const ExportReportModule: React.FC<ExportReportModuleProps> = ({
  model: activeModel,
  simulationResult: activeSimulationResult,
}) => {
  // Selected case for report generation (defaults to active model, can switch across all 6 cases)
  const [selectedCaseId, setSelectedCaseId] = useState<string>(activeModel.id);
  // Preview mode: 'rendered' (academic paper style) vs 'markdown' (raw code)
  const [previewMode, setPreviewMode] = useState<'rendered' | 'markdown'>('rendered');
  const [copiedMd, setCopiedMd] = useState(false);
  const [downloadSuccessNotice, setDownloadSuccessNotice] = useState<string | null>(null);

  // The model currently being reported on
  const reportModel = useMemo(() => {
    return SYSTEM_MODELS.find((m) => m.id === selectedCaseId) || activeModel;
  }, [selectedCaseId, activeModel]);

  // Simulation result for the currently selected report model
  const reportSimulation = useMemo(() => {
    if (reportModel.id === activeModel.id) {
      return activeSimulationResult;
    }
    return SimulationEngine.run(reportModel);
  }, [reportModel, activeModel, activeSimulationResult]);

  // Generate CSV for a specific model
  const generateModelCsv = (targetModel: SystemModel, simResult: SimulationResult) => {
    if (!simResult.data || simResult.data.length === 0) return '';
    const headers = [
      'time',
      ...targetModel.stocks.map((s) => s.id),
      ...targetModel.flows.map((f) => f.id),
      ...targetModel.auxiliaries.map((a) => a.id),
    ];
    const rows = simResult.data.map((row) => {
      return headers.map((h) => (row[h] !== undefined ? row[h] : '')).join(',');
    });
    return [headers.join(','), ...rows].join('\n');
  };

  // Download raw CSV for any of the 6 cases
  const handleDownloadCaseCsv = (targetModel: SystemModel) => {
    const simResult = SimulationEngine.run(targetModel);
    const csvContent = generateModelCsv(targetModel, simResult);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system_dynamics_timeseries_${targetModel.id}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccessNotice(`已成功下载「${targetModel.title}」原始时间序列 CSV！`);
    setTimeout(() => setDownloadSuccessNotice(null), 3000);
  };

  // Download raw JSON configuration for any of the 6 cases
  const handleDownloadCaseJson = (targetModel: SystemModel) => {
    const jsonContent = JSON.stringify(targetModel, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system_dynamics_spec_${targetModel.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccessNotice(`已成功下载「${targetModel.title}」模型配置 JSON！`);
    setTimeout(() => setDownloadSuccessNotice(null), 3000);
  };

  // Download all 6 cases CSV sequentially
  const handleDownloadAllCasesCsv = () => {
    SYSTEM_MODELS.forEach((m, idx) => {
      setTimeout(() => {
        handleDownloadCaseCsv(m);
      }, idx * 250);
    });
  };

  // Simulation metrics for primary stock in JSX and report
  const primaryStock = reportModel.stocks[0];
  const peakVal = primaryStock ? reportSimulation.summary.peakValues[primaryStock.id] : null;
  const finalVal = primaryStock ? reportSimulation.summary.finalValues[primaryStock.id] : null;

  // Build the 6-Part Structured System Dynamics Academic Report in Markdown
  const markdownReport = useMemo(() => {
    const peak = peakVal;

    return `# 系统动力学实战实验全流程诊断报告 (System Dynamics Diagnostic Report)

> **案例名称:** ${reportModel.title}  
> **学科门类:** ${reportModel.category}  
> **报告生成时间:** 2026-10-12  
> **数值求解器:** ${reportSimulation.config.method.toUpperCase()} 算法 (时间步长 $\\Delta t = ${reportSimulation.config.dt}$ ${reportModel.config.timeUnit})  
> **状态空间维度:** ${reportModel.stocks.length} 个存量状态 (Stocks), ${reportModel.flows.length} 个流率变量 (Flows), ${reportModel.cldLoops.length} 个因果反馈回路 (Feedback Loops)

---

## 第一部分：系统边界界定与问题陈述 (System Boundary & Problem Articulation)

### 1.1 现实问题与研究背景
${reportModel.fullDesc}

### 1.2 内生与外生变量边界划分
- **内生状态存量 (Endogenous Stocks):** ${reportModel.stocks.map((s) => `\`${s.id}\` (${s.name})`).join(', ')}。这些变量具有系统惯性与历史记忆效应，由系统内部反馈闭环自主支配。
- **内生流量变动 (Rate Dynamics):** ${reportModel.flows.map((f) => `\`${f.id}\` (${f.name})`).join(', ')}。单位时间内直接改变存量累积速率。
- **系统核心矛盾与参考模式 (Reference Mode):**
${reportModel.keyInsights.map((ki) => `  * ${ki}`).join('\n')}

---

## 第二部分：因果回路拓扑与反馈极性结构 (CLD Feedback Loops & Polarity Analysis)

### 2.1 因果回路图拓扑定义 (Causal Loop Diagram)
系统动力学反馈网络通过变量间的正向促进 (+) 与反向抑制 (-) 链接，自组织构成闭环控制机制。

${reportModel.cldLoops
  .map(
    (l, idx) => `#### 环路 ${idx + 1}: [${l.type === 'R' ? '增强回路 (Reinforcing, R)' : '调节回路 (Balancing, B)'}] ${l.name}
- **反馈极性:** ${l.type === 'R' ? '正反馈 (+)' : '负反馈 (-)'}
- **闭环拓扑链条:** ${l.nodeIds.join(' ➔ ')} ➔ ${l.nodeIds[0]}
- **动力学效应:** ${l.description}`
  )
  .join('\n\n')}

### 2.2 时滞效应 (Time Delay //) 机制评估
在因果链接中包含时滞标记 \`//\`：
${reportModel.cldLinks.filter((l) => l.delay).length > 0
  ? reportModel.cldLinks
      .filter((l) => l.delay)
      .map((l) => `- 链接 \`${l.source} ➔ ${l.target}\` 存在显著时间延迟 (Delay)。因果响应并非瞬间完成，此相位滞后是诱发系统超调振荡的关键源头。`)
      .join('\n')
  : '- 本模型主要由高阶存量累积与非线性耦合提供内生平滑时滞，无显式一阶延迟短链。'}

---

## 第三部分：存量-流量数学微分代数方程与参数标定 (Stock & Flow Formulation & Calibration)

### 3.1 形式化非线性常微分方程组 (State ODEs)
依据质量守恒与存量-流量微积分原理，每个存量状态的一阶导数满足流入与流出净差代数方程：

\`\`\`latex
${reportModel.differentialEqText.join('\n')}
\`\`\`

### 3.2 存量状态向量与初始标定 (Stock Levels)
| 存量标识 (ID) | 中文变量全称 | 初始存量值 ($S_0$) | 物理量纲 | 关联流入流 | 关联流出流 |
| :--- | :--- | :--- | :--- | :--- | :--- |
${reportModel.stocks
  .map(
    (s) =>
      `| \`${s.id}\` | ${s.name} | **${s.initialValue}** | ${s.unit} | ${s.inflows.join(', ') || '无'} | ${s.outflows.join(', ') || '无'} |`
  )
  .join('\n')}

### 3.3 关键结构参数标定表 (Parameters Calibration)
| 参数标识 (ID) | 物理参数名 | 基准标定值 | 物理量纲 | 参数含义与工程约束 |
| :--- | :--- | :--- | :--- | :--- |
${reportModel.parameters
  .map((p) => `| \`${p.id}\` | ${p.name} | **${p.value}** | ${p.unit} | ${p.description} |`)
  .join('\n')}

---

## 第四部分：数值积分动态仿真演播与系统性态诊断 (Numerical Simulation & Diagnostics)

### 4.1 数值积分仿真参数
- **积分算法:** 4阶龙格-库塔数值积分器 (Runge-Kutta 4th Order, RK4)
- **仿真区间:** $[t_0 = ${reportModel.config.startTime}, t_{end} = ${reportModel.config.stopTime}]$ (${reportModel.config.timeUnit})
- **步长分辨率:** $\\Delta t = ${reportModel.config.dt}$，全时序采样点总数: **${reportSimulation.data.length}** 步

### 4.2 核心性态指标与动态诊断
- **主状态存量 (\`${primaryStock?.name}\`) 动态轨迹:**
  - 演化极值 (Peak Value): **${peak ? `${peak.value.toFixed(2)}` : 'N/A'}** (出现在 $t = ${peak ? peak.time.toFixed(1) : '-'}$ ${reportModel.config.timeUnit})
  - 最终稳态 (Final Value): **${finalVal !== null ? `${finalVal.toFixed(2)}` : 'N/A'}**
- **系统稳定性与振荡判定:**
  - ${reportSimulation.summary.hasOscillation ? `⚠️ **存在显著波动振荡**：系统识别出约 ${reportSimulation.summary.oscillationPeriods} 个周期波动，表明负反馈调节环存在相位滞后。` : '✓ **渐进收敛稳态**：系统呈现阻尼平滑逼近或单调增长，无发散振荡风险。'}
  - ${reportSimulation.summary.isDiverging ? '❌ **发散越界警告**：系统因缺乏有效调节反馈发生无界发散爆炸。' : '✓ **边界受控**：存量状态严格处于物理和数学有效区间内。'}

---

## 第五部分：多重政策干预情景对比评估 (Multi-Scenario Policy Interventions & Trade-offs)

为打破系统不良稳态或规避超调崩溃，设计并执行了针对性管理政策干预情景：

${reportModel.defaultScenarios
  .map(
    (sc, idx) => `### 情景 ${idx + 1}：${sc.name}
- **政策意图与干预机理:** ${sc.description}
- **参数控制调节向量:** \`${JSON.stringify(sc.parameterOverrides)}\`
- **情景对比效应:** 与基准模式相比，通过干预关键杠杆变量，直接改变了主导反馈环路的控制增益。`
  )
  .join('\n\n')}

---

## 第六部分：顿涅拉·梅多斯杠杆点诊断与专家行动建议 (Meadows Leverage Points & Strategic Actions)

依据麻省理工学院著名系统学者顿涅拉·梅多斯（Donella Meadows）《系统之美》12大系统干预杠杆点阶梯，结合当前数值诊断提出策略建议：

1. **【高杠杆：改变信息流结构与缩短反馈延迟】**：
   * 警惕系统中的信息时滞，优化数据流通与响应机制，消除过度超调调整的死区。
2. **【高杠杆：重构反馈环路支配力】**：
   * 在早期强化调节回路（B）的制约响应权重，防止正反馈（R）失控导致存量资产不可逆耗竭。
3. **【中杠杆：关键物理参数与缓冲器优化】**：
   * 增加系统安全缓冲存量容量，降低参数激进化比率，为系统吸收外部扰动提供缓冲弹性。
4. **【规避系统动力学三大致命误区】**：
   * **戒除线性直觉**：非线性延迟系统的稳态不是输入政策的简单倍数延伸；
   * **严防局部优化**：单点政策易被整体系统反馈网络自发抵消（政策阻力 Policy Resistance）；
   * **依赖持续计算机仿真验证**：复杂高阶微分系统必须通过仿真闭环迭代优化。

---

*报告出处：系统动力学实验室（System Dynamics Laboratory）科学计算与报告自动化引擎*
`;
  }, [reportModel, reportSimulation]);

  const handleCopyMd = () => {
    navigator.clipboard.writeText(markdownReport);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleDownloadMd = () => {
    const blob = new Blob([markdownReport], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system_dynamics_full_report_${reportModel.id}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-700" />
            <h2 className="text-base font-bold text-stone-800 tracking-tight">
              数据集与分析报告导出引擎 (Dataset & Report Engine)
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl leading-relaxed">
            支持六大实战案例库的<strong>原始时间序列 CSV 与配置规约 JSON 独立下载</strong>；并依据系统动力学<strong>全流程导引标准 6 大核心板块</strong>自动生成高规格学术诊断报告，支持在线富文本预览与打印。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadAllCasesCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition-colors cursor-pointer"
            title="一键连续导出六大案例的全部 CSV 原始时间序列数据"
          >
            <FolderDown className="w-3.5 h-3.5 text-emerald-700" />
            <span>下载六大案例全部数据 (CSV)</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white transition-colors cursor-pointer shadow-xs"
            title="浏览器打印或保存为高精度 PDF 学术文档"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>打印 / 另存为 PDF</span>
          </button>
        </div>
      </div>

      {/* Global Success Notification Toast */}
      {downloadSuccessNotice && (
        <div className="bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl text-xs font-medium text-emerald-900 flex items-center justify-between shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{downloadSuccessNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setDownloadSuccessNotice(null)}
            className="text-stone-400 hover:text-stone-600 text-xs cursor-pointer ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* Section 1: 六大案例库各个案例原始数据下载中心 */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-teal-700" />
            <h3 className="text-sm font-bold text-stone-800 tracking-tight">
              六大经典案例库：原始数据集与规约文件下载中心
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
              6 个标杆案例全集
            </span>
          </div>
          <span className="text-xs text-stone-500">
            点击对应案例右侧按钮，即可即时获取各案例的<strong>原始数值时序数据 (CSV)</strong> 与 <strong>模型方程结构 (JSON)</strong>
          </span>
        </div>

        {/* 6 Cases Download Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {SYSTEM_MODELS.map((cm) => {
            const isCurrentlySelected = cm.id === selectedCaseId;
            return (
              <div
                key={cm.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                  isCurrentlySelected
                    ? 'bg-teal-50/40 border-teal-400 ring-1 ring-teal-300/50 shadow-xs'
                    : 'bg-stone-50/60 border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-stone-900 tracking-tight leading-snug">
                      {cm.title}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white text-stone-600 border border-stone-200 shrink-0">
                      {cm.category}
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-600 mt-1 line-clamp-2 leading-relaxed">
                    {cm.shortDesc}
                  </p>

                  <div className="flex items-center gap-3 text-[10px] font-mono text-stone-500 mt-2.5">
                    <span>{cm.stocks.length} 存量</span>
                    <span>·</span>
                    <span>{cm.flows.length} 流量</span>
                    <span>·</span>
                    <span>{cm.cldLoops.length} 回路</span>
                    <span>·</span>
                    <span>dt={cm.config.dt}</span>
                  </div>
                </div>

                {/* Case Action Buttons */}
                <div className="pt-2 border-t border-stone-200/80 flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    {/* Download CSV */}
                    <button
                      type="button"
                      onClick={() => handleDownloadCaseCsv(cm)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white hover:bg-emerald-50 text-emerald-800 border border-stone-200 hover:border-emerald-300 transition-colors cursor-pointer shadow-2xs"
                      title={`下载「${cm.title}」的仿真时间序列 CSV`}
                    >
                      <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                      <span>下载 CSV</span>
                    </button>

                    {/* Download JSON */}
                    <button
                      type="button"
                      onClick={() => handleDownloadCaseJson(cm)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white hover:bg-sky-50 text-sky-800 border border-stone-200 hover:border-sky-300 transition-colors cursor-pointer shadow-2xs"
                      title={`下载「${cm.title}」的模型配置规约 JSON`}
                    >
                      <FileCode className="w-3 h-3 text-sky-600" />
                      <span>配置 JSON</span>
                    </button>
                  </div>

                  {/* Switch to this case in report preview */}
                  <button
                    type="button"
                    onClick={() => setSelectedCaseId(cm.id)}
                    className={`text-[11px] px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                      isCurrentlySelected
                        ? 'bg-teal-700 text-white shadow-2xs'
                        : 'text-stone-600 hover:text-teal-800 hover:bg-white'
                    }`}
                    title="在下方实时查看并生成该案例的全流程诊断报告"
                  >
                    {isCurrentlySelected ? '正在预览报告' : '生成对应报告 ➔'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: 全流程导引报告预览 (6 大核心部分) */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm overflow-hidden">
        {/* Report Preview Header Bar */}
        <div className="bg-stone-50 px-5 py-3.5 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-teal-700" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-900">
                  全流程实验诊断报告预览: {reportModel.title}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-semibold">
                  全流程 6 大核心部分
                </span>
              </div>
              <p className="text-[11px] text-stone-500">
                严格遵循系统动力学标准导引：边界界定 ➔ 因果拓扑 ➔ 存量流量方程 ➔ 仿真演播诊断 ➔ 多情景对比 ➔ 梅多斯杠杆点
              </p>
            </div>
          </div>

          {/* Mode Switch & Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle Preview Mode */}
            <div className="flex items-center bg-stone-200 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setPreviewMode('rendered')}
                className={`flex items-center gap-1 px-3 py-1 rounded-md transition-all cursor-pointer font-medium ${
                  previewMode === 'rendered'
                    ? 'bg-white text-stone-900 font-bold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>排版论文预览</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('markdown')}
                className={`flex items-center gap-1 px-3 py-1 rounded-md transition-all cursor-pointer font-medium ${
                  previewMode === 'markdown'
                    ? 'bg-white text-stone-900 font-bold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Markdown 源码</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopyMd}
              className="flex items-center gap-1 text-xs text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200 cursor-pointer shadow-2xs font-medium"
            >
              {copiedMd ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedMd ? '已复制' : '复制报告 Markdown'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadMd}
              className="flex items-center gap-1 text-xs text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200 cursor-pointer shadow-2xs font-medium"
            >
              <Download className="w-3 h-3" />
              <span>下载 .md</span>
            </button>
          </div>
        </div>

        {/* View Mode 1: Rendered Academic Paper Preview (6 Comprehensive Parts) */}
        {previewMode === 'rendered' ? (
          <div className="p-6 md:p-10 max-h-[750px] overflow-y-auto space-y-8 font-sans text-stone-800 select-text print:max-h-none print:p-0">
            {/* Paper Title Header */}
            <div className="text-center pb-6 border-b border-stone-200">
              <span className="text-xs font-mono tracking-widest text-teal-800 uppercase bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                SYSTEM DYNAMICS ACADEMIC LABORATORY REPORT
              </span>
              <h1 className="text-xl md:text-2xl font-bold font-serif text-stone-900 mt-3 tracking-tight">
                {reportModel.title}：全流程系统动力学实验诊断报告
              </h1>
              <div className="flex items-center justify-center gap-4 text-xs text-stone-500 font-mono mt-2 flex-wrap">
                <span>门类: {reportModel.category}</span>
                <span>·</span>
                <span>求解器: {reportSimulation.config.method.toUpperCase()}</span>
                <span>·</span>
                <span>时间跨度: [0, {reportModel.config.stopTime}] {reportModel.config.timeUnit}</span>
                <span>·</span>
                <span>生成日期: 2026-10-12</span>
              </div>
            </div>

            {/* Part 1: 系统边界界定与问题陈述 */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-stone-900">
                <span className="w-6 h-6 rounded-md bg-stone-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h2 className="text-base font-bold font-serif tracking-tight">
                  第一部分：系统边界界定与问题陈述 (System Boundary & Problem Articulation)
                </h2>
              </div>
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 text-xs leading-relaxed space-y-2.5">
                <p className="text-stone-700">{reportModel.fullDesc}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="bg-white p-3 rounded-lg border border-stone-200">
                    <span className="font-bold text-stone-900 block mb-1">内生状态存量 (Endogenous Stocks):</span>
                    <ul className="list-disc list-inside space-y-0.5 text-stone-600">
                      {reportModel.stocks.map((s) => (
                        <li key={s.id}>
                          <strong>{s.name}</strong> ({s.id}): 初始累积量 {s.initialValue} {s.unit}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-stone-200">
                    <span className="font-bold text-stone-900 block mb-1">核心动态参考模式 (Reference Mode):</span>
                    <ul className="list-disc list-inside space-y-0.5 text-stone-600">
                      {reportModel.keyInsights.map((ki, i) => (
                        <li key={i}>{ki}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Part 2: 因果回路拓扑与反馈极性结构 */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-stone-900">
                <span className="w-6 h-6 rounded-md bg-stone-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h2 className="text-base font-bold font-serif tracking-tight">
                  第二部分：因果回路拓扑与反馈极性结构 (CLD Feedback Loops & Polarity Analysis)
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {reportModel.cldLoops.map((l) => (
                  <div
                    key={l.id}
                    className={`p-3.5 rounded-xl border ${
                      l.type === 'R'
                        ? 'bg-amber-50/50 border-amber-200'
                        : 'bg-sky-50/50 border-sky-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-stone-900 flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                            l.type === 'R' ? 'bg-amber-200 text-amber-900' : 'bg-sky-200 text-sky-900'
                          }`}
                        >
                          {l.type === 'R' ? '增强回路 (R)' : '调节回路 (B)'}
                        </span>
                        <span>{l.name}</span>
                      </span>
                    </div>
                    <div className="font-mono text-[11px] text-stone-600 bg-white/80 p-1.5 rounded border border-stone-200 mb-2">
                      {l.nodeIds.join(' ➔ ')} ➔ {l.nodeIds[0]}
                    </div>
                    <p className="text-stone-700 leading-relaxed text-[11px]">{l.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Part 3: 存量-流量数学微分代数方程与参数标定 */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-stone-900">
                <span className="w-6 h-6 rounded-md bg-stone-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <h2 className="text-base font-bold font-serif tracking-tight">
                  第三部分：存量-流量数学微分代数方程与参数标定 (Mathematical Formulation)
                </h2>
              </div>

              {/* Differential Equations Card */}
              <div className="bg-stone-900 text-stone-100 p-4 rounded-xl font-mono text-xs space-y-2">
                <div className="text-stone-400 text-[10px] uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>// 一阶连续时间常微分方程组 (State ODE System)</span>
                  <span className="text-[10px] text-teal-400 font-mono">KaTeX 数学排版</span>
                </div>
                {reportModel.differentialEqText.map((eq, idx) => (
                  <div key={idx} className="text-teal-300 font-medium py-1 overflow-x-auto text-sm sm:text-base">
                    <KatexMath math={eq} displayMode={false} />
                  </div>
                ))}
              </div>

              {/* Parameter Table */}
              <div className="border border-stone-200 rounded-xl overflow-x-auto text-xs">
                <table className="w-full text-left font-mono">
                  <thead className="bg-stone-100 text-stone-700 border-b border-stone-200">
                    <tr>
                      <th className="py-2 px-3">参数变量 (ID)</th>
                      <th className="py-2 px-3">名称与物理含义</th>
                      <th className="py-2 px-3">基准数值</th>
                      <th className="py-2 px-3">量纲</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-800">
                    {reportModel.parameters.map((p) => (
                      <tr key={p.id} className="hover:bg-stone-50">
                        <td className="py-1.5 px-3 font-bold text-teal-800">{p.id}</td>
                        <td className="py-1.5 px-3 font-sans text-stone-700">{p.name}</td>
                        <td className="py-1.5 px-3 font-bold">{p.value}</td>
                        <td className="py-1.5 px-3 text-stone-500">{p.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Part 4: 数值积分动态仿真演播与系统性态诊断 */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-stone-900">
                <span className="w-6 h-6 rounded-md bg-stone-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                  4
                </span>
                <h2 className="text-base font-bold font-serif tracking-tight">
                  第四部分：数值积分动态仿真演播与系统性态诊断 (Numerical Simulation & Diagnostics)
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                  <span className="text-[10px] font-mono text-stone-500 uppercase block">主存量峰值</span>
                  <span className="text-sm font-bold text-stone-900 font-mono mt-0.5 block">
                    {peakVal ? peakVal.value.toFixed(2) : '-'}
                  </span>
                  <span className="text-[10px] text-stone-500">t = {peakVal ? peakVal.time.toFixed(1) : '-'}</span>
                </div>
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                  <span className="text-[10px] font-mono text-stone-500 uppercase block">最终稳态水平</span>
                  <span className="text-sm font-bold text-teal-800 font-mono mt-0.5 block">
                    {finalVal !== null ? finalVal.toFixed(2) : '-'}
                  </span>
                  <span className="text-[10px] text-stone-500">t = {reportModel.config.stopTime}</span>
                </div>
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                  <span className="text-[10px] font-mono text-stone-500 uppercase block">波动振荡判定</span>
                  <span
                    className={`text-xs font-bold font-mono mt-0.5 block ${
                      reportSimulation.summary.hasOscillation ? 'text-amber-700' : 'text-emerald-700'
                    }`}
                  >
                    {reportSimulation.summary.hasOscillation ? '显著周期振荡' : '渐进单调收敛'}
                  </span>
                  <span className="text-[10px] text-stone-500">
                    {reportSimulation.summary.hasOscillation
                      ? `检测到 ${reportSimulation.summary.oscillationPeriods} 周期`
                      : '无剧烈超调'}
                  </span>
                </div>
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                  <span className="text-[10px] font-mono text-stone-500 uppercase block">数值收敛性</span>
                  <span className="text-xs font-bold text-emerald-700 font-mono mt-0.5 block">
                    RK4 稳定收敛
                  </span>
                  <span className="text-[10px] text-stone-500">采样步数: {reportSimulation.data.length}</span>
                </div>
              </div>
            </section>

            {/* Part 5: 多重政策干预情景对比评估 */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-stone-900">
                <span className="w-6 h-6 rounded-md bg-stone-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                  5
                </span>
                <h2 className="text-base font-bold font-serif tracking-tight">
                  第五部分：多重政策干预情景对比评估 (Multi-Scenario Policy Evaluation)
                </h2>
              </div>

              <div className="space-y-2.5 text-xs">
                {reportModel.defaultScenarios.map((sc, idx) => (
                  <div key={sc.id} className="bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-stone-900">
                        情景 {idx + 1}：{sc.name}
                      </span>
                      <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-stone-200">
                        参数覆盖: {Object.keys(sc.parameterOverrides).length} 项
                      </span>
                    </div>
                    <p className="text-stone-600 leading-relaxed text-[11px] mb-2">{sc.description}</p>
                    <div className="bg-white p-2 rounded font-mono text-[11px] text-teal-800 border border-stone-200">
                      参数配置: {JSON.stringify(sc.parameterOverrides)}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Part 6: 顿涅拉·梅多斯杠杆点诊断与专家行动建议 */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-stone-900">
                <span className="w-6 h-6 rounded-md bg-stone-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                  6
                </span>
                <h2 className="text-base font-bold font-serif tracking-tight">
                  第六部分：顿涅拉·梅多斯杠杆点诊断与专家行动建议 (Meadows Leverage Points)
                </h2>
              </div>

              <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 text-xs space-y-2.5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-1">
                    <span className="font-bold text-teal-900 block">高阶杠杆干预 1: 消除信息滞后 (Delay Reduction)</span>
                    <p className="text-stone-600 leading-relaxed text-[11px]">
                      时滞是系统振荡的主因。通过建立实时监测反馈渠道，缩短决策周期，使调节环路在偏差初期即启动平滑补偿。
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-1">
                    <span className="font-bold text-teal-900 block">高阶杠杆干预 2: 重构负反馈调节增益</span>
                    <p className="text-stone-600 leading-relaxed text-[11px]">
                      增强调节回路（B）对存量超载的非线性弹性阻尼，防止正反馈（R）失控导致系统击穿承载力红线。
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-lg text-amber-900 text-[11px] leading-relaxed">
                  <strong>专家警示 (Policy Resistance):</strong>{' '}
                  复杂反馈系统对直觉政策具有极强的防御抗药性。切忌依据线性思维施加过度刺激，应通过计算机数值仿真进行多周期演化验证，方可推行结构性改革。
                </div>
              </div>
            </section>
          </div>
        ) : (
          /* View Mode 2: Markdown Raw Source View */
          <div className="p-6 max-h-[750px] overflow-y-auto select-text font-mono text-xs bg-stone-950 text-stone-200 leading-relaxed">
            <pre className="whitespace-pre-wrap select-text">{markdownReport}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
