import { PlayCircle, MessageSquare, Brain, GitBranch, Code, FileOutput } from 'lucide-react';
import styles from './NodePalette.module.css';

const NODE_TYPES = [
  {
    type: 'start',
    label: '开始节点',
    desc: '流程入口',
    icon: PlayCircle,
    colorClass: styles.startColor,
  },
  {
    type: 'prompt',
    label: 'Prompt 节点',
    desc: '提示词模板',
    icon: MessageSquare,
    colorClass: styles.promptColor,
  },
  {
    type: 'llm',
    label: '大模型节点',
    desc: '调用 AI 模型',
    icon: Brain,
    colorClass: styles.llmColor,
  },
  {
    type: 'condition',
    label: '条件分支',
    desc: '按条件走不同路径',
    icon: GitBranch,
    colorClass: styles.conditionColor,
  },
  {
    type: 'code',
    label: '代码节点',
    desc: '执行 JS 逻辑',
    icon: Code,
    colorClass: styles.codeColor,
  },
  {
    type: 'output',
    label: '输出节点',
    desc: '展示结果',
    icon: FileOutput,
    colorClass: styles.outputColor,
  },
];

export default function NodePalette() {
  const onDragStart = (e, nodeType) => {
    e.dataTransfer.setData('application/reactflow-type', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className={styles.palette}>
      <div className={styles.header}>节点面板</div>
      <div className={styles.list}>
        {NODE_TYPES.map((node) => (
          <div
            key={node.type}
            className={styles.nodeItem}
            draggable
            onDragStart={(e) => onDragStart(e, node.type)}
          >
            <div className={`${styles.nodeIcon} ${node.colorClass}`}>
              <node.icon size={16} />
            </div>
            <div className={styles.nodeInfo}>
              <div className={styles.nodeName}>{node.label}</div>
              <div className={styles.nodeDesc}>{node.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
