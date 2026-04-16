import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import styles from './Layout.module.css';

const fullWidthRoutes = ['/editor'];

export default function Layout() {
  const location = useLocation();
  const isFullWidth = fullWidthRoutes.some((r) => location.pathname.startsWith(r));

  return (
    <div className={styles.layout}>
      {!isFullWidth && <Sidebar />}
      <main className={`${styles.main} ${isFullWidth ? styles.fullWidth : ''}`}>
        <Outlet />
      </main>
    </div>
  );
}
