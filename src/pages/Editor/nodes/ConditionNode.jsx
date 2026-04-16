import { Handle, Position } from '@xyflow/react';
import { GitBranch } from 'lucide-react';
import { useEditorContext } from '../EditorContext';
import styles from './nodeStyles.module.css';

const OPERATOR_LABELS = {
  contains: '包含',
  equals: '等于',
  not_empty: '不为空',
  greater_than: '大于',
  less_than: '小于',
};

export default function ConditionNode({ id, data, selected }) {
  const status = data.status || 'idle';
  const { toggleBreakpoint } = useEditorContext();
  const operator = data.operator || 'contains';

  const conditionSummary = operator === 'not_empty'
    ? '上游输出 不为空'
    : `上游输出 ${OPERATOR_LABELS[operator] || operator} "${data.value || '...'}"`;

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
        <div className={`${styles.icon} ${styles.conditionColor}`}>
          <GitBranch size={13} />
        </div>
        <div className={styles.title}>条件分支</div>
        <div className={`${styles.status} ${styles[`status${status.charAt(0).toUpperCase() + status.slice(1)}`]}`} />
      </div>
      <div className={styles.body}>
        <span style={{ fontSize: 10.5 }}>{conditionSummary}</span>
        {data.conditionResult !== undefined && (
          <div style={{ marginTop: 4 }}>
            <span className={`${styles.tag} ${data.conditionResult ? styles.tagGreen : styles.tagRed}`}>
              {data.conditionResult ? '✓ True' : '✗ False'}
            </span>
          </div>
        )}
      </div>
      <div className={styles.handleRow}>
        <Handle
          type="source"
          position={Position.Bottom}
          id="true"
          className={styles.handleTrue}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="false"
          className={styles.handleFalse}
        />
      </div>
      <div className={styles.handleLabels}>
        <span className={styles.handleLabelTrue}>True</span>
        <span className={styles.handleLabelFalse}>False</span>
      </div>
    </div>
  );
}
