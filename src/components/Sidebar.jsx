import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  {
    path: '/',
    label: 'Dashboard',
    icon: <span className="material-symbols-outlined">dashboard</span>,
  },
  {
    path: '/register',
    label: 'Register',
    icon: <span className="material-symbols-outlined">person_add</span>,
  },
  {
    path: '/checkin',
    label: 'Check-in',
    icon: <span className="material-symbols-outlined">how_to_reg</span>,
  },
  {
    path: '/logs',
    label: 'Access Logs',
    icon: <span className="material-symbols-outlined">list_alt</span>,
  },
  {
    path: '/pricing',
    label: 'Pricing',
    icon: <span className="material-symbols-outlined">payments</span>,
  },
];

export default function Sidebar() {
  return (
    <aside className="sidebar" id="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon material-symbols-outlined">bolt</span>
        <h1 className="logo-text">GymFlow</h1>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            id={`nav-${item.label.toLowerCase().replace(/\s/g, '')}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span className="sidebar-version">GymFlow v0.2</span>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const MOBILE_ITEMS = [
    { ...NAV_ITEMS[0], mobileLabel: 'Home' },
    { ...NAV_ITEMS[1], mobileLabel: 'Register' },
    { ...NAV_ITEMS[2], mobileLabel: 'Check-in' },
    { ...NAV_ITEMS[3], mobileLabel: 'Logs' },
    { ...NAV_ITEMS[4], mobileLabel: 'Pricing' },
  ];

  return (
    <nav className="mobile-nav" id="mobileNav">
      <div className="mobile-nav-items">
        {MOBILE_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `mobile-nav-item${isActive ? ' active' : ''}`
            }
          >
            {item.icon}
            {item.mobileLabel}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
