import topologicalSort from './topologicalSort';
import validateFlow from './validator';
import { callLLM } from './llmService';

function interpolate(template, variables) {
  if (!template) return '';
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return variables[key] !== undefined ? String(variables[key]) : `{{${key}}}`;
  });
}

/**
 * FlowEngine — executes a flow DAG with conditional branching.
 *
 * Callbacks:
 *   onNodeStart(nodeId)
 *   onNodeComplete(nodeId, { input, output, duration })
 *   onNodeError(nodeId, error)
 *   onNodeSkipped(nodeId)
 *   onLog(message)
 *   onBreakpoint(nodeId, resume: () => void)
 */
export default class FlowEngine {
  constructor(nodes, edges, callbacks = {}) {
    this.nodes = nodes;
    this.edges = edges;
    this.cb = callbacks;
    this.nodeOutputs = {};
    this.variables = {};
    this.aborted = false;
    this._breakpointResolve = null;
    this.skippedNodes = new Set();
  }

  abort() {
    this.aborted = true;
    if (this._breakpointResolve) {
      this._breakpointResolve();
      this._breakpointResolve = null;
    }
  }

  /**
   * Collect all downstream node IDs reachable from a given node,
   * following only edges that match the specified sourceHandle (if given).
   */
  _getDownstream(startNodeId, sourceHandle = null) {
    const downstream = new Set();
    const queue = [];

    const initialEdges = this.edges.filter((e) => {
      if (e.source !== startNodeId) return false;
      if (sourceHandle !== null) return e.sourceHandle === sourceHandle;
      return true;
    });

    for (const e of initialEdges) {
      if (!downstream.has(e.target)) {
        downstream.add(e.target);
        queue.push(e.target);
      }
    }

    while (queue.length > 0) {
      const current = queue.shift();
      for (const e of this.edges) {
        if (e.source === current && !downstream.has(e.target)) {
          downstream.add(e.target);
          queue.push(e.target);
        }
      }
    }

    return downstream;
  }

  async run() {
    this.aborted = false;
    this.nodeOutputs = {};
    this.variables = {};
    this.skippedNodes = new Set();

    const validation = validateFlow(this.nodes, this.edges);
    if (!validation.valid) {
      const msg = validation.errors.map((e) => e.message).join('\n');
      this.cb.onLog?.(`❌ 验证失败:\n${msg}`);
      throw new Error(msg);
    }

    const { sorted } = topologicalSort(this.nodes, this.edges);
    const nodeMap = new Map(this.nodes.map((n) => [n.id, n]));

    this.cb.onLog?.('🚀 开始执行流程...');

    for (const nodeId of sorted) {
      if (this.aborted) {
        this.cb.onLog?.('⛔ 流程已被终止');
        return;
      }

      const node = nodeMap.get(nodeId);
      if (!node) continue;

      if (this.skippedNodes.has(nodeId)) {
        this.cb.onNodeSkipped?.(nodeId);
        this.cb.onLog?.(`⏭️ ${getLabel(node)} 已跳过（未命中分支）`);
        continue;
      }

      if (node.data.breakpoint && node.type !== 'start') {
        this.cb.onLog?.(`⏸️ 命中断点: ${getLabel(node)}`);
        await new Promise((resolve) => {
          this._breakpointResolve = resolve;
          this.cb.onBreakpoint?.(nodeId, () => {
            this._breakpointResolve = null;
            resolve();
          });
        });
        if (this.aborted) return;
      }

      this.cb.onNodeStart?.(nodeId);
      const startTime = Date.now();

      try {
        const input = this.resolveInput(node);
        const output = await this.executeNode(node, input);
        const duration = Date.now() - startTime;

        this.nodeOutputs[nodeId] = output;
        this.cb.onNodeComplete?.(nodeId, { input, output, duration });
        this.cb.onLog?.(`✅ ${getLabel(node)} 完成 (${duration}ms)`);
      } catch (err) {
        const duration = Date.now() - startTime;
        this.cb.onNodeError?.(nodeId, err);
        this.cb.onLog?.(`❌ ${getLabel(node)} 失败: ${err.message} (${duration}ms)`);
        throw err;
      }
    }

    this.cb.onLog?.('🎉 流程执行完成');
  }

  resolveInput(node) {
    const upstreamEdges = this.edges.filter((e) => e.target === node.id);
    const inputs = {};
    for (const edge of upstreamEdges) {
      const upOutput = this.nodeOutputs[edge.source];
      if (upOutput !== undefined) {
        inputs[edge.source] = upOutput;
      }
    }
    return { upstreamOutputs: inputs, variables: { ...this.variables } };
  }

  async executeNode(node, input) {
    switch (node.type) {
      case 'start':
        return this.executeStart(node);
      case 'prompt':
        return this.executePrompt(node, input);
      case 'llm':
        return this.executeLLM(node, input);
      case 'condition':
        return this.executeCondition(node, input);
      case 'code':
        return this.executeCode(node, input);
      case 'output':
        return this.executeOutput(node, input);
      default:
        throw new Error(`未知节点类型: ${node.type}`);
    }
  }

  executeStart(node) {
    const vars = node.data.variables || [];
    for (const v of vars) {
      if (v.key) this.variables[v.key] = v.value || '';
    }
    return { variables: { ...this.variables } };
  }

  executePrompt(node, input) {
    const allVars = { ...this.variables };
    for (const [, val] of Object.entries(input.upstreamOutputs)) {
      if (typeof val === 'string') allVars.upstream = val;
      if (typeof val === 'object' && val.variables) Object.assign(allVars, val.variables);
      if (typeof val === 'object' && val.result) allVars.upstream = val.result;
    }

    const systemPrompt = interpolate(node.data.systemPrompt, allVars);
    const userPrompt = interpolate(node.data.userPrompt, allVars);

    return { systemPrompt, userPrompt };
  }

  async executeLLM(node, input) {
    let systemPrompt = '';
    let userPrompt = '';

    for (const [, val] of Object.entries(input.upstreamOutputs)) {
      if (val && typeof val === 'object') {
        if (val.systemPrompt) systemPrompt = val.systemPrompt;
        if (val.userPrompt) userPrompt = val.userPrompt;
      }
    }

    const result = await callLLM(systemPrompt, userPrompt, {
      model: node.data.model,
      apiKey: node.data.apiKey,
      temperature: node.data.temperature,
      maxTokens: node.data.maxTokens,
      customBaseURL: node.data.customBaseURL,
    });

    return { result };
  }

  executeCondition(node, input) {
    let upstreamValue = '';
    for (const [, val] of Object.entries(input.upstreamOutputs)) {
      if (typeof val === 'string') {
        upstreamValue = val;
      } else if (val && typeof val === 'object') {
        if (val.result) upstreamValue = String(val.result);
        else upstreamValue = JSON.stringify(val);
      }
    }

    const operator = node.data.operator || 'contains';
    const compareValue = node.data.value || '';
    let result = false;

    switch (operator) {
      case 'contains':
        result = upstreamValue.includes(compareValue);
        break;
      case 'equals':
        result = upstreamValue === compareValue;
        break;
      case 'not_empty':
        result = upstreamValue.trim().length > 0;
        break;
      case 'greater_than':
        result = parseFloat(upstreamValue) > parseFloat(compareValue);
        break;
      case 'less_than':
        result = parseFloat(upstreamValue) < parseFloat(compareValue);
        break;
      default:
        result = false;
    }

    const skipHandle = result ? 'false' : 'true';
    const skipDownstream = this._getDownstream(node.id, skipHandle);

    const keepHandle = result ? 'true' : 'false';
    const keepDownstream = this._getDownstream(node.id, keepHandle);

    for (const id of skipDownstream) {
      if (!keepDownstream.has(id)) {
        this.skippedNodes.add(id);
      }
    }

    return { conditionResult: result, upstreamValue, result: upstreamValue };
  }

  executeCode(node, input) {
    const code = node.data.code || '';
    if (!code.trim()) {
      throw new Error('代码节点内容为空');
    }

    try {
      const fn = new Function('input', code);
      const result = fn(input);
      return result !== undefined ? result : { result: undefined };
    } catch (err) {
      throw new Error(`代码执行错误: ${err.message}`);
    }
  }

  executeOutput(node, input) {
    let finalResult = '';
    for (const [, val] of Object.entries(input.upstreamOutputs)) {
      if (typeof val === 'string') finalResult = val;
      if (val && val.result) finalResult = val.result;
    }
    return finalResult;
  }
}

function getLabel(node) {
  const labels = {
    start: '开始',
    prompt: 'Prompt',
    llm: '大模型',
    condition: '条件分支',
    code: '代码',
    output: '输出',
  };
  return labels[node.type] || node.type;
}
