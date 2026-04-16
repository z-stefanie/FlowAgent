import { Handle, Position } from '@xyflow/react';
import { Code } from 'lucide-react';
import { useEditorContext } from '../EditorContext';
import styles from './nodeStyles.module.css';

export default function CodeNode({ id, data, selected }) {
  const status = data.status || 'idle';
  const { toggleBreakpoint } = useEditorContext();
  const code = data.code || '';

  const preview = code
    ? code.split('\n').slice(0, 2).join('\n')
    : '';

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
        <div className={`${styles.icon} ${styles.codeColor}`}>
          <Code size={13} />
        </div>
        <div className={styles.title}>代码</div>
        <div className={`${styles.status} ${styles[`status${status.charAt(0).toUpperCase() + status.slice(1)}`]}`} />
      </div>
      <div className={styles.body}>
        {preview ? (
          <pre className={styles.codePreview}>{preview}</pre>
        ) : (
          <span style={{ color: 'var(--text-tertiary)' }}>点击编写代码</span>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
