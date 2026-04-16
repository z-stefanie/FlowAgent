import { describe, it, expect, vi } from 'vitest';
import FlowEngine from '../FlowEngine';

vi.mock('../llmService', () => ({
  callLLM: vi.fn(async () => '模拟 LLM 响应内容'),
}));

function makeNode(id, type, data = {}) {
  return { id, type, data: { ...data } };
}

function buildSimpleFlow() {
  // Start → Prompt → LLM → Output
  const nodes = [
    makeNode('s1', 'start', { variables: [{ key: 'user', value: '张三' }] }),
    makeNode('p1', 'prompt', { systemPrompt: '你好 {{user}}', userPrompt: '请介绍自己' }),
    makeNode('l1', 'llm', { model: 'gpt-4o' }),
    makeNode('o1', 'output', { format: 'text' }),
  ];
  const edges = [
    { source: 's1', target: 'p1' },
    { source: 'p1', target: 'l1' },
    { source: 'l1', target: 'o1' },
  ];
  return { nodes, edges };
}

describe('FlowEngine', () => {
  it('executes a complete Start → Prompt → LLM → Output flow', async () => {
    const { nodes, edges } = buildSimpleFlow();
    const completed = [];

    const engine = new FlowEngine(nodes, edges, {
      onNodeComplete(nodeId) { completed.push(nodeId); },
    });

    await engine.run();

    expect(completed).toEqual(['s1', 'p1', 'l1', 'o1']);
    expect(engine.nodeOutputs['o1']).toBe('模拟 LLM 响应内容');
  });

  it('interpolates {{variables}} in Prompt node templates', async () => {
    const { nodes, edges } = buildSimpleFlow();
    const results = {};

    const engine = new FlowEngine(nodes, edges, {
      onNodeComplete(nodeId, { output }) { results[nodeId] = output; },
    });

    await engine.run();

    expect(results['p1'].systemPrompt).toBe('你好 张三');
    expect(results['p1'].userPrompt).toBe('请介绍自己');
  });

  it('preserves unresolved placeholders when variable is missing', async () => {
    const nodes = [
      makeNode('s1', 'start', { variables: [] }),
      makeNode('p1', 'prompt', { systemPrompt: '你好 {{unknown}}', userPrompt: '' }),
      makeNode('o1', 'output', { format: 'text' }),
    ];
    const edges = [
      { source: 's1', target: 'p1' },
      { source: 'p1', target: 'o1' },
    ];
    const results = {};

    const engine = new FlowEngine(nodes, edges, {
      onNodeComplete(nodeId, { output }) { results[nodeId] = output; },
    });

    await engine.run();

    expect(results['p1'].systemPrompt).toBe('你好 {{unknown}}');
  });

  it('Start node populates variables correctly', async () => {
    const nodes = [
      makeNode('s1', 'start', {
        variables: [
          { key: 'name', value: 'Alice' },
          { key: 'lang', value: 'zh' },
        ],
      }),
      makeNode('o1', 'output', { format: 'text' }),
    ];
    const edges = [{ source: 's1', target: 'o1' }];
    const results = {};

    const engine = new FlowEngine(nodes, edges, {
      onNodeComplete(nodeId, { output }) { results[nodeId] = output; },
    });

    await engine.run();

    expect(results['s1'].variables).toEqual({ name: 'Alice', lang: 'zh' });
  });

  it('abort() stops execution mid-flow', async () => {
    const { nodes, edges } = buildSimpleFlow();
    const started = [];

    const engine = new FlowEngine(nodes, edges, {
      onNodeStart(nodeId) {
        started.push(nodeId);
        if (nodeId === 'p1') engine.abort();
      },
    });

    await engine.run();

    expect(started).toContain('s1');
    expect(started).toContain('p1');
    expect(started).not.toContain('l1');
  });

  it('throws on validation failure (missing start node)', async () => {
    const nodes = [
      makeNode('p1', 'prompt', { systemPrompt: 'hi', userPrompt: 'hello' }),
      makeNode('o1', 'output', { format: 'text' }),
    ];
    const edges = [{ source: 'p1', target: 'o1' }];

    const engine = new FlowEngine(nodes, edges, {});

    await expect(engine.run()).rejects.toThrow();
  });

  it('breakpoint pauses execution and resumes on callback', async () => {
    const { nodes, edges } = buildSimpleFlow();
    nodes[1].data.breakpoint = true; // breakpoint on Prompt node

    const completed = [];
    let capturedResume = null;

    const engine = new FlowEngine(nodes, edges, {
      onNodeComplete(nodeId) { completed.push(nodeId); },
      onBreakpoint(nodeId, resume) { capturedResume = resume; },
    });

    const runPromise = engine.run();

    // Wait a tick for engine to reach breakpoint
    await new Promise((r) => setTimeout(r, 50));

    expect(completed).toEqual(['s1']);
    expect(capturedResume).toBeTypeOf('function');

    capturedResume();
    await runPromise;

    expect(completed).toEqual(['s1', 'p1', 'l1', 'o1']);
  });

  it('throws on unknown node type', async () => {
    const nodes = [
      makeNode('s1', 'start', { variables: [] }),
      makeNode('x1', 'unknownType', {}),
      makeNode('o1', 'output', { format: 'text' }),
    ];
    const edges = [
      { source: 's1', target: 'x1' },
      { source: 'x1', target: 'o1' },
    ];

    const engine = new FlowEngine(nodes, edges, {});

    await expect(engine.run()).rejects.toThrow('未知节点类型');
  });
});
