import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const nav = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/datasets', label: 'Datasets' },
  { to: '/history', label: 'Transformation History' },
  { to: '/profile', label: 'Profile' },
];

export default function Layout() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 flex-shrink-0 flex-col bg-slate-900 text-slate-100 md:flex">
        <div className="border-b border-slate-700 px-5 py-6">
          <p className="text-xs uppercase tracking-wider text-slate-400">Data Platform</p>
          <h2 className="text-lg font-semibold">Dataset Prep</h2>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
          {hasRole('ADMIN') && (
            <NavLink
              to="/admin/configs"
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`
              }
            >
              Transform Configs
            </NavLink>
          )}
        </nav>
        <div className="border-t border-slate-700 p-4 text-sm">
          <p className="font-medium">{user?.full_name}</p>
          <p className="text-slate-400">{user?.role?.replace(/_/g, ' ')}</p>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="mt-3 text-xs text-brand-100 hover:underline"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
