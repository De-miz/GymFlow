import { Outlet } from 'react-router-dom';
import Sidebar, { MobileNav } from './Sidebar';

export default function Layout() {
  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content" id="mainContent">
        <Outlet />
      </main>

      <MobileNav />
    </div>
  );
}
