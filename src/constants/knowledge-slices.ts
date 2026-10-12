/**
 * System Dynamics Knowledge Slices & Theoretical Foundations
 * Structured mental slices for deep conceptual mastery.
 */

export interface KnowledgeSlice {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  conceptSummary: string;
  corePrinciples: string[];
  mathematicalMetaphor: {
    formula: string;
    description: string;
  };
  classicAnalogy: string;
  criticalTraps: string[];
  diagnosticChecklist: string[];
  interactiveQuestion: {
    question: string;
    options: { text: string; isCorrect: boolean; explanation: string }[];
  };
}

export const KNOWLEDGE_SLICES: KnowledgeSlice[] = [
  {
    id: 'slice-stock-vs-flow',
    tag: '切片一',
    title: '存量与流量的根本差异与记忆惯性',
    subtitle: 'Stock vs. Flow: 系统的物理累积与时间积分',
    conceptSummary:
      '存量（Stock/Level）是系统在某一静止时刻的累积状态（如浴缸中的蓄水量、人口、银行存款）；流量（Flow/Rate）是单位时间内改变存量的速率（如进水龙头的流速、出生率、取款速率）。存量赋予系统物理记忆与抵抗突变的惯性。',
    corePrinciples: [
      '【拍快照检验法】：如果时间在瞬间完全定格（dt -> 0），能够被测量并依然存在的量是“存量”；而瞬间归零或无法在单点测量的量是“流量”。',
      '【积分累加机制】：存量是过去所有流入量减去流出量的历史积分，存量无法瞬间突变，必须经历时间的持续积聚。',
      '【解耦与缓冲能力】：存量使得流入和流出可以在短时间内解耦（例如即使入库断货，现有库存仍可支撑销售一段时间）。',
      '【系统记忆的载体】：系统的一切动态行为模式（振荡、S型、崩溃）均由存量变量的状态转移所驱动。',
    ],
    mathematicalMetaphor: {
      formula: 'S(t) = S(t_0) + \\int_{t_0}^t \\left[ \\text{Inflow}(\\tau) - \\text{Outflow}(\\tau) \\right] d\\tau',
      description: '微分形式为 dS/dt = Inflow(t) - Outflow(t)。存量是连续时间的状态向量分量。',
    },
    classicAnalogy:
      '浴缸隐喻 (The Bathtub Analogy)：水龙头注水是流入量（升/分钟），排水管漏水是流出量（升/分钟），浴缸内的现有总积水深则是存量（升）。只要注水量大于排水量，无论水龙头开大还是关小，浴缸水位都在继续上升！',
    criticalTraps: [
      '混淆存量与流量的物理量纲（例如把“累计负债（元）”与“月度赤字（元/月）”混为一谈）。',
      '错误认为流量变小存量就会变小（实际上只要净流入大于零，存量仍在持续膨胀）。',
      '在无存量缓冲的前提下试图构建稳定控制系统（无存量系统丧失相移与滤波能力）。',
    ],
    diagnosticChecklist: [
      '检查所有存量单位是否为纯状态量（如：件、人、吨、元），而不是包含 /天、/年 的速率量。',
      '检查所有流量变量是否严格连接到存量箱，或者明确标注源/汇云朵（Cloud Source/Sink）。',
      '确认是否设置了合理的非负约束与初值 S(0)。',
    ],
    interactiveQuestion: {
      question: '如果某国过去一年的“年通货膨胀率（物价上涨速度）”从 8% 降到了 3%，这意味着物价指数（存量）发生了什么变化？',
      options: [
        {
          text: '物价在迅速下降，百姓生活成本降低。',
          isCorrect: false,
          explanation: '错误。通胀率是物价的流量（变化率）。3% 仍然大于 0，说明物价存量依然在上涨，只是涨速变慢了。',
        },
        {
          text: '物价仍在继续上涨，只是上涨的速率放缓了。',
          isCorrect: true,
          explanation: '正确！这是典型的“将流量放缓误判为存量减少”的直觉误区。除非通胀率为负数（通货紧缩），物价存量才会下降。',
        },
        {
          text: '物价保持绝对恒定不变。',
          isCorrect: false,
          explanation: '错误。只有当流量为 0 时，存量才保持水平线不变。',
        },
      ],
    },
  },

  {
    id: 'slice-applicability-statespace',
    tag: '切片二',
    title: '适用条件与状态空间微分表示',
    subtitle: '何时使用系统动力学？内生性视角与连续微分拓扑',
    conceptSummary:
      '系统动力学专为复杂非线性、高阶延迟、多重闭环反馈的大系统而生。它坚持“内生性视角”（Endogenous Perspective）——即系统的宏观演化模式源于内部结构的因果反馈网络，而非外部随机力量的被动牵引。在数学上对应自治连续状态空间。',
    corePrinciples: [
      '【内生性解释原则】：不把问题归咎于“外部黑天鹅”，而是追问“系统内部什么样的反馈结构把外部轻微扰动放大成了危机”。',
      '【连续时间状态空间】：将因果逻辑映射为一组一阶自治非线性常微分方程组 dx/dt = f(x, u, p)。',
      '【信息与物理双层流】：实物流（物料、人员、资金）受物理守恒律支配；信息流（认知、决策、订单）受认知偏差与感知滞后支配。',
      '【高阶非线性耦合】：反馈环路增益不是固定常数，而是随存量水平动态漂移，导致系统在不同阶段由不同主导回路接管。',
    ],
    mathematicalMetaphor: {
      formula: '\\dot{\\mathbf{x}}(t) = \\mathbf{f}\\left(\\mathbf{x}(t), \\mathbf{p}\\right), \\quad \\mathbf{J} = \\left[ \\frac{\\partial f_i}{\\partial x_j} \\right]',
      description: '系统的局部渐进稳定性完全取决于雅可比矩阵 J 的特征值实部与虚部配置。',
    },
    classicAnalogy:
      '踩油门开车的闭环控制：司机看到速度表（信息流）-> 大脑做出加速判断（认知延迟）-> 踩下油门（控制流）-> 燃油进入引擎燃烧推动车重（物理存量积分）-> 速度上升。整个驾驶过程不是单向因果链，而是一个紧密闭合的连续反馈循环。',
    criticalTraps: [
      '用单向因果树（Cause-and-Effect Tree）代替闭环反馈（忽视了结果反过来会反作用于原因）。',
      '把纯相关性（Correlation）当做动力学因果律（Causality）。',
      '忽略变量间的非线性临界突变点（把复杂系统当做恒定斜率的简单线性回归系统）。',
    ],
    diagnosticChecklist: [
      '因果回路中是否存在未闭合的断头单向链？是否寻找了深层反作用路径？',
      '辅助变量计算是否构成了非物理的瞬间代数死锁（Algebraic Loop without state stock）？',
      '主导回路是否随时间演化发生过合理的极性接管（如从 R 切换到 B）？',
    ],
    interactiveQuestion: {
      question: '在系统动力学建模中，如果两个辅助变量 A = 2 * B 且 B = A + 5，同时没有任何存量与延迟参与，仿真器会发生什么？',
      options: [
        {
          text: '系统平稳演化并得出正确的积分轨迹。',
          isCorrect: false,
          explanation: '错误。缺少存量积分环节，两个辅助变量直接形成零延迟代数环，导致除零或死锁。',
        },
        {
          text: '触发致命的代数环（Algebraic Loop）死锁，因缺乏物理时间积分而无法求解。',
          isCorrect: true,
          explanation: '正确！纯辅助变量之间的无延迟互指构成了虚假的瞬间隐式方程，在物理世界中必须通过存量或时间延迟予以解耦。',
        },
        {
          text: '系统自动将 A 和 B 转化为正弦波振荡。',
          isCorrect: false,
          explanation: '错误。振荡需要至少包含具有相移的存量状态或高阶延迟，纯代数环无法生成相位差。',
        },
      ],
    },
  },

  {
    id: 'slice-deadly-simulation-traps',
    tag: '切片三',
    title: '三大致命仿真陷阱与失稳根源',
    subtitle: '延迟振荡、开环爆炸与量纲破损的数学机理',
    conceptSummary:
      '在计算机动态仿真中，初学者极易踩入三大经典致命陷阱：① 忽视信息与物流延迟（Delay）引发相位滞后和超调振荡；② 缺乏负反馈约束导致指数级开环发散；③ 混淆存量流量量纲导致虚假数字漂移。',
    corePrinciples: [
      '【陷阱一：延迟与负反馈相位颠倒】：负反馈回路寻求平衡，但在高阶延迟作用下，纠偏信号延迟 180 度到达，负反馈在数学上瞬间蜕变为剧烈加剧振荡的正反馈！',
      '【陷阱二：开环无界发散】：现实世界中没有任何系统能无限指数扩张；模型中若只有正反馈 R 回路而没有物理边界或承载力负反馈，模型在数学上注定崩塌。',
      '【陷阱三：量纲与时间步长 dt 失真】：Euler 数值积分中若 dt 选取过大（超过系统最小特征时间常数 tau 的一半），数值算法本身将激发人工伪振荡与数值发散。',
    ],
    mathematicalMetaphor: {
      formula: 'G_{closed}(s) = \\frac{K e^{-s \\tau}}{1 + K e^{-s \\tau}}, \\quad \\text{Phase Margin} < 0 \\implies \\text{Unstable Oscillation}',
      description: '时滞环节 e^{-s tau} 引入持续相角下落，当环路增益大于 1 且相移达 180° 时，系统必然产生自激振荡。',
    },
    classicAnalogy:
      '调节淋浴器水温陷阱：水管很长（延迟 5 秒）。你觉得水冷，把水龙头猛往热水方向拧到底；等了 2 秒水还没热，你又继续拧大；第 5 秒滚烫的热水喷涌而出（超调！）；你惊慌失措地猛往冷水方向拧……系统在冰火两重天中剧烈振荡，全因忽视了管线延迟！',
    criticalTraps: [
      '当系统振荡时，管理层线性直觉是“加大纠偏力度”，这反而会直接让系统进入失控混沌（更高幅值）。',
      '没有针对存量下限进行平滑非负截断，导致人口、库存、物资出现负数。',
      '仿真步长 dt 设得比模型中的物理延迟还要大（违反采样定理与数值稳定性条件）。',
    ],
    diagnosticChecklist: [
      '检查时间步长 dt 是否满足 dt <= min(Delays) / 4。推荐使用 4 阶 Runge-Kutta 算法。',
      '检查所有负反馈调节环是否评估了延迟大小与相位富裕度。',
      '排查是否存在仅有增长没有阻滞的虚假永动机回路。',
    ],
    interactiveQuestion: {
      question: '面对长延迟负反馈系统出现的剧烈振荡超调（如供应链牛鞭效应），最具杠杆效应的治理策略是？',
      options: [
        {
          text: '加大惩罚与补偿力度，只要发现偏离目标就加倍订货/调整。',
          isCorrect: false,
          explanation: '错误！加大控制增益（放大反应）会直接缩小相位裕度，使振荡加剧发散甚至崩溃。',
        },
        {
          text: '缩短信息与物理延迟时间常数，并放平反应速度，给予系统消化时间。',
          isCorrect: true,
          explanation: '正确！减少时滞是系统动力学最高杠杆点之一；同时放宽调整周期（避免过度反应）能够从根源消除超调。',
        },
        {
          text: '彻底切断所有反馈回路，实施纯静态盲目派发。',
          isCorrect: false,
          explanation: '错误。完全无反馈将导致系统失去适应外界扰动的自组织能力。',
        },
      ],
    },
  },

  {
    id: 'slice-linear-intuition-traps',
    tag: '切片四',
    title: '误区警示与线性直觉诊断陷阱',
    subtitle: '为什么好心常常办坏事？政策阻力（Policy Resistance）与高杠杆解',
    conceptSummary:
      '人类大脑进化出的直觉大多基于“单向线性、近距离、立竿见影”的思维模式。然而复杂系统充满了非线性反馈与高阶滞后。忽视这些特质会导致常见的“好心办坏事”（Fixes that fail）与“舍本逐末”（Shifting the burden）现象，即系统的“政策阻力”。必须通过系统动力学计算机仿真洞见隐蔽杠杆。',
    corePrinciples: [
      '【线性直觉盲区】：直觉假设“输出正比于输入”、“因果在时间空间上紧邻”；但在复杂系统中，原因与症状往往在时间上相隔数年、在空间上相隔数个部门。',
      '【政策阻力 (Policy Resistance)】：系统内部各反馈环路具有对抗外力干预以维持自身稳态的本能，低杠杆的政策往往被系统自发抵消（例如修路缓解拥堵往往吸引更多汽车反而更堵）。',
      '【好心办坏事 (Fixes that Fail)】：短期立竿见影的强力救火手段，往往在长期激活了致命的负面增强回路（例如布鲁克斯定律中的疯狂加人）。',
      '【梅多斯12大杠杆层次】：改变参数/常数往往是最低杠杆；改变系统反馈结构、信息透明度、规则与系统目标才是最高杠杆！',
    ],
    mathematicalMetaphor: {
      formula: '\\text{Leverage} = \\frac{\\partial \\text{SystemAttractor}}{\\partial \\text{StructureRule}} \\gg \\frac{\\partial \\text{SystemAttractor}}{\\partial \\text{Parameter}}',
      description: '改变反馈回路的拓扑连接与信息流转优先级，其对系统渐进轨迹的影响远远超越微调单一参数。',
    },
    classicAnalogy:
      '退烧药与感染病因的“舍本逐末”：病人高烧，吃了退烧药体温立即降下来（线性对症下药）；但发烧是身体对抗病毒的免疫调节机制。单纯依赖强力退烧药而不杀灭病原体，反而削弱自体免疫系统的锻炼，长期依赖使身体素质进一步滑坡。',
    criticalTraps: [
      '只盯着显性表象（Symptom）救火，忽视深层结构（Structure）。',
      '在高度非线性的临界点附近，盲目采用基于历史平稳期的线性推断（忽视明斯基时刻与相变翻转）。',
      '认为“加大努力”就能解决一切延期与困难（陷入布鲁克斯赶工陷阱）。',
    ],
    diagnosticChecklist: [
      '你的政策干预是否在短期内有效，但在长期内反而使初始问题恶化？如果是，立即寻找隐蔽的副作用延迟负环。',
      '你是否试图通过修改参数来解决结构失衡？尝试在更高杠杆点（重塑信息流、取消扭曲激励）寻找解法。',
      '是否进行了多种极限条件测试（Extreme Condition Testing，如存量归零或无穷大时的方程表现）？',
    ],
    interactiveQuestion: {
      question: '系统思考先驱 Donella Meadows 指出的“12大系统干预杠杆点”中，以下哪一项处于最高层级的杠杆？',
      options: [
        {
          text: '修改某个税率常数或库存目标参数的数值大小。',
          isCorrect: false,
          explanation: '错误。参数调整（Constants and Parameters）位于杠杆层级的最底层（第12层），耗费巨大力气却很少改变系统根本模式。',
        },
        {
          text: '重构信息流的流动结构、改变系统的目标（Goal）与思维模型（Mindset）。',
          isCorrect: true,
          explanation: '正确！改变信息反馈透明度、系统根本目标和范式转移（Paradigm shift）处于杠杆金字塔顶端，能彻底重塑系统全部行为。',
        },
        {
          text: '把仿真软件的运算步长调小一倍。',
          isCorrect: false,
          explanation: '错误。数值算法步长只是计算精度工具，不改变现实系统的物理法则。',
        },
      ],
    },
  },
];
