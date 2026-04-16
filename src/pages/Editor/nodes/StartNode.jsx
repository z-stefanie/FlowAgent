import { Handle, Position } from '@xyflow/react';
import { PlayCircle } from 'lucide-react';
import styles from './nodeStyles.module.css';

export default function StartNode({ data, selected }) {
  const status = data.status || 'idle';
  const vars = data.variables || [];

  return (
    <div className={`${styles.node} ${selected ? styles.selected : ''} ${styles[status] || ''}`}>
      <div className={styles.header}>
        <div className={`${styles.icon} ${styles.startColor}`}>
          <PlayCircle size={13} />
        </div>
        <div className={styles.title}>开始节点</div>
        <div className={`${styles.status} ${styles[`status${status.charAt(0).toUpperCase() + status.slice(1)}`]}`} />
      </div>
      <div className={styles.body}>
        {vars.length > 0 ? (
          vars.map((v, i) => (
            <span key={i} className={`${styles.tag} ${styles.tagGreen}`}>
              {v.key}
            </span>
          ))
        ) : (
          <span style={{ color: 'var(--text-tertiary)' }}>点击配置输入变量</span>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
