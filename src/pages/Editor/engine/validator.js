import topologicalSort from './topologicalSort';

/**
 * Validates a flow graph before execution.
 * Returns { valid, errors }.
 * Each error: { nodeId, message }
 */
export default function validateFlow(nodes, edges) {
  const errors = [];

  if (nodes.length === 0) {
    errors.push({ nodeId: null, message: '画布为空，请先添加节点' });
    return { valid: false, errors };
  }

  const startNodes = nodes.filter((n) => n.type === 'start');
  const outputNodes = nodes.filter((n) => n.type === 'output');

  if (startNodes.length === 0) {
    errors.push({ nodeId: null, message: '缺少开始节点' });
  }
  if (startNodes.length > 1) {
    errors.push({ nodeId: startNodes[1].id, message: '只能有一个开始节点' });
  }
  if (outputNodes.length === 0) {
    errors.push({ nodeId: null, message: '缺少输出节点' });
  }

  const { hasCycle } = topologicalSort(nodes, edges);
  if (hasCycle) {
    errors.push({ nodeId: null, message: '流程中存在循环依赖' });
  }

  const targetSet = new Set(edges.map((e) => e.target));
  const sourceSet = new Set(edges.map((e) => e.source));

  for (const node of nodes) {
    if (node.type !== 'start' && !targetSet.has(node.id)) {
      errors.push({ nodeId: node.id, message: `"${getNodeLabel(node)}" 没有输入连线` });
    }
    if (node.type !== 'output' && !sourceSet.has(node.id)) {
      errors.push({ nodeId: node.id, message: `"${getNodeLabel(node)}" 没有输出连线` });
    }

    const fieldErrors = validateNodeFields(node, edges);
    errors.push(...fieldErrors);
  }

  return { valid: errors.length === 0, errors };
}

function getNodeLabel(node) {
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

function validateNodeFields(node, edges) {
  const errors = [];
  const { data, type, id } = node;

  if (type === 'prompt') {
    if (!data.systemPrompt && !data.userPrompt) {
      errors.push({ nodeId: id, message: 'Prompt 节点至少需要填写一项提示词' });
    }
  }

  if (type === 'llm') {
    if (!data.model) {
      errors.push({ nodeId: id, message: '大模型节点需要选择模型' });
    }
  }

  if (type === 'condition') {
    const operator = data.operator || 'contains';
    if (operator !== 'not_empty' && !data.value) {
      errors.push({ nodeId: id, message: '条件分支节点需要填写比较值' });
    }
    const outEdges = edges.filter((e) => e.source === id);
    const hasTrue = outEdges.some((e) => e.sourceHandle === 'true');
    const hasFalse = outEdges.some((e) => e.sourceHandle === 'false');
    if (!hasTrue && !hasFalse) {
      errors.push({ nodeId: id, message: '条件分支节点至少需要连接一个分支出口' });
    }
  }

  if (type === 'code') {
    if (!data.code || !data.code.trim()) {
      errors.push({ nodeId: id, message: '代码节点内容不能为空' });
    }
  }

  return errors;
}
