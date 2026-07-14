import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LogOut, UserCircle } from 'lucide-react';

const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      className={`px-4 py-4 font-bold text-sm uppercase tracking-wide border-b-2 transition-colors duration-200 ${
        isActive 
          ? 'text-white border-hltv-accent bg-[#1c2026]' 
          : 'text-hltv-text border-transparent hover:text-white hover:bg-[#1c2026] hover:border-hltv-text'
      }`}
    >
      {children}
    </Link>
  );
};

const NavBar = () => {
  const { isAuthenticated, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-hltv-header border-b border-hltv-border sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-14">
          
          {/* Logo y Enlaces Principales */}
          <div className="flex items-center h-full">
            <Link to="/" className="flex items-center mr-8 gap-2 group">
              <div className="w-8 h-8 bg-hltv-accent rounded flex items-center justify-center font-black italic text-white shadow transform group-hover:scale-105 transition-transform">
                E-S
              </div>
              <span className="font-bold text-xl tracking-tight hidden sm:block text-white group-hover:text-hltv-accent transition-colors">
                E-SPORTS
              </span>
            </Link>

            {/* Links de navegación (HLTV Style) */}
            <div className="hidden md:flex h-full space-x-1">
              <NavLink to="/">Partidos</NavLink>
              <NavLink to="/resultados">Resultados</NavLink>
              <NavLink to="/torneos">Torneos</NavLink>
              
              {role === 'TeamOwner' && (
                <>
                  <NavLink to="/my-team">Mi Equipo</NavLink>
                  <NavLink to="/scouting">Scouting</NavLink>
                </>
              )}
              
              {role === 'ProPlayer' && (
                <NavLink to="/pro-team">Mi Equipo</NavLink>
              )}
              
              {(role === 'TeamOwner' || role === 'ProPlayer') && (
                <NavLink to="/offers">Ofertas</NavLink>
              )}
              
              {role === 'Admin' && (
                <NavLink to="/admin">Panel Admin</NavLink>
              )}
            </div>
          </div>

          {/* Sección de Usuario */}
          <div className="flex items-center h-full gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <Link to="/profile" className="hidden sm:flex items-center gap-2 text-sm hover:bg-[#232830] p-2 rounded transition-colors cursor-pointer">
                  <UserCircle className="w-5 h-5 text-gray-400" />
                  <div className="flex flex-col">
                    <span className="text-gray-300 font-medium leading-none">Mi Cuenta</span>
                    <span className="text-xs text-hltv-accent font-bold mt-1">{role}</span>
                  </div>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-gray-300 hover:text-white font-bold text-sm px-3 py-2 transition-colors"
                >
                  Entrar
                </Link>
                <Link 
                  to="/register" 
                  className="bg-hltv-accent hover:bg-hltv-accentHover text-white px-5 py-2 rounded font-bold text-sm transition-colors duration-200 shadow-md shadow-hltv-accent/20 transform hover:-translate-y-0.5"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};

const Home = () => (
  <div className="p-8 max-w-7xl mx-auto">
    <h1 className="text-2xl font-bold mb-4 border-l-4 border-hltv-accent pl-3 text-white">Partidos Próximos</h1>
    <div className="bg-[#1c2026] border border-gray-800 rounded-md p-6 text-center text-gray-400 shadow-lg">
      Aquí se listarán los partidos futuros...
    </div>
  </div>
);

const Resultados = () => (
  <div className="p-8 max-w-7xl mx-auto">
    <h1 className="text-2xl font-bold mb-4 border-l-4 border-hltv-accent pl-3 text-white">Resultados (Demos)</h1>
    <div className="bg-[#1c2026] border border-gray-800 rounded-md p-6 text-center text-gray-400 shadow-lg">
      Partidos finalizados con sus demos parseadas...
    </div>
  </div>
);

const Torneos = () => (
  <div className="p-8 max-w-7xl mx-auto">
    <h1 className="text-2xl font-bold mb-4 border-l-4 border-hltv-accent pl-3 text-white">Torneos Activos</h1>
    <div className="bg-[#1c2026] border border-gray-800 rounded-md p-6 text-center text-gray-400 shadow-lg">
      Llaves, grupos y posiciones...
    </div>
  </div>
);

import AdminDashboard from './pages/admin/AdminDashboard';
import Profile from './pages/Profile';
import MyTeam from './pages/team/MyTeam';
import ProTeam from './pages/team/ProTeam';
import Scouting from './pages/team/Scouting';
import Offers from './pages/team/Offers';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-[#0d1015] flex flex-col font-sans">
          <NavBar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/resultados" element={<Resultados />} />
              <Route path="/torneos" element={<Torneos />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/admin/*" element={<AdminDashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/my-team" element={<MyTeam />} />
              <Route path="/pro-team" element={<ProTeam />} />
              <Route path="/scouting" element={<Scouting />} />
              <Route path="/offers" element={<Offers />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
