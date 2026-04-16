import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  FolderOpen,
  Plus,
  Settings,
  Workflow,
} from 'lucide-react';
import styles from './Sidebar.module.css';

const mainNav = [
  { to: '/', icon: Home, label: '首页' },
  { to: '/workspace', icon: FolderOpen, label: '工作空间' },
];

export default function Sidebar() {
  const navigate = useNavigate();

  let recentFlows = [];
  try {
    recentFlows = JSON.parse(localStorage.getItem('flowagent_flows') || '[]')
      .slice(-3)
      .reverse();
  } catch { /* ignore */ }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo} onClick={() => navigate('/')}>
        <div className={styles.logoIcon}>F</div>
        <span className={styles.logoText}>FlowAgent</span>
      </div>

      <nav className={styles.nav}>
        <div className={styles.navSection}>
          {mainNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
            >
              <item.icon className={styles.navIcon} />
              <span className={styles.navLabel}>{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className={styles.divider} />

        <div className={styles.navSection}>
          <button
            className={styles.navItem}
            onClick={() => navigate('/editor')}
          >
            <Plus className={styles.navIcon} />
            <span className={styles.navLabel}>新建编排</span>
          </button>
        </div>

        {recentFlows.length > 0 && (
          <>
            <div className={styles.divider} />
            <div className={styles.navSection}>
              <div className={styles.navSectionTitle}>最近编排</div>
              {recentFlows.map((flow) => (
                <button
                  key={flow.id}
                  className={styles.navItem}
                  onClick={() => navigate(`/editor/${flow.id}`)}
                >
                  <Workflow className={styles.navIcon} />
                  <span className={styles.navLabel}>{flow.name}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </nav>

      <div className={styles.userSection}>
        <div className={styles.userCard}>
          <div className={styles.avatar}>U</div>
          <div>
            <div className={styles.userName}>User</div>
            <div className={styles.userEmail}>user@flowagent.dev</div>
          </div>
          <Settings size={16} style={{ color: 'var(--text-tertiary)' }} />
        </div>
      </div>
    </aside>
  );
}
