/**
 * System Dynamics Numerical Simulation Engine
 * Implements Euler and 4th-Order Runge-Kutta (RK4) integration algorithms.
 */

import {
  SystemModel,
  SimulationConfig,
  SimulationResult,
  SimulationDataPoint,
  SimulationSummary,
  PolicyScenario,
} from '../types/system-dynamics';
import { evaluateExpression, EvaluationContext } from './evaluator';

export class SimulationEngine {
  /**
   * Run simulation for a given model with optional parameter overrides
   */
  static run(
    model: SystemModel,
    overrideConfig?: Partial<SimulationConfig>,
    paramOverrides?: Record<string, number>,
    stockOverrides?: Record<string, number>
  ): SimulationResult {
    const config: SimulationConfig = {
      ...model.config,
      ...overrideConfig,
    };

    const dt = Math.max(0.0001, config.dt);
    const steps = Math.round((config.stopTime - config.startTime) / dt);
    const timeline: number[] = [];
    const data: SimulationDataPoint[] = [];

    // Initialize parameters
    const params: Record<string, number> = {};
    for (const p of model.parameters) {
      params[p.id] = paramOverrides && paramOverrides[p.id] !== undefined ? paramOverrides[p.id] : p.value;
    }

    // Initialize stocks
    let currentStocks: Record<string, number> = {};
    for (const s of model.stocks) {
      currentStocks[s.id] =
        stockOverrides && stockOverrides[s.id] !== undefined ? stockOverrides[s.id] : s.initialValue;
    }

    // Delay internal memory cache (for delay1 / smooth pipelines)
    const delayMemory: Record<string, number> = {};

    // Helper to evaluate auxiliaries given stocks & params
    const computeAuxiliaries = (t: number, stocks: Record<string, number>): Record<string, number> => {
      const auxVals: Record<string, number> = {};
      const ctx: EvaluationContext = {
        t,
        dt,
        ...params,
        ...stocks,
        ...auxVals,
      };

      // Multi-pass evaluation to resolve topological ordering of auxiliaries
      for (let pass = 0; pass < 3; pass++) {
        for (const aux of model.auxiliaries) {
          ctx[aux.id] = auxVals[aux.id] || 0;
          const val = evaluateExpression(aux.equation, ctx);
          auxVals[aux.id] = val;
          ctx[aux.id] = val;
        }
      }
      return auxVals;
    };

    // Helper to evaluate flows given stocks, auxiliaries & params
    const computeFlows = (
      t: number,
      stocks: Record<string, number>,
      auxiliaries: Record<string, number>
    ): Record<string, number> => {
      const flowVals: Record<string, number> = {};
      const ctx: EvaluationContext = {
        t,
        dt,
        ...params,
        ...stocks,
        ...auxiliaries,
        ...delayMemory,
      };

      for (const flow of model.flows) {
        let rate = evaluateExpression(flow.equation, ctx);
        // Non-negative constraint if applicable
        if (flow.nonNegative && rate < 0) {
          rate = 0;
        }
        // Flow drain protection: don't drain empty stock below zero
        if (flow.fromStockId && stocks[flow.fromStockId] !== undefined) {
          const availableStock = stocks[flow.fromStockId];
          if (availableStock <= 0 && rate > 0) {
            rate = 0;
          }
        }
        flowVals[flow.id] = rate;
        ctx[flow.id] = rate;
      }
      return flowVals;
    };

    // Helper to compute net derivatives dS/dt for all stocks
    const computeDerivatives = (
      t: number,
      stocks: Record<string, number>
    ): { dStocks: Record<string, number>; flows: Record<string, number>; aux: Record<string, number> } => {
      const aux = computeAuxiliaries(t, stocks);
      const flows = computeFlows(t, stocks, aux);
      const dStocks: Record<string, number> = {};

      for (const stock of model.stocks) {
        let netRate = 0;
        // Add inflows
        for (const inId of stock.inflows) {
          if (flows[inId] !== undefined) {
            netRate += flows[inId];
          }
        }
        // Subtract outflows
        for (const outId of stock.outflows) {
          if (flows[outId] !== undefined) {
            netRate -= flows[outId];
          }
        }
        dStocks[stock.id] = netRate;
      }

      return { dStocks, flows, aux };
    };

    let currentTime = config.startTime;

    for (let i = 0; i <= steps; i++) {
      timeline.push(Number(currentTime.toFixed(4)));

      if (config.method === 'rk4') {
        // Runge-Kutta 4th Order Integration
        const k1 = computeDerivatives(currentTime, currentStocks);

        // Record current state before advancing
        const dataPoint: SimulationDataPoint = {
          time: Number(currentTime.toFixed(4)),
          ...currentStocks,
          ...k1.aux,
          ...k1.flows,
          ...params,
        };
        data.push(dataPoint);

        if (i === steps) break;

        // k2 evaluation
        const stocksK2: Record<string, number> = {};
        for (const s of model.stocks) {
          stocksK2[s.id] = currentStocks[s.id] + 0.5 * dt * k1.dStocks[s.id];
          if (s.nonNegative && stocksK2[s.id] < 0) stocksK2[s.id] = 0;
        }
        const k2 = computeDerivatives(currentTime + 0.5 * dt, stocksK2);

        // k3 evaluation
        const stocksK3: Record<string, number> = {};
        for (const s of model.stocks) {
          stocksK3[s.id] = currentStocks[s.id] + 0.5 * dt * k2.dStocks[s.id];
          if (s.nonNegative && stocksK3[s.id] < 0) stocksK3[s.id] = 0;
        }
        const k3 = computeDerivatives(currentTime + 0.5 * dt, stocksK3);

        // k4 evaluation
        const stocksK4: Record<string, number> = {};
        for (const s of model.stocks) {
          stocksK4[s.id] = currentStocks[s.id] + dt * k3.dStocks[s.id];
          if (s.nonNegative && stocksK4[s.id] < 0) stocksK4[s.id] = 0;
        }
        const k4 = computeDerivatives(currentTime + dt, stocksK4);

        // Next stocks
        const nextStocks: Record<string, number> = {};
        for (const s of model.stocks) {
          const delta = (dt / 6) * (k1.dStocks[s.id] + 2 * k2.dStocks[s.id] + 2 * k3.dStocks[s.id] + k4.dStocks[s.id]);
          let newVal = currentStocks[s.id] + delta;
          if (s.nonNegative && newVal < 0) newVal = 0;
          nextStocks[s.id] = newVal;
        }
        currentStocks = nextStocks;
      } else {
        // Forward Euler Integration
        const evalRes = computeDerivatives(currentTime, currentStocks);

        // Record current state
        const dataPoint: SimulationDataPoint = {
          time: Number(currentTime.toFixed(4)),
          ...currentStocks,
          ...evalRes.aux,
          ...evalRes.flows,
          ...params,
        };
        data.push(dataPoint);

        if (i === steps) break;

        // Step stocks forward
        const nextStocks: Record<string, number> = {};
        for (const s of model.stocks) {
          let newVal = currentStocks[s.id] + dt * evalRes.dStocks[s.id];
          if (s.nonNegative && newVal < 0) newVal = 0;
          nextStocks[s.id] = newVal;
        }
        currentStocks = nextStocks;
      }

      currentTime += dt;
    }

    const summary = this.computeSummary(model, data);

    return {
      timeline,
      data,
      summary,
      config,
    };
  }

  /**
   * Run multiple scenarios for side-by-side comparison
   */
  static runScenarios(
    model: SystemModel,
    scenarios: PolicyScenario[]
  ): Record<string, SimulationResult> {
    const results: Record<string, SimulationResult> = {};
    for (const sc of scenarios) {
      results[sc.id] = this.run(model, undefined, sc.parameterOverrides, sc.stockOverrides);
    }
    return results;
  }

  /**
   * Analyze simulation trajectory characteristics
   */
  private static computeSummary(model: SystemModel, data: SimulationDataPoint[]): SimulationSummary {
    const peakValues: Record<string, { value: number; time: number }> = {};
    const minValues: Record<string, { value: number; time: number }> = {};
    const finalValues: Record<string, number> = {};

    if (data.length === 0) {
      return {
        peakValues,
        minValues,
        finalValues,
        hasOscillation: false,
        isDiverging: false,
      };
    }

    const keysToTrack = [
      ...model.stocks.map((s) => s.id),
      ...model.flows.map((f) => f.id),
      ...model.auxiliaries.map((a) => a.id),
    ];

    for (const key of keysToTrack) {
      let maxVal = -Infinity;
      let maxTime = 0;
      let minVal = Infinity;
      let minTime = 0;

      for (const pt of data) {
        const val = pt[key] ?? 0;
        if (val > maxVal) {
          maxVal = val;
          maxTime = pt.time;
        }
        if (val < minVal) {
          minVal = val;
          minTime = pt.time;
        }
      }

      peakValues[key] = { value: maxVal, time: maxTime };
      minValues[key] = { value: minVal, time: minTime };
      finalValues[key] = data[data.length - 1][key] ?? 0;
    }

    // Detect oscillation in primary stock variable
    let hasOscillation = false;
    let oscillationPeriods = 0;
    let isDiverging = false;

    if (model.stocks.length > 0) {
      const primaryStockKey = model.stocks[0].id;
      const values = data.map((d) => d[primaryStockKey]);
      let localPeaks = 0;

      for (let i = 1; i < values.length - 1; i++) {
        if (values[i] > values[i - 1] && values[i] > values[i + 1]) {
          localPeaks++;
        }
      }

      if (localPeaks >= 2) {
        hasOscillation = true;
        oscillationPeriods = localPeaks;
      }

      // Check divergence
      const lastVal = values[values.length - 1];
      if (Math.abs(lastVal) > 1e9 || isNaN(lastVal)) {
        isDiverging = true;
      }
    }

    return {
      peakValues,
      minValues,
      finalValues,
      hasOscillation,
      oscillationPeriods,
      isDiverging,
    };
  }
}
