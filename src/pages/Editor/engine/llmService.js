/**
 * LLM service layer with real API call support and mock fallback.
 */

const MOCK_RESPONSES = [
  '根据您的需求，我为您进行了以下分析和处理。以下是详细的结果和建议：\n\n1. 数据已成功解析，共识别出 3 个关键要素。\n2. 根据上下文语义分析，建议采用方案 A 以获得最佳效果。\n3. 已完成格式化输出，可直接用于下游任务。',
  '经过仔细分析输入内容，我得出以下结论：\n\n主题涵盖了人工智能在现代工作流程中的应用。核心观点清晰，论据充分。建议进一步探讨具体的实施路径和潜在风险。',
  '任务已完成。以下是处理结果摘要：\n\n- 输入数据经过清洗和标准化处理\n- 识别出 5 个关键特征\n- 生成了结构化输出报告\n- 置信度评分：0.92',
];

async function mockLLMCall(systemPrompt, userPrompt, _params) {
  const delay = 1000 + Math.random() * 2000;
  await new Promise((r) => setTimeout(r, delay));
  const idx = Math.floor(Math.random() * MOCK_RESPONSES.length);
  return MOCK_RESPONSES[idx];
}

const MODEL_REGISTRY = {
  'gpt-4o':            { baseURL: 'https://api.openai.com/v1/chat/completions' },
  'gpt-4o-mini':       { baseURL: 'https://api.openai.com/v1/chat/completions' },
  'deepseek-chat':     { baseURL: 'https://api.deepseek.com/v1/chat/completions' },
  'deepseek-reasoner': { baseURL: 'https://api.deepseek.com/v1/chat/completions' },
  'doubao-pro-32k':    { baseURL: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions' },
  'doubao-lite-32k':   { baseURL: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions' },
  'moonshot-v1-8k':    { baseURL: 'https://api.moonshot.cn/v1/chat/completions' },
  'moonshot-v1-32k':   { baseURL: 'https://api.moonshot.cn/v1/chat/completions' },
};

const LEGACY_MODEL_MAP = {
  'GPT-4o': 'gpt-4o',
  'GPT-4o mini': 'gpt-4o-mini',
  'Claude 3.5 Sonnet': 'gpt-4o',
  'Doubao Pro': 'doubao-pro-32k',
  'Moonshot': 'moonshot-v1-8k',
};

async function realLLMCall(systemPrompt, userPrompt, params) {
  const { apiKey, temperature, maxTokens, customBaseURL } = params;
  const model = LEGACY_MODEL_MAP[params.model] || params.model;

  const registry = MODEL_REGISTRY[model];
  const baseURL = customBaseURL || registry?.baseURL || 'https://api.openai.com/v1/chat/completions';

  const body = {
    model,
    messages: [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      { role: 'user', content: userPrompt || '你好' },
    ],
    temperature: temperature ?? 0.7,
    max_tokens: maxTokens ?? 2048,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `API 错误: ${res.status}`);
    }

    const json = await res.json();
    return json.choices?.[0]?.message?.content || '(空响应)';
  } catch (e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') throw new Error('请求超时 (30s)');
    throw e;
  }
}

/**
 * Call the LLM.
 * If apiKey is provided, makes a real API call; otherwise uses mock.
 */
export async function callLLM(systemPrompt, userPrompt, params = {}) {
  if (params.apiKey) {
    return realLLMCall(systemPrompt, userPrompt, params);
  }
  return mockLLMCall(systemPrompt, userPrompt, params);
}
