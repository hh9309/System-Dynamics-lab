/**
 * Python / SciPy System Dynamics Simulation Code Generator
 * Produces clean, executable scientific Python scripts using scipy.integrate.odeint & matplotlib.
 * All plot titles, axis labels, and legends are strictly in English as requested.
 * Guaranteed standalone execution in Spyder, Jupyter, Google Colab, VSCode, and standard Python.
 */

import { SystemModel } from '../types/system-dynamics';

export function generatePythonScript(model: SystemModel): string {
  const stockIds = model.stocks.map((s) => s.id);
  const paramIds = model.parameters.map((p) => p.id);

  // Map English model title
  const englishTitles: Record<string, string> = {
    'population-carrying-capacity': 'Population Growth and Carrying Capacity Model',
    'supply-chain-bullwhip': 'Supply Chain Bullwhip Effect Dynamics',
    'urbanization-pollution': 'Urbanization Dynamics and Pollution Limit Model',
    'sir-epidemic-dynamics': 'Epidemic Diffusion (SIR) Dynamics Model',
    'brooks-law-project': "Brooks's Law and Project Staffing Crunch Dynamics",
    'carbon-neutrality-macro': 'Macroeconomic Carbon Neutrality Transition Dynamics',
  };

  const englishTitle = englishTitles[model.id] || model.id.replace(/-/g, ' ').toUpperCase();

  // Map time units to English
  const timeUnitMap: Record<string, string> = {
    '年 (Years)': 'Years',
    '周 (Weeks)': 'Weeks',
    '天 (Days)': 'Days',
  };
  const englishTimeUnit = timeUnitMap[model.config.timeUnit] || 'Time Units';

  // Robustly convert JavaScript / algebraic expressions to valid Python / NumPy expressions
  const toPythonExpr = (rawExpr: string): string => {
    let expr = rawExpr.trim();

    // Convert JS ternary: `cond ? if_true : if_false`
    // e.g. `schedule_gap > 0 ? emergency_hire_rate : 0.2` -> `(emergency_hire_rate if schedule_gap > 0 else 0.2)`
    const ternaryMatch = expr.match(/^(.+?)\s*\?\s*(.+?)\s*:\s*(.+)$/);
    if (ternaryMatch) {
      const cond = toPythonExpr(ternaryMatch[1]);
      const ifTrue = toPythonExpr(ternaryMatch[2]);
      const ifFalse = toPythonExpr(ternaryMatch[3]);
      return `(${ifTrue} if ${cond} else ${ifFalse})`;
    }

    return expr
      .replace(/\bMath\.exp\b/g, 'np.exp')
      .replace(/\bMath\.sin\b/g, 'np.sin')
      .replace(/\bMath\.cos\b/g, 'np.cos')
      .replace(/\bMath\.min\b/g, 'min')
      .replace(/\bMath\.max\b/g, 'max')
      .replace(/\bMath\.log\b/g, 'np.log')
      .replace(/\bMath\.sqrt\b/g, 'np.sqrt')
      .replace(/\bsqrt\b/g, 'np.sqrt')
      .replace(/\bstep\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/g, '($3 if $1 >= $2 else 0.0)')
      .replace(
        /\bpulse\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/g,
        '($4 if $2 <= $1 < $2 + $3 else 0.0)'
      )
      .replace(/\bclip\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/g, 'max($2, min($1, $3))')
      .replace(/\s*&&\s*/g, ' and ')
      .replace(/\s*\|\|\s*/g, ' or ')
      .replace(/\^/g, '**');
  };

  const code = `"""
=============================================================================
 System Dynamics Simulation Engine (Python / SciPy / Matplotlib)
 Model: ${englishTitle}
 Generated for standalone execution (Spyder, Terminal, Jupyter, Google Colab)
=============================================================================
"""

import numpy as np
from scipy.integrate import odeint
import matplotlib.pyplot as plt

# ---------------------------------------------------------------------------
# 0. Global Model Metadata (All English Identifiers)
# ---------------------------------------------------------------------------
MODEL_NAME = "${englishTitle}"
englishTitle = "${englishTitle}"
english_title = "${englishTitle}"
TIME_UNIT = "${englishTimeUnit}"
time_unit = "${englishTimeUnit}"

# ---------------------------------------------------------------------------
# 1. Structural Parameters
# ---------------------------------------------------------------------------
params = {
${model.parameters.map((p) => `    '${p.id}': ${p.value},  # param ${p.id}`).join('\n')}
}

# ---------------------------------------------------------------------------
# 2. Initial State Conditions (Stock Levels)
# ---------------------------------------------------------------------------
stock_ids = [${stockIds.map((id) => `'${id}'`).join(', ')}]
flow_ids = [${model.flows.map((f) => `'${f.id}'`).join(', ')}]

# State vector y0: [${stockIds.map((id) => `'${id}'`).join(', ')}]
y0 = [
${model.stocks.map((s) => `    ${s.initialValue},  # stock ${s.id} (init=${s.initialValue})`).join('\n')}
]

# ---------------------------------------------------------------------------
# 3. System Dynamics Differential Equations (ODEs)
# ---------------------------------------------------------------------------
def system_dynamics_derivs(y, t, p):
    """
    Computes derivative vector dS/dt = Inflows(t) - Outflows(t)
    """
    # Unpack stocks (enforce non-negative physical boundary)
${stockIds.map((sid, idx) => `    ${sid} = max(0.0, float(y[${idx}]))`).join('\n')}

    # Unpack parameters
${paramIds.map((pid) => `    ${pid} = float(p['${pid}'])`).join('\n')}

    # Auxiliary variables
${model.auxiliaries.map((aux) => `    ${aux.id} = float(${toPythonExpr(aux.equation)})`).join('\n')}

    # Flow rates
${model.flows.map((f) => `    ${f.id} = float(${toPythonExpr(f.equation)})`).join('\n')}

    # State derivatives dS/dt
${model.stocks
  .map((s) => {
    const inPart = s.inflows.length > 0 ? s.inflows.join(' + ') : '0.0';
    const outPart = s.outflows.length > 0 ? s.outflows.join(' - ') : '0.0';
    return `    d_${s.id}_dt = (${inPart}) - (${outPart})`;
  })
  .join('\n')}

    return [
${stockIds.map((sid) => `        d_${sid}_dt`).join(',\n')}
    ]

# ---------------------------------------------------------------------------
# 4. Numerical Integration (SciPy odeint)
# ---------------------------------------------------------------------------
start_time = ${model.config.startTime}
stop_time = ${model.config.stopTime}
dt = ${model.config.dt}
time_steps = int((stop_time - start_time) / dt) + 1
t_arr = np.linspace(start_time, stop_time, time_steps)
t = t_arr  # alias for backwards compatibility

print(f"Starting SciPy odeint solver for '{MODEL_NAME}'...")
print(f"Time span: [{start_time}, {stop_time}] {TIME_UNIT}, Total steps: {time_steps}")
solution = odeint(system_dynamics_derivs, y0, t_arr, args=(params,))
print("ODE integration completed successfully!")

# ---------------------------------------------------------------------------
# 5. Scientific Visualization (English Titles, Legends & Axis Labels)
# ---------------------------------------------------------------------------
fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(11, 8), sharex=True)
fig.suptitle(MODEL_NAME, fontsize=14, fontweight="bold")

# Plot 1: State Stocks Evolution
colors = ['#0d9488', '#0284c7', '#ea580c', '#e11d48', '#7c3aed', '#16a34a']
for idx, sid in enumerate(stock_ids):
    color = colors[idx % len(colors)]
    ax1.plot(t_arr, solution[:, idx], label=sid, color=color, linewidth=2.0)

ax1.set_ylabel("Stock Level", fontsize=11)
ax1.set_title("State Stocks Trajectories", fontsize=12)
ax1.grid(True, linestyle="--", alpha=0.5)
ax1.legend(loc="best", framealpha=0.9)

# Plot 2: Flow Rates Dynamics
flow_timeseries = {fid: [] for fid in flow_ids}

for step_i in range(len(t_arr)):
    t = float(t_arr[step_i])
    curr_y = solution[step_i, :]
    ctx_y = {sid: float(curr_y[i]) for i, sid in enumerate(stock_ids)}
    ${stockIds.map((sid) => `${sid} = ctx_y['${sid}']`).join('\n    ')}
    ${paramIds.map((pid) => `${pid} = params['${pid}']`).join('\n    ')}
    ${model.auxiliaries.map((aux) => `${aux.id} = float(${toPythonExpr(aux.equation)})`).join('\n    ')}
    ${model.flows.map((f) => `flow_timeseries['${f.id}'].append(float(${toPythonExpr(f.equation)}))`).join('\n    ')}

for idx, fid in enumerate(flow_ids):
    color = colors[(idx + 2) % len(colors)]
    ax2.plot(t_arr, flow_timeseries[fid], label=fid, color=color, linestyle="--", linewidth=1.8)

ax2.set_xlabel(f"Time ({TIME_UNIT})", fontsize=11)
ax2.set_ylabel("Flow Rate", fontsize=11)
ax2.set_title("Rate Dynamics (Flows & Auxiliaries)", fontsize=12)
ax2.grid(True, linestyle="--", alpha=0.5)
ax2.legend(loc="best", framealpha=0.9)

plt.tight_layout()
plt.show()
`;

  return code;
}
