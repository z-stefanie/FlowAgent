import { Handle, Position } from '@xyflow/react';
import { MessageSquare } from 'lucide-react';
import { useEditorContext } from '../EditorContext';
import styles from './nodeStyles.module.css';

export default function PromptNode({ id, data, selected }) {
  const status = data.status || 'idle';
  const prompt = data.systemPrompt || '';
  const { toggleBreakpoint } = useEditorContext();

  return (
    <div className={`${styles.node} ${selected ? styles.selected : ''} ${styles[status] || ''}`}>
      <div
        className={`${styles.breakpointBtn} ${data.breakpoint ? styles.active : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          toggleBreakpoint(id);
        }}
        title="断点"
      />
      <Handle type="target" position={Position.Top} />
      <div className={styles.header}>
        <div className={`${styles.icon} ${styles.promptColor}`}>
          <MessageSquare size={13} />
        </div>
        <div className={styles.title}>Prompt</div>
        <div className={`${styles.status} ${styles[`status${status.charAt(0).toUpperCase() + status.slice(1)}`]}`} />
      </div>
      <div className={styles.body}>
        {prompt ? (
          <span style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {prompt}
          </span>
        ) : (
          <span style={{ color: 'var(--text-tertiary)' }}>点击编写提示词</span>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
