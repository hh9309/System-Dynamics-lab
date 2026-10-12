/**
 * 系统动力学 WebApp 实验室：因果反馈、存量流量与动态仿真
 * System Dynamics WebApp Laboratory
 */

import React, { useState, useMemo, useCallback } from 'react';
import { SYSTEM_MODELS } from './constants/models';
import { SystemModel, SimulationConfig, SimulationResult, VariableType } from './types/system-dynamics';
import { SimulationEngine } from './engine/simulator';
import { Header } from './components/Header';
import { WorkflowBar, MainTabType } from './components/WorkflowBar';
import { CldEditorModule } from './components/modules/CldEditorModule';
import { StockFlowModule } from './components/modules/StockFlowModule';
import { SimulationModule } from './components/modules/SimulationModule';
import { ScenarioComparisonModule } from './components/modules/ScenarioComparisonModule';
import { AlgebraModule } from './components/modules/AlgebraModule';
import { CaseLibraryModule } from './components/modules/CaseLibraryModule';
import { PythonEngineModule } from './components/modules/PythonEngineModule';
import { ExportReportModule } from './components/modules/ExportReportModule';
import { KnowledgeSlicesModule } from './components/modules/KnowledgeSlicesModule';
import { AiDiagnosisModal } from './components/ai/AiDiagnosisModal';

export default function App() {
  // Active Model State
  const [activeModel, setActiveModel] = useState<SystemModel>(SYSTEM_MODELS[0]);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('baseline');
  const [activeTab, setActiveTab] = useState<MainTabType>('cld');

  // Parameter & Initial overrides (custom modifications by user)
  const [paramOverrides, setParamOverrides] = useState<Record<string, number>>({});
  const [stockOverrides, setStockOverrides] = useState<Record<string, number>>({});
  const [configOverride, setConfigOverride] = useState<Partial<SimulationConfig>>({});

  // Modals state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // When model changes, reset overrides and scenario
  const handleSelectModel = useCallback((newModel: SystemModel) => {
    setActiveModel(newModel);
    setActiveScenarioId(newModel.defaultScenarios[0]?.id || 'baseline');
    setParamOverrides({});
    setStockOverrides({});
    setConfigOverride({});
  }, []);

  // When scenario changes, apply its overrides
  const handleSelectScenario = useCallback((scenarioId: string) => {
    setActiveScenarioId(scenarioId);
    const scenario = activeModel.defaultScenarios.find((s) => s.id === scenarioId);
    if (scenario) {
      setParamOverrides(scenario.parameterOverrides || {});
      if (scenario.stockOverrides) {
        setStockOverrides(scenario.stockOverrides);
      }
    } else {
      setParamOverrides({});
      setStockOverrides({});
    }
  }, [activeModel]);

  // Update initial stock value
  const handleUpdateStockInitial = useCallback((stockId: string, val: number) => {
    setStockOverrides((prev) => ({
      ...prev,
      [stockId]: val,
    }));
  }, []);

  // Update flow rate equation
  const handleUpdateFlowEquation = useCallback((flowId: string, eq: string) => {
    setActiveModel((prev) => ({
      ...prev,
      flows: prev.flows.map((f) => (f.id === flowId ? { ...f, equation: eq } : f)),
    }));
  }, []);

  // Update parameter value
  const handleUpdateParamValue = useCallback((paramId: string, val: number) => {
    setParamOverrides((prev) => ({
      ...prev,
      [paramId]: val,
    }));
  }, []);

  // Update simulation config
  const handleUpdateConfig = useCallback((cfg: SimulationConfig) => {
    setConfigOverride(cfg);
  }, []);

  // Reactive simulation calculation
  const simulationResult: SimulationResult = useMemo(() => {
    return SimulationEngine.run(activeModel, configOverride, paramOverrides, stockOverrides);
  }, [activeModel, configOverride, paramOverrides, stockOverrides]);

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* Top Header */}
      <Header
        models={SYSTEM_MODELS}
        activeModel={activeModel}
        onSelectModel={handleSelectModel}
        activeScenarioId={activeScenarioId}
        onSelectScenario={handleSelectScenario}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onOpenReportModal={() => setActiveTab('report')}
        onSelectTab={(tabId) => setActiveTab(tabId as MainTabType)}
        activeTab={activeTab}
      />

      {/* Workflow Navigation Bar */}
      <WorkflowBar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Module 1: 结构代数与微分建模 */}
        {activeTab === 'algebra' && <AlgebraModule model={activeModel} />}

        {/* Module 2: 因果回路图 (CLD) 交互编辑器 */}
        {activeTab === 'cld' && <CldEditorModule model={activeModel} />}

        {/* Module 3: 存量-流量 (SFD) 模型构建 */}
        {activeTab === 'stockflow' && (
          <StockFlowModule
            model={activeModel}
            onUpdateStockInitial={handleUpdateStockInitial}
            onUpdateFlowEquation={handleUpdateFlowEquation}
            onUpdateParamValue={handleUpdateParamValue}
          />
        )}

        {/* Module 4: 动态仿真引擎与时间轴演播 */}
        {activeTab === 'simulation' && (
          <SimulationModule
            model={activeModel}
            simulationResult={simulationResult}
            onUpdateConfig={handleUpdateConfig}
          />
        )}

        {/* Module 8: 多情景策略对比 */}
        {activeTab === 'scenarios' && <ScenarioComparisonModule model={activeModel} />}

        {/* Module 5: 六大经典案例库 */}
        {activeTab === 'cases' && (
          <CaseLibraryModule
            models={SYSTEM_MODELS}
            activeModel={activeModel}
            onSelectModel={handleSelectModel}
            onNavigateToSimulation={() => setActiveTab('simulation')}
          />
        )}

        {/* Module 6: Python / SciPy 仿真代码引擎 */}
        {activeTab === 'python' && <PythonEngineModule model={activeModel} />}

        {/* Module 9: 数据集与分析报告导出 */}
        {activeTab === 'report' && (
          <ExportReportModule model={activeModel} simulationResult={simulationResult} />
        )}

        {/* Module 10: 机制知识切片与导引 */}
        {activeTab === 'knowledge' && <KnowledgeSlicesModule />}
      </main>

      {/* AI Diagnosis Floating Modal */}
      <AiDiagnosisModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        model={activeModel}
        simulationResult={simulationResult}
      />

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 border-t border-stone-800 py-8 px-4 sm:px-6 text-xs font-sans mt-12 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <div className="font-serif font-bold text-stone-200 text-sm">
              系统动力学实验室 (System Dynamics Laboratory)
            </div>
            <p className="text-[11px] text-stone-500">
              基于 Jay Forrester (1961) 工业动力学理论与 Donella Meadows (1972) 复杂系统反馈原则设计
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-stone-400 font-mono">
            <span>微分算法: Runge-Kutta 4 / Euler</span>
            <span>·</span>
            <span>因果图: 自动回路探测 (R/B)</span>
            <span>·</span>
            <span>仿真引擎: 连续时间数值积分</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
