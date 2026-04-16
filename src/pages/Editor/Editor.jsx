import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ReactFlowProvider,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';
import styles from './Editor.module.css';
import EditorContext from './EditorContext';
import Toolbar from './components/Toolbar';
import NodePalette from './components/NodePalette';
import Canvas from './components/Canvas';
import ConfigPanel from './components/ConfigPanel';
import DebugPanel from './components/DebugPanel';
import useUndoRedo from './hooks/useUndoRedo';
import useFlowExecution from './hooks/useFlowExecution';

function EditorInner() {
  const { id: flowId } = useParams();
  const navigate = useNavigate();
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [flowName, setFlowName] = useState('未命名流程');
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [rightTab, setRightTab] = useState('config');
  const [toast, setToast] = useState(null);
  const snapshotTaken = useRef(false);

  // Load saved flow
  useEffect(() => {
    if (!flowId) return;
    try {
      const saved = JSON.parse(localStorage.getItem('flowagent_flows') || '[]');
      const flow = saved.find((f) => f.id === flowId);
      if (flow) {
        setNodes(flow.nodes || []);
        setEdges(flow.edges || []);
        setFlowName(flow.name || '未命名流程');
      }
    } catch { /* ignore parse errors */ }
  }, [flowId]);

  const { takeSnapshot, undo, redo, canUndo, canRedo } = useUndoRedo();

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const toggleBreakpoint = useCallback((nodeId) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, breakpoint: !n.data.breakpoint } }
          : n
      )
    );
  }, [])  ;

  const updateNodeStatus = useCallback((nodeId, status, extraData = {}) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, status, ...extraData } }
          : n
      )
    );
  }, []);

  const getNodes = useCallback(() => nodes, [nodes]);
  const getEdges = useCallback(() => edges, [edges]);

  const { run, stop, executionState } = useFlowExecution(
    getNodes,
    getEdges,
    updateNodeStatus
  );

  const isRunning = executionState.status === 'running' || executionState.status === 'paused';

  const onNodesChange = useCallback(
    (changes) => {
      const hasMeaningful = changes.some(
        (c) => c.type === 'position' || c.type === 'remove' || c.type === 'add'
      );
      if (hasMeaningful && !snapshotTaken.current) {
        takeSnapshot(nodes, edges);
        snapshotTaken.current = true;
        setTimeout(() => { snapshotTaken.current = false; }, 300);
      }
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    [nodes, edges, takeSnapshot]
  );

  const onEdgesChange = useCallback(
    (changes) => {
      const hasMeaningful = changes.some((c) => c.type === 'remove');
      if (hasMeaningful) takeSnapshot(nodes, edges);
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [nodes, edges, takeSnapshot]
  );

  const onConnect = useCallback(
    (params) => {
      takeSnapshot(nodes, edges);
      setEdges((eds) => addEdge({ ...params, animated: true }, eds));
    },
    [nodes, edges, takeSnapshot]
  );

  const onDropNode = useCallback(
    (newNode) => {
      takeSnapshot(nodes, edges);
      setNodes((nds) => [...nds, newNode]);
    },
    [nodes, edges, takeSnapshot]
  );

  const onNodeClick = useCallback((_, node) => {
    setSelectedNodeId(node.id);
    setRightTab('config');
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const onNodesDelete = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const onUpdateNodeData = useCallback((nodeId, newData) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, data: { ...newData } } : n))
    );
  }, []);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  const handleUndo = useCallback(() => {
    undo(nodes, edges, setNodes, setEdges);
  }, [nodes, edges, undo]);

  const handleRedo = useCallback(() => {
    redo(nodes, edges, setNodes, setEdges);
  }, [nodes, edges, redo]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleUndo, handleRedo]);

  const handleSave = useCallback(() => {
    const newId = flowId || `flow_${Date.now()}`;
    const flowData = {
      id: newId,
      name: flowName,
      nodes,
      edges,
      updatedAt: new Date().toISOString(),
    };
    const saved = JSON.parse(localStorage.getItem('flowagent_flows') || '[]');
    const existing = saved.findIndex((f) => f.id === flowData.id);
    if (existing >= 0) saved[existing] = flowData;
    else saved.push(flowData);
    localStorage.setItem('flowagent_flows', JSON.stringify(saved));

    if (!flowId) navigate(`/editor/${newId}`, { replace: true });
    showToast('保存成功', 'success');
  }, [flowId, flowName, nodes, edges, navigate, showToast]);

  const handleRun = useCallback(() => {
    if (nodes.length === 0) {
      showToast('画布现在为空，请先添加节点', 'error');
      return;
    }
    setRightTab('debug');
    setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, status: 'idle', outputResult: undefined, conditionResult: undefined } })));
    run();
  }, [run, nodes.length, showToast]);

  const editorCtx = useMemo(
    () => ({ toggleBreakpoint, isRunning }),
    [toggleBreakpoint, isRunning]
  );

  return (
    <EditorContext.Provider value={editorCtx}>
      <div className={styles.editor}>
        <Toolbar
          flowName={flowName}
          onNameChange={setFlowName}
          onSave={handleSave}
          onRun={handleRun}
          onStop={stop}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          isRunning={isRunning}
        />
        <div className={styles.body}>
          <NodePalette />
          <div className={styles.canvasArea}>
            <Canvas
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              onNodesDelete={onNodesDelete}
              onEdgesDelete={() => {}}
              onDropNode={onDropNode}
            />
          </div>
          <ConfigPanel
            selectedNode={selectedNode}
            onUpdateNodeData={onUpdateNodeData}
            activeTab={rightTab}
            onTabChange={setRightTab}
            isRunning={isRunning}
            debugPanel={<DebugPanel executionState={executionState} />}
          />
        </div>
        {toast && (
          <div className={`${styles.toast} ${styles[toast.type] || ''}`}>
            {toast.message}
          </div>
        )}
      </div>
    </EditorContext.Provider>
  );
}

export default function Editor() {
  return (
    <ReactFlowProvider>
      <EditorInner />
    </ReactFlowProvider>
  );
}
