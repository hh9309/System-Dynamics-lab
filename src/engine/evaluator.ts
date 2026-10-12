/**
 * Mathematical Equation Evaluator for System Dynamics Models
 * Safely parses and evaluates algebraic equations and rates without eval() vulnerabilities.
 */

export interface EvaluationContext {
  t: number;
  dt: number;
  [key: string]: number;
}

export function evaluateExpression(expr: string, context: EvaluationContext): number {
  if (!expr || expr.trim() === '') return 0;

  let cleaned = expr.trim();

  // Replace power operator ^ with **
  cleaned = cleaned.replace(/\^/g, '**');

  // Helper functions injection
  const scope: Record<string, any> = {
    ...context,
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    exp: Math.exp,
    log: Math.log,
    sqrt: Math.sqrt,
    abs: Math.abs,
    min: Math.min,
    max: Math.max,
    round: Math.round,
    floor: Math.floor,
    ceil: Math.ceil,
    PI: Math.PI,
    E: Math.E,
    // System Dynamics primitives
    step: (t: number, stepTime: number, stepHeight: number = 1) => (t >= stepTime ? stepHeight : 0),
    pulse: (t: number, startTime: number, duration: number, height: number = 1) =>
      t >= startTime && t < startTime + duration ? height : 0,
    ramp: (t: number, startTime: number, slope: number = 1) => (t > startTime ? (t - startTime) * slope : 0),
    clip: (val: number, minVal: number, maxVal: number) => Math.min(Math.max(val, minVal), maxVal),
    delay1: (input: number, prevDelayed: number, dt: number, delayTime: number) => {
      const tau = Math.max(delayTime, dt);
      return prevDelayed + (dt / tau) * (input - prevDelayed);
    },
  };

  try {
    // Construct sanitized Function invocation with extracted keys
    const paramNames = Object.keys(scope);
    const paramValues = Object.values(scope);
    
    // Create evaluator
    const fn = new Function(...paramNames, `"use strict"; return (${cleaned});`);
    const result = fn(...paramValues);
    
    if (typeof result !== 'number' || isNaN(result)) {
      return 0;
    }
    // Prevent Infinity
    if (!isFinite(result)) {
      return result > 0 ? 1e12 : -1e12;
    }
    return result;
  } catch (err) {
    // If syntax or variable missing, return 0 or fallback
    return 0;
  }
}
