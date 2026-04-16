import { Plus, X, MousePointer } from 'lucide-react';
import styles from './ConfigPanel.module.css';

const MODEL_OPTIONS = [
  { id: 'gpt-4o',          label: 'GPT-4o',          provider: 'OpenAI',   baseURL: 'https://api.openai.com/v1/chat/completions' },
  { id: 'gpt-4o-mini',     label: 'GPT-4o mini',     provider: 'OpenAI',   baseURL: 'https://api.openai.com/v1/chat/completions' },
  { id: 'deepseek-chat',   label: 'DeepSeek V3',     provider: 'DeepSeek', baseURL: 'https://api.deepseek.com/v1/chat/completions' },
  { id: 'deepseek-reasoner', label: 'DeepSeek R1',   provider: 'DeepSeek', baseURL: 'https://api.deepseek.com/v1/chat/completions' },
  { id: 'doubao-pro-32k',  label: 'Doubao Pro 32K',  provider: '豆包',     baseURL: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions' },
  { id: 'doubao-lite-32k', label: 'Doubao Lite 32K', provider: '豆包',     baseURL: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions' },
  { id: 'moonshot-v1-8k',  label: 'Moonshot v1 8K',  provider: 'Moonshot', baseURL: 'https://api.moonshot.cn/v1/chat/completions' },
  { id: 'moonshot-v1-32k', label: 'Moonshot v1 32K', provider: 'Moonshot', baseURL: 'https://api.moonshot.cn/v1/chat/completions' },
];

const PROVIDERS = [...new Set(MODEL_OPTIONS.map((m) => m.provider))];

const LEGACY_MODEL_MAP = {
  'GPT-4o': 'gpt-4o',
  'GPT-4o mini': 'gpt-4o-mini',
  'Claude 3.5 Sonnet': 'gpt-4o',
  'Doubao Pro': 'doubao-pro-32k',
  'Moonshot': 'moonshot-v1-8k',
};

function normalizeModelId(model) {
  return LEGACY_MODEL_MAP[model] || model;
}

function StartConfig({ data, onChange }) {
  const vars = data.variables || [];

  const updateVar = (index, field, value) => {
    const next = vars.map((v, i) => (i === index ? { ...v, [field]: value } : v));
    onChange({ variables: next });
  };

  const addVar = () => onChange({ variables: [...vars, { key: '', value: '' }] });
  const removeVar = (index) => onChange({ variables: vars.filter((_, i) => i !== index) });

  return (
    <>
      <div className={styles.fieldGroup}>
        <div className={styles.fieldLabel}>输入变量</div>
        <div className={styles.varList}>
          {vars.map((v, i) => (
            <div key={i} className={styles.varRow}>
              <input
                className={styles.varInput}
                placeholder="变量名"
                value={v.key}
                onChange={(e) => updateVar(i, 'key', e.target.value)}
              />
              <input
                className={styles.varInput}
                placeholder="默认值"
                value={v.value}
                onChange={(e) => updateVar(i, 'value', e.target.value)}
              />
              <button className={styles.removeBtn} onClick={() => removeVar(i)}>
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
        <button className={styles.addBtn} onClick={addVar}>
          <Plus size={11} /> 添加变量
        </button>
        <div className={styles.hint}>
          下游节点可通过 {'{{变量名}}'} 引用这些变量
        </div>
      </div>
    </>
  );
}

function PromptConfig({ data, onChange }) {
  return (
    <>
      <div className={styles.fieldGroup}>
        <div className={styles.fieldLabel}>系统提示词 (System Prompt)</div>
        <textarea
          className={styles.fieldTextarea}
          placeholder="定义 AI 的角色和行为准则..."
          value={data.systemPrompt || ''}
          onChange={(e) => onChange({ systemPrompt: e.target.value })}
          rows={4}
        />
      </div>
      <div className={styles.fieldGroup}>
        <div className={styles.fieldLabel}>用户提示词模板 (User Prompt)</div>
        <textarea
          className={styles.fieldTextarea}
          placeholder={'支持 {{变量名}} 插值\n例如：请分析以下内容：{{input}}'}
          value={data.userPrompt || ''}
          onChange={(e) => onChange({ userPrompt: e.target.value })}
          rows={3}
        />
        <div className={styles.hint}>
          使用 {'{{变量名}}'} 引用上游节点的输出
        </div>
      </div>
    </>
  );
}

function LLMConfig({ data, onChange }) {
  const modelId = normalizeModelId(data.model);
  const selectedModel = MODEL_OPTIONS.find((m) => m.id === modelId) || MODEL_OPTIONS[0];
  const effectiveBaseURL = data.customBaseURL || selectedModel.baseURL;

  const handleModelChange = (e) => {
    const model = MODEL_OPTIONS.find((m) => m.id === e.target.value);
    if (model) onChange({ model: model.id, customBaseURL: '' });
  };

  return (
    <>
      <div className={styles.fieldGroup}>
        <div className={styles.fieldLabel}>模型</div>
        <select
          className={styles.fieldSelect}
          value={modelId}
          onChange={handleModelChange}
        >
          {PROVIDERS.map((provider) => (
            <optgroup key={provider} label={provider}>
              {MODEL_OPTIONS.filter((m) => m.provider === provider).map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <div className={styles.fieldGroup}>
        <div className={styles.fieldLabel}>API 地址</div>
        <input
          className={styles.fieldInput}
          type="text"
          placeholder={selectedModel.baseURL}
          value={data.customBaseURL || ''}
          onChange={(e) => onChange({ customBaseURL: e.target.value })}
        />
        <div className={styles.hint}>
          当前指向: <code>{effectiveBaseURL}</code>
          {data.customBaseURL ? '' : '（自动匹配）'}
        </div>
      </div>
      <div className={styles.fieldGroup}>
        <div className={styles.fieldLabel}>
          Temperature
          <span className={styles.sliderValue}>{data.temperature ?? 0.7}</span>
        </div>
        <input
          type="range"
          className={styles.slider}
          min="0"
          max="2"
          step="0.1"
          value={data.temperature ?? 0.7}
          onChange={(e) => onChange({ temperature: parseFloat(e.target.value) })}
        />
      </div>
      <div className={styles.fieldGroup}>
        <div className={styles.fieldLabel}>Max Tokens</div>
        <input
          className={styles.fieldInput}
          type="number"
          min="1"
          max="128000"
          value={data.maxTokens ?? 2048}
          onChange={(e) => onChange({ maxTokens: parseInt(e.target.value) || 2048 })}
        />
      </div>
      <div className={styles.fieldGroup}>
        <div className={styles.fieldLabel}>API Key (可选)</div>
        <input
          className={styles.fieldInput}
          type="password"
          placeholder="留空则使用模拟响应"
          value={data.apiKey || ''}
          onChange={(e) => onChange({ apiKey: e.target.value })}
        />
        <div className={styles.hint}>
          提供 API Key 后将调用真实 {selectedModel.provider} API，否则使用模拟响应
        </div>
      </div>
      {selectedModel.provider === '豆包' && (
        <div className={styles.fieldGroup}>
          <div className={styles.hint} style={{ color: '#f59e0b' }}>
            ⚠ 豆包需要在火山方舟创建 Endpoint，将 Endpoint ID（ep-xxx）填入"API 地址"下方或作为模型名使用
          </div>
        </div>
      )}
    </>
  );
}

function OutputConfig({ data, onChange }) {
  return (
    <>
      <div className={styles.fieldGroup}>
        <div className={styles.fieldLabel}>输出格式</div>
        <select
          className={styles.fieldSelect}
          value={data.format || 'text'}
          onChange={(e) => onChange({ format: e.target.value })}
        >
          <option value="text">纯文本</option>
          <option value="json">JSON</option>
          <option value="markdown">Markdown</option>
        </select>
      </div>
      {data.outputResult && (
        <div className={styles.fieldGroup}>
          <div className={styles.fieldLabel}>运行结果</div>
          <div
            style={{
              padding: 10,
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
              lineHeight: 1.5,
              color: 'var(--text-primary)',
              maxHeight: 200,
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {data.outputResult}
          </div>
        </div>
      )}
    </>
  );
}

function ConditionConfig({ data, onChange }) {
  const operator = data.operator || 'contains';

  return (
    <>
      <div className={styles.fieldGroup}>
        <div className={styles.fieldLabel}>条件判断</div>
        <div className={styles.hint} style={{ marginTop: 0, marginBottom: 8 }}>
          根据上游输出判断走 True 还是 False 分支
        </div>
      </div>
      <div className={styles.fieldGroup}>
        <div className={styles.fieldLabel}>判断方式</div>
        <select
          className={styles.fieldSelect}
          value={operator}
          onChange={(e) => onChange({ operator: e.target.value })}
        >
          <option value="contains">包含</option>
          <option value="equals">等于</option>
          <option value="not_empty">不为空</option>
          <option value="greater_than">大于</option>
          <option value="less_than">小于</option>
        </select>
      </div>
      {operator !== 'not_empty' && (
        <div className={styles.fieldGroup}>
          <div className={styles.fieldLabel}>比较值</div>
          <input
            className={styles.fieldInput}
            placeholder="输入要比较的值"
            value={data.value || ''}
            onChange={(e) => onChange({ value: e.target.value })}
          />
        </div>
      )}
      {data.conditionResult !== undefined && (
        <div className={styles.fieldGroup}>
          <div className={styles.fieldLabel}>上次判断结果</div>
          <div style={{
            padding: '6px 10px',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 12,
            color: data.conditionResult ? '#10b981' : '#ef4444',
            fontWeight: 600,
          }}>
            {data.conditionResult ? '✓ True — 走左侧分支' : '✗ False — 走右侧分支'}
          </div>
        </div>
      )}
    </>
  );
}

function CodeConfig({ data, onChange }) {
  return (
    <>
      <div className={styles.fieldGroup}>
        <div className={styles.fieldLabel}>JavaScript 代码</div>
        <textarea
          className={styles.fieldTextarea}
          style={{ fontFamily: "'Consolas', 'Courier New', monospace", minHeight: 140 }}
          placeholder={'// input 包含上游数据:\n// input.upstreamOutputs — 上游节点输出\n// input.variables — 全局变量\n\nconst data = input.upstreamOutputs;\nreturn { result: "processed" };'}
          value={data.code || ''}
          onChange={(e) => onChange({ code: e.target.value })}
          rows={8}
        />
        <div className={styles.hint}>
          代码通过 <code>input</code> 获取上游数据，通过 <code>return</code> 返回结果传递给下游
        </div>
      </div>
    </>
  );
}

const configMap = {
  start: { component: StartConfig, label: '开始节点', color: styles.startColor, icon: '▶' },
  prompt: { component: PromptConfig, label: 'Prompt 节点', color: styles.promptColor, icon: '💬' },
  llm: { component: LLMConfig, label: '大模型节点', color: styles.llmColor, icon: '🧠' },
  condition: { component: ConditionConfig, label: '条件分支', color: styles.conditionColor, icon: '🔀' },
  code: { component: CodeConfig, label: '代码节点', color: styles.codeColor, icon: '💻' },
  output: { component: OutputConfig, label: '输出节点', color: styles.outputColor, icon: '📤' },
};

export default function ConfigPanel({ selectedNode, onUpdateNodeData, activeTab, onTabChange, isRunning, debugPanel }) {
  const config = selectedNode ? configMap[selectedNode.type] : null;
  const ConfigComponent = config?.component;

  const handleChange = (partial) => {
    if (!selectedNode) return;
    onUpdateNodeData(selectedNode.id, { ...selectedNode.data, ...partial });
  };

  return (
    <div className={styles.panel}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'config' ? styles.active : ''}`}
          onClick={() => onTabChange('config')}
        >
          配置
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'debug' ? styles.active : ''}`}
          onClick={() => onTabChange('debug')}
        >
          调试
        </button>
      </div>

      <div className={styles.body}>
        {activeTab === 'config' && (
          <>
            {selectedNode && ConfigComponent ? (
              <fieldset disabled={isRunning} style={{ border: 'none', padding: 0, margin: 0, opacity: isRunning ? 0.5 : 1 }}>
                <div className={styles.nodeHeader}>
                  <div className={`${styles.nodeTypeIcon} ${config.color}`}>
                    {config.icon}
                  </div>
                  <div className={styles.nodeTypeName}>{config.label}</div>
                  {isRunning && <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>运行中锁定</span>}
                </div>
                <ConfigComponent data={selectedNode.data} onChange={handleChange} />
              </fieldset>
            ) : (
              <div className={styles.emptyState}>
                <MousePointer size={20} />
                <span>点击节点进行配置</span>
              </div>
            )}
          </>
        )}
        {activeTab === 'debug' && debugPanel}
      </div>
    </div>
  );
}
