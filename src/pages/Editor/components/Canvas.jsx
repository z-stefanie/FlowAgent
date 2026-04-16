import { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import styles from './Canvas.module.css';

import StartNode from '../nodes/StartNode';
import PromptNode from '../nodes/PromptNode';
import LLMNode from '../nodes/LLMNode';
import ConditionNode from '../nodes/ConditionNode';
import CodeNode from '../nodes/CodeNode';
import OutputNode from '../nodes/OutputNode';

const nodeTypes = {
  start: StartNode,
  prompt: PromptNode,
  llm: LLMNode,
  condition: ConditionNode,
  code: CodeNode,
  output: OutputNode,
};

const defaultNodeData = {
  start: { variables: [], status: 'idle' },
  prompt: { systemPrompt: '', userPrompt: '', status: 'idle' },
  llm: { model: 'gpt-4o', temperature: 0.7, maxTokens: 2048, status: 'idle' },
  condition: { operator: 'contains', value: '', status: 'idle' },
  code: { code: '// 通过 input 获取上游数据，return 返回结果\nconst { upstreamOutputs, variables } = input;\nreturn { result: "processed" };', status: 'idle' },
  output: { format: 'text', status: 'idle' },
};

let idCounter = 0;
const getId = () => `node_${Date.now()}_${idCounter++}`;

const VALID_TARGETS = {
  start: ['prompt', 'llm', 'condition', 'code', 'output'],
  prompt: ['llm', 'condition', 'code', 'output'],
  llm: ['output', 'prompt', 'condition', 'code'],
  condition: ['prompt', 'llm', 'condition', 'code', 'output'],
  code: ['prompt', 'llm', 'condition', 'code', 'output'],
  output: [],
};

export default function Canvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onPaneClick,
  onNodesDelete,
  onEdgesDelete,
  onDropNode,
}) {
  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition } = useReactFlow();

  const isValidConnection = useCallback(
    (connection) => {
      if (connection.source === connection.target) return false;
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);
      if (!sourceNode || !targetNode) return false;
      const allowed = VALID_TARGETS[sourceNode.type];
      if (allowed && !allowed.includes(targetNode.type)) return false;
      const duplicate = edges.some(
        (e) => e.source === connection.source && e.target === connection.target
      );
      return !duplicate;
    },
    [nodes, edges]
  );

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('application/reactflow-type');
      if (!type) return;

      const position = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      const newNode = {
        id: getId(),
        type,
        position,
        data: { ...defaultNodeData[type] },
      };

      onDropNode(newNode);
    },
    [screenToFlowPosition, onDropNode]
  );

  return (
    <div className={styles.canvasWrapper} ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        isValidConnection={isValidConnection}
        fitView
        deleteKeyCode={['Backspace', 'Delete']}
        snapToGrid
        snapGrid={[16, 16]}
      >
        <Background gap={16} size={1} color="var(--border)" />
        <Controls
          showInteractive={false}
          style={{ bottom: 16, left: 16 }}
        />
        <MiniMap
          style={{ bottom: 16, right: 16, background: 'var(--bg-secondary)' }}
          maskColor="rgba(15, 15, 20, 0.7)"
          nodeColor="var(--accent)"
        />
      </ReactFlow>
    </div>
  );
}
