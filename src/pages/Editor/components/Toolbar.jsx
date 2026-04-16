import { ArrowLeft, Undo2, Redo2, Play, Square, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './Toolbar.module.css';

export default function Toolbar({
  flowName,
  onNameChange,
  onSave,
  onRun,
  onStop,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isRunning,
}) {
  const navigate = useNavigate();

  return (
    <div className={styles.toolbar}>
      <div className={styles.left}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          <ArrowLeft size={16} />
        </button>
        <input
          className={styles.nameInput}
          value={flowName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="未命名流程"
        />
      </div>

      <div className={styles.center}>
        <button
          className={styles.iconBtn}
          onClick={onUndo}
          disabled={!canUndo}
          title="撤销 (Ctrl+Z)"
        >
          <Undo2 size={15} />
        </button>
        <button
          className={styles.iconBtn}
          onClick={onRedo}
          disabled={!canRedo}
          title="重做 (Ctrl+Shift+Z)"
        >
          <Redo2 size={15} />
        </button>
      </div>

      <div className={styles.right}>
        <button className={styles.saveBtn} onClick={onSave}>
          <Save size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
          保存
        </button>
        {isRunning ? (
          <button className={`${styles.runBtn} ${styles.running}`} onClick={onStop}>
            <Square size={13} />
            停止
          </button>
        ) : (
          <button className={styles.runBtn} onClick={onRun}>
            <Play size={13} />
            运行
          </button>
        )}
      </div>
    </div>
  );
}
