import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Workflow, Trash2, Clock, GitBranch } from 'lucide-react';
import styles from './Workspace.module.css';

export default function Workspace() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [flows, setFlows] = useState(() =>
    JSON.parse(localStorage.getItem('flowagent_flows') || '[]')
  );

  const filtered = flows.filter(
    (f) => f.name.toLowerCase().includes(search.toLowerCase())
  );

  const deleteFlow = (id) => {
    const next = flows.filter((f) => f.id !== id);
    setFlows(next);
    localStorage.setItem('flowagent_flows', JSON.stringify(next));
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>工作空间</h1>
        <button className={styles.createBtn} onClick={() => navigate('/editor')}>
          <Plus size={16} />
          新建编排
        </button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <input
            className={styles.searchInput}
            placeholder="搜索流程..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className={styles.grid}>
          {filtered.map((flow) => (
            <div
              key={flow.id}
              className={styles.workflowCard}
              onClick={() => navigate(`/editor/${flow.id}`)}
            >
              <div className={styles.workflowHeader}>
                <GitBranch size={16} style={{ color: 'var(--accent)' }} />
                <div className={styles.workflowName}>{flow.name}</div>
                <button
                  className={styles.deleteBtn}
                  onClick={(e) => { e.stopPropagation(); deleteFlow(flow.id); }}
                  title="删除"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <div className={styles.workflowMeta}>
                <span><Workflow size={12} /> {flow.nodes?.length || 0} 个节点</span>
                <span><Clock size={12} /> {new Date(flow.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <Workflow size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <div className={styles.emptyTitle}>还没有保存的编排</div>
          <div className={styles.emptyDesc}>前往编辑器创建你的第一个 AI 工作流</div>
          <button className={styles.createBtn} onClick={() => navigate('/editor')}>
            <Plus size={16} /> 新建编排
          </button>
        </div>
      )}
    </div>
  );
}
