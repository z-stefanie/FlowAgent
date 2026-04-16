import { Handle, Position } from '@xyflow/react';
import { FileOutput } from 'lucide-react';
import { useEditorContext } from '../EditorContext';
import styles from './nodeStyles.module.css';

export default function OutputNode({ id, data, selected }) {
  const status = data.status || 'idle';
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
        <div className={`${styles.icon} ${styles.outputColor}`}>
          <FileOutput size={13} />
        </div>
        <div className={styles.title}>输出节点</div>
        <div className={`${styles.status} ${styles[`status${status.charAt(0).toUpperCase() + status.slice(1)}`]}`} />
      </div>
      <div className={styles.body}>
        {data.outputResult ? (
          <span style={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {data.outputResult}
          </span>
        ) : (
          <span style={{ color: 'var(--text-tertiary)' }}>等待运行结果</span>
        )}
      </div>
    </div>
  );
}
