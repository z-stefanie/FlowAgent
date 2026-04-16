import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, Workflow, ArrowRight } from 'lucide-react';
import styles from './Home.module.css';

export default function Home() {
  const navigate = useNavigate();
  const saved = JSON.parse(localStorage.getItem('flowagent_flows') || '[]');
  const recent = saved.slice(-4).reverse();

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>可视化编排你的 AI Agent</h1>
          <p className={styles.heroSub}>
            FlowAgent 是一个支持条件分支的 Agent 工作流可视化编排与调试平台。
            通过拖拽节点、配置参数、实时调试，快速构建完整的 AI 工作流。
          </p>
          <button className={styles.heroBtn} onClick={() => navigate('/editor')}>
            <Plus size={16} />
            新建编排
          </button>
        </div>
      </div>

      <div className={styles.quickStart}>
        <div className={styles.quickCard} onClick={() => navigate('/editor')}>
          <div className={`${styles.quickIcon} ${styles.purple}`}>
            <Plus size={22} />
          </div>
          <div>
            <div className={styles.quickTitle}>新建编排</div>
            <div className={styles.quickDesc}>从零开始搭建 AI 工作流</div>
          </div>
        </div>
        <div className={styles.quickCard} onClick={() => navigate('/workspace')}>
          <div className={`${styles.quickIcon} ${styles.blue}`}>
            <FolderOpen size={22} />
          </div>
          <div>
            <div className={styles.quickTitle}>工作空间</div>
            <div className={styles.quickDesc}>管理已保存的编排流程</div>
          </div>
        </div>
      </div>

      {recent.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>最近编排</h2>
            <span className={styles.sectionLink} onClick={() => navigate('/workspace')}>
              查看全部 <ArrowRight size={14} style={{ verticalAlign: 'middle' }} />
            </span>
          </div>
          <div className={styles.activityList}>
            {recent.map((flow) => (
              <div
                key={flow.id}
                className={styles.activityItem}
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/editor/${flow.id}`)}
              >
                <div className={styles.activityDot} style={{ background: '#6c5ce7' }} />
                <div className={styles.activityText}>
                  <strong>{flow.name}</strong>
                  <span style={{ marginLeft: 8, color: 'var(--text-tertiary)', fontSize: 12 }}>
                    {flow.nodes?.length || 0} 个节点
                  </span>
                </div>
                <span className={styles.activityTime}>
                  {new Date(flow.updatedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>快速上手</h2>
        </div>
        <div className={styles.activityList}>
          <div className={styles.activityItem}>
            <div className={styles.activityDot} style={{ background: '#10b981' }} />
            <div className={styles.activityText}>
              <strong>① 拖拽节点</strong> — 从左侧面板拖拽开始、Prompt、大模型、输出节点到画布
            </div>
          </div>
          <div className={styles.activityItem}>
            <div className={styles.activityDot} style={{ background: '#3b82f6' }} />
            <div className={styles.activityText}>
              <strong>② 连线配置</strong> — 连接节点并在右侧面板配置参数和提示词
            </div>
          </div>
          <div className={styles.activityItem}>
            <div className={styles.activityDot} style={{ background: '#a855f7' }} />
            <div className={styles.activityText}>
              <strong>③ 运行调试</strong> — 一键运行查看每个节点的输入输出，支持断点调试
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
