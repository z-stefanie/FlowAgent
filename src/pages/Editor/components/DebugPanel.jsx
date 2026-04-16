import { useState, useEffect, useRef } from 'react';
import { Play, Bug } from 'lucide-react';
import styles from './DebugPanel.module.css';

const STATUS_LABELS = {
  idle: '就绪',
  running: '运行中',
  success: '完成',
  error: '失败',
  paused: '已暂停',
  skipped: '已跳过',
};

const STATUS_COLORS = {
  idle: '#5a5a6e',
  running: '#3b82f6',
  success: '#10b981',
  error: '#ef4444',
  paused: '#f59e0b',
  skipped: '#6b7280',
};

export default function DebugPanel({ executionState }) {
  const {
    status = 'idle',
    nodeStatuses = {},
    nodeResults = {},
    logs = [],
    elapsedMs = 0,
    pausedNodeId = null,
    onResume = null,
  } = executionState || {};

  const [expanded, setExpanded] = useState({});
  const logRef = useRef(null);

  useEffect(() => {
    logRef.current?.scrollTo(0, logRef.current.scrollHeight);
  }, [logs.length]);

  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const nodeEntries = Object.entries(nodeStatuses);

  if (status === 'idle' && nodeEntries.length === 0) {
    return (
      <div className={styles.emptyDebug}>
        <Bug size={20} />
        <span>点击「运行」执行流程</span>
      </div>
    );
  }

  const formatTime = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className={styles.debug}>
      <div className={styles.summary}>
        <span className={`${styles.statusTag} ${styles[status]}`}>
          {STATUS_LABELS[status]}
        </span>
        <span className={styles.timer}>{formatTime(elapsedMs)}</span>
      </div>

      {pausedNodeId && onResume && (
        <button className={styles.resumeBtn} onClick={onResume}>
          <Play size={12} /> 继续执行
        </button>
      )}

      <div className={styles.nodeResults}>
        {nodeEntries.map(([nodeId, nodeStatus]) => {
          const result = nodeResults[nodeId];
          const isExpanded = expanded[nodeId];

          return (
            <div key={nodeId} className={styles.nodeResult}>
              <div
                className={styles.nodeResultHeader}
                onClick={() => toggle(nodeId)}
              >
                <div
                  className={styles.nodeResultDot}
                  style={{ background: STATUS_COLORS[nodeStatus] }}
                />
                <div className={styles.nodeResultName}>
                  {result?.label || nodeId}
                </div>
                {result?.duration != null && (
                  <span className={styles.nodeResultDuration}>
                    {formatTime(result.duration)}
                  </span>
                )}
              </div>

              {isExpanded && result && (
                <div className={styles.nodeResultBody}>
                  {result.skipped && (
                    <div className={styles.ioSection}>
                      <div className={styles.ioContent} style={{ color: '#6b7280', fontStyle: 'italic' }}>
                        未命中条件分支，已跳过执行
                      </div>
                    </div>
                  )}
                  {result.input && (
                    <div className={styles.ioSection}>
                      <div className={styles.ioLabel}>输入</div>
                      <div className={styles.ioContent}>
                        {typeof result.input === 'string'
                          ? result.input
                          : JSON.stringify(result.input, null, 2)}
                      </div>
                    </div>
                  )}
                  {result.output && (
                    <div className={styles.ioSection}>
                      <div className={styles.ioLabel}>输出</div>
                      <div className={styles.ioContent}>
                        {typeof result.output === 'string'
                          ? result.output
                          : JSON.stringify(result.output, null, 2)}
                      </div>
                      {result.output.conditionResult !== undefined && (
                        <div style={{
                          marginTop: 6,
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          background: result.output.conditionResult
                            ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: result.output.conditionResult ? '#10b981' : '#ef4444',
                        }}>
                          判断结果: {result.output.conditionResult ? '✓ True → 左侧分支' : '✗ False → 右侧分支'}
                        </div>
                      )}
                    </div>
                  )}
                  {result.error && (
                    <div className={styles.ioSection}>
                      <div className={styles.ioLabel}>错误</div>
                      <div className={styles.ioContent} style={{ color: 'var(--danger)' }}>
                        {result.error}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {logs.length > 0 && (
        <div className={styles.logSection} ref={logRef}>
          <div className={styles.logHeader}>执行日志</div>
          {logs.map((log, i) => (
            <div key={i} className={styles.logLine}>{log}</div>
          ))}
        </div>
      )}
    </div>
  );
}
