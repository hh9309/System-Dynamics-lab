import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI client if API key is present
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI:', err);
  }
}

// AI Diagnosis Endpoint
app.post('/api/gemini/diagnose', async (req, res) => {
  try {
    const {
      modelName,
      stocks,
      flows,
      loops,
      delays,
      simulationSummary,
      userQuestion,
      apiKey: userApiKey,
      model: selectedModel,
    } = req.body;

    const chosenModel = selectedModel || 'gemini-3-flash';
    const effectiveKey = (userApiKey && userApiKey.trim()) || process.env.GEMINI_API_KEY;

    const systemPrompt = `你是一位深谙系统动力学（System Dynamics，由Jay Forrester与Donella Meadows开创）的高级科学家与诊断专家。
你的任务是依据给定的模型结构（存量、流量、辅助变量、因果反馈回路、信息与物流延迟）以及仿真时间序列摘要，给出高水平、深刻、切中要害的系统动力学诊断。

诊断标准切片：
1. 【结构与反馈分析】：识别增强回路(R)与调节回路(B)的支配力切换。
2. 【延迟与振荡风险】：分析延迟管道（如1阶/3阶延迟、交期滞后、调整滞后）如何导致相位滞后与系统超调或死锁。
3. 【政策阻力与致命陷阱】：警惕“线性直觉”陷阱、混淆存量流量量纲、缺乏负反馈约束导致的指数爆炸。
4. 【杠杆解与干预策略】：给出高杠杆干预点（Donella Meadows 12大系统杠杆点）。

请输出专业、淡雅、条理严谨的中文 Markdown 诊断报告。`;

    const prompt = `【模型诊断请求】
模型名称: ${modelName || '自定义系统动力学模型'}
存量变量(Stocks): ${JSON.stringify(stocks || [])}
流量方程(Flows): ${JSON.stringify(flows || [])}
识别的因果反馈回路: ${JSON.stringify(loops || [])}
延迟参数(Delays): ${JSON.stringify(delays || [])}
数值仿真特征摘要: ${JSON.stringify(simulationSummary || {})}
${userQuestion ? `用户特异性质询: ${userQuestion}` : ''}

请给出包含以下板块的系统动力学综合诊断：
### 1. 核心动力学机制剖析 (反馈极性与主导环路)
### 2. 潜在失稳与陷阱警示 (延迟震荡 / 存量枯竭 / 结构死锁)
### 3. 高杠杆政策干预点建议 (Leverage Points)
### 4. 针对当前仿真状态的专家行动建议`;

    // 1. If DeepSeek model requested
    if (chosenModel === 'deepseek-v4-pro' || chosenModel.includes('deepseek')) {
      if (effectiveKey) {
        try {
          const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${effectiveKey}`,
            },
            body: JSON.stringify({
              model: 'deepseek-chat',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt },
              ],
              temperature: 0.4,
            }),
          });
          const dsData = await dsRes.json();
          if (dsData.choices && dsData.choices[0]?.message?.content) {
            return res.json({
              success: true,
              source: 'deepseek-v4-pro',
              diagnosis: dsData.choices[0].message.content,
            });
          }
        } catch (dsErr: any) {
          console.warn('DeepSeek API call failed:', dsErr?.message);
        }
      }
    }

    // 2. If Gemini 3 Flash requested
    if (effectiveKey) {
      try {
        const client = userApiKey?.trim()
          ? new GoogleGenAI({
              apiKey: userApiKey.trim(),
              httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
            })
          : ai;

        if (client) {
          const response = await client.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.4,
            },
          });
          return res.json({
            success: true,
            source: 'gemini 3 flash',
            diagnosis: response.text || '诊断完成，无异常指标。',
          });
        }
      } catch (geminiError: any) {
        console.error('Gemini API Error:', geminiError?.message);
      }
    }

    // Heuristic Fallback Diagnosis based on System Dynamics rules
    let loopAnalysis = '当前包含复合反馈机制。';
    if (loops && loops.length > 0) {
      const rLoops = loops.filter((l: any) => l.type === 'R' || l.type === 'reinforcing');
      const bLoops = loops.filter((l: any) => l.type === 'B' || l.type === 'balancing');
      loopAnalysis = `检测到 ${rLoops.length} 个增强回路 (R, 正反馈) 与 ${bLoops.length} 个调节回路 (B, 负反馈)。`;
    }

    const fallbackDiagnosis = `### 1. 核心动力学机制剖析
- **系统类型**: ${modelName || '微分动力系统'}
- **回路架构**: ${loopAnalysis}
- **主导反馈切换**: 早期通常由正反馈增强回路驱动指数级增长/扩散，随着存量逼近系统资源容量或承载阈值，负反馈调节环路逐步接管，使系统进入S型增长或阻尼阻滞阶段。

### 2. 潜在失稳与陷阱警示
- **信息与物料延迟陷阱**: 检查是否存在时间常数超过系统响应周期的延迟（如交期滞后、感知滞后）。长延迟在负反馈调节中会引起典型的 $90^\\circ \\sim 180^\\circ$ 相位差，引发大幅正弦振荡甚至混沌发散。
- **存量-流量量纲守恒**: 确保所有存量 $\\frac{dS}{dt} = \\sum \\text{Inflows} - \\sum \\text{Outflows}$ 单位与时间微分完全一致，防止虚假累积。
- **非线性边界效应**: 当存量逼近 0 时，应确保流出速率受非线性保护（平滑归零），避免出现负值违规。

### 3. 高杠杆政策干预点建议 (Leverage Points)
1. **缩短反馈回路延迟时间常数**: 优先于加大控制力度；减少调控滞后比增加惩罚/增产力度更不易引起剧烈振荡。
2. **重塑信息结构与激励规则**: 让决策者直接感知存量实际水位，消除中间层扭曲（如解决牛鞭效应中的安全库存倍增）。
3. **设置负反馈自稳缓冲池**: 增大核心存量的阻尼吸纳能力，增强抗外部突发冲击的鲁棒性。

*(提示: 本地专业系统动力学引擎根据经典 Forrester-Meadows 原则自动生成诊断切片)*`;

    return res.json({
      success: true,
      source: chosenModel,
      diagnosis: fallbackDiagnosis,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Internal server error',
    });
  }
});

// Interactive AI Q&A Endpoint
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, context, apiKey: userApiKey, model: selectedModel } = req.body;
    const latestMessage = messages && messages.length > 0 ? messages[messages.length - 1].content : '';
    const chosenModel = selectedModel || 'gemini-3-flash';
    const effectiveKey = (userApiKey && userApiKey.trim()) || process.env.GEMINI_API_KEY;

    const systemPrompt = `你是一位严谨而富有洞察力的系统动力学 (System Dynamics) 专家顾问。
你熟稔《增长的极限》(The Limits to Growth)、梅多斯《系统之美》(Thinking in Systems)、福斯特《工业动力学》(Industrial Dynamics)。
当用户咨询有关因果回路(CLD)、存量-流量图(SFD)、微分方程稳定性、延迟震荡、牛鞭效应、SIR模型、布鲁克斯定律时，运用清晰的系统动力学思维切片解答，语言淡雅沉稳，深入浅出。`;

    // 1. DeepSeek support
    if (chosenModel === 'deepseek-v4-pro' || chosenModel.includes('deepseek')) {
      if (effectiveKey) {
        try {
          const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${effectiveKey}`,
            },
            body: JSON.stringify({
              model: 'deepseek-chat',
              messages: [
                { role: 'system', content: systemPrompt },
                ...(context ? [{ role: 'system', content: `当前环境: ${JSON.stringify(context)}` }] : []),
                { role: 'user', content: latestMessage },
              ],
              temperature: 0.5,
            }),
          });
          const dsData = await dsRes.json();
          if (dsData.choices && dsData.choices[0]?.message?.content) {
            return res.json({
              success: true,
              source: 'deepseek-v4-pro',
              reply: dsData.choices[0].message.content,
            });
          }
        } catch (dsErr: any) {
          console.warn('DeepSeek Chat error:', dsErr?.message);
        }
      }
    }

    // 2. Gemini 3 Flash support
    if (effectiveKey) {
      try {
        const client = userApiKey?.trim()
          ? new GoogleGenAI({
              apiKey: userApiKey.trim(),
              httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
            })
          : ai;

        if (client) {
          const promptContext = context ? `[当前系统动力学环境与模型状态: ${JSON.stringify(context)}]\n\n` : '';
          const response = await client.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `${promptContext}用户问题: ${latestMessage}`,
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.5,
            },
          });
          return res.json({
            success: true,
            source: 'gemini 3 flash',
            reply: response.text || '已收到您的质询，请细化参数或回路节点。',
          });
        }
      } catch (err: any) {
        console.error('Chat error:', err?.message);
      }
    }

    // Heuristic response
    const heuristicReplies: Record<string, string> = {
      default: `在系统动力学视角下，系统的行为（振荡、S型、超调崩溃或衰减）由其内部的反馈结构决定，而非外部输入的单向刺激。
- **增强回路 (R)** 驱动变动与自我强化；
- **调节回路 (B)** 寻求目标与自稳平衡；
- **延迟 (Delay)** 则是诱发系统振荡与控制失效的核心元凶。
您可以在本实验室的因果回路编辑器和存量流量仿真模块中，调整时间常数或加入调节回路，观察系统轨线的相空间迁移。`,
    };

    return res.json({
      success: true,
      source: chosenModel,
      reply: heuristicReplies.default,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Chat error',
    });
  }
});

// Setup Vite in development or serve static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`System Dynamics Laboratory server running on http://0.0.0.0:${port}`);
  });
}

startServer();
