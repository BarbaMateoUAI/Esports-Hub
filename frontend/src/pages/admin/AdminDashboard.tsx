import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Users, Shield, TrendingUp } from 'lucide-react';
import ManageUsers from './ManageUsers';
import ManageRoles from './ManageRoles';
import AdminReports from './AdminReports';

export default function AdminDashboard() {
  const { role, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || role !== 'Admin') {
    return <Navigate to="/" replace />;
  }

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const isActive = location.pathname === to || location.pathname === `${to}/`;
    return (
      <Link 
        to={to} 
        className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all duration-200 ${
          isActive 
            ? 'bg-hltv-accent text-white shadow-md shadow-hltv-accent/20' 
            : 'text-gray-400 hover:text-white hover:bg-[#232830]'
        }`}
      >
        <Icon className="w-5 h-5" />
        {label}
      </Link>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
      {/* Sidebar Admin */}
      <aside className="w-full md:w-64 flex-shrink-0 space-y-2 bg-[#1c2026] border border-gray-800 rounded-xl p-4 self-start">
        <div className="mb-6 px-2">
          <h2 className="text-xs font-black text-gray-500 uppercase tracking-wider">Admin Panel</h2>
        </div>
        <nav className="flex flex-col space-y-1">
          <NavItem to="/admin/users" icon={Users} label="Usuarios" />
          <NavItem to="/admin/roles" icon={Shield} label="Roles y Permisos" />
          <NavItem to="/admin/reports" icon={TrendingUp} label="Reportes" />
        </nav>
      </aside>

      {/* Contenido Principal Admin */}
      <main className="flex-1 bg-[#0d1015] rounded-xl">
        <Routes>
          <Route path="/" element={<Navigate to="/admin/users" replace />} />
          <Route path="/users" element={<ManageUsers />} />
          <Route path="/roles" element={<ManageRoles />} />
          <Route path="/reports" element={<AdminReports />} />
        </Routes>
      </main>
    </div>
  );
}
