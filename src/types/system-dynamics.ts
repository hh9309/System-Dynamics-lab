/**
 * System Dynamics Core Types and Schema
 */

export type VariableType = 'stock' | 'flow' | 'auxiliary' | 'parameter';

export interface CldNode {
  id: string;
  name: string;
  type: VariableType;
  x: number;
  y: number;
  description?: string;
}

export interface CldLink {
  id: string;
  source: string;
  target: string;
  polarity: '+' | '-';
  delay: boolean; // whether this link has information or material delay
  comment?: string;
}

export interface CldLoop {
  id: string;
  type: 'R' | 'B'; // Reinforcing or Balancing
  name: string;
  nodeIds: string[];
  description: string;
}

export interface StockVar {
  id: string;
  name: string;
  initialValue: number;
  unit: string;
  inflows: string[];  // ids of incoming flows
  outflows: string[]; // ids of outgoing flows
  nonNegative?: boolean;
  description?: string;
  x?: number;
  y?: number;
}

export interface FlowVar {
  id: string;
  name: string;
  equation: string;
  unit: string;
  fromStockId: string | null; // null for source cloud
  toStockId: string | null;   // null for sink cloud
  nonNegative?: boolean;
  description?: string;
  x?: number;
  y?: number;
}

export interface AuxiliaryVar {
  id: string;
  name: string;
  equation: string;
  unit: string;
  description?: string;
  x?: number;
  y?: number;
}

export interface ParameterVar {
  id: string;
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  description?: string;
}

export interface SimulationConfig {
  startTime: number;
  stopTime: number;
  dt: number;
  method: 'euler' | 'rk4';
  timeUnit: string;
}

export interface SimulationDataPoint {
  time: number;
  [variableId: string]: number;
}

export interface SimulationSummary {
  peakValues: Record<string, { value: number; time: number }>;
  minValues: Record<string, { value: number; time: number }>;
  finalValues: Record<string, number>;
  hasOscillation: boolean;
  oscillationPeriods?: number;
  isDiverging: boolean;
}

export interface SimulationResult {
  timeline: number[];
  data: SimulationDataPoint[];
  summary: SimulationSummary;
  config: SimulationConfig;
}

export interface PolicyScenario {
  id: string;
  name: string;
  description: string;
  color: string;
  parameterOverrides: Record<string, number>;
  stockOverrides?: Record<string, number>;
}

export interface SystemModel {
  id: string;
  title: string;
  category: string;
  shortDesc: string;
  fullDesc: string;
  keyInsights: string[];
  stocks: StockVar[];
  flows: FlowVar[];
  auxiliaries: AuxiliaryVar[];
  parameters: ParameterVar[];
  cldNodes: CldNode[];
  cldLinks: CldLink[];
  cldLoops: CldLoop[];
  config: SimulationConfig;
  defaultScenarios: PolicyScenario[];
  differentialEqText: string[];
  algebraicStructure: {
    stateVector: string[];
    rateVector: string[];
    parameterVector: string[];
    feedbackMatrixDesc: string;
  };
}
