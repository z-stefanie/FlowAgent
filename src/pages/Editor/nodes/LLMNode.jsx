import { Handle, Position } from '@xyflow/react';
import { Brain } from 'lucide-react';
import { useEditorContext } from '../EditorContext';
import styles from './nodeStyles.module.css';

const MODEL_LABELS = {
  'gpt-4o': 'GPT-4o',
  'gpt-4o-mini': 'GPT-4o mini',
  'deepseek-chat': 'DeepSeek V3',
  'deepseek-reasoner': 'DeepSeek R1',
  'doubao-pro-32k': 'Doubao Pro',
  'doubao-lite-32k': 'Doubao Lite',
  'moonshot-v1-8k': 'Moonshot 8K',
  'moonshot-v1-32k': 'Moonshot 32K',
  'GPT-4o': 'GPT-4o',
  'GPT-4o mini': 'GPT-4o mini',
  'Claude 3.5 Sonnet': 'Claude 3.5',
  'Doubao Pro': 'Doubao Pro',
  'Moonshot': 'Moonshot',
};

export default function LLMNode({ id, data, selected }) {
  const status = data.status || 'idle';
  const modelId = data.model || 'gpt-4o';
  const modelLabel = MODEL_LABELS[modelId] || modelId;
  const { toggleBreakpoint } = useEditorContext();

  return (
    <div className={`${styles.node} ${selected ? styles.selected : ''} ${styles[status] || ''}`}>
      <div
        onClick={(e) => {
          e.stopPropagation();
          toggleBreakpoint(id);
        }}
        className={`${styles.breakpointBtn} ${data.breakpoint ? styles.active : ''}`}
        title="断点"
      />
      <Handle type="target" position={Position.Top} />
      <div className={styles.header}>
        <div className={`${styles.icon} ${styles.llmColor}`}>
          <Brain size={13} />
        </div>
        <div className={styles.title}>大模型调用</div>
        <div className={`${styles.status} ${styles[`status${status.charAt(0).toUpperCase() + status.slice(1)}`]}`} />
      </div>
      <div className={styles.body}>
        <span className={`${styles.tag} ${styles.tagPurple}`}>{modelLabel}</span>
        {data.temperature != null && (
          <span className={`${styles.tag} ${styles.tagBlue}`}>
            temp: {data.temperature}
          </span>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
