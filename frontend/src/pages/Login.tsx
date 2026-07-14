import React, { useState } from 'react';
import { Mail, Lock, ShieldCheck, LogIn, KeyRound } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      const response = await api.post('/users/login', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const { access_token, role } = response.data;
      login(access_token, role);
      
      if (role === 'Administrator') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error de conexión o credenciales inválidas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-hltv-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos decorativos */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-hltv-accent/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full bg-[#1c2026]/90 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] p-8 border border-gray-800 relative z-10">
        
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-hltv-accent to-orange-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-6 transition-transform duration-300">
            <KeyRound className="text-white w-8 h-8" />
          </div>
        </div>

        <h2 className="text-3xl font-black text-center text-white mb-2 tracking-tight">
          Iniciar Sesión
        </h2>
        <p className="text-gray-400 text-center mb-8 text-sm">
          Ingresa a tu cuenta de E-Sports Hub
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-3 animate-fade-in text-sm font-medium">
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
              Correo Electrónico / Usuario
            </label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-hltv-accent transition-colors" />
              <input
                type="text"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#121519] border border-gray-700 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-hltv-accent focus:ring-1 focus:ring-hltv-accent transition-all duration-300 shadow-inner"
                placeholder="jugador@equipo.com o admin"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
              Contraseña
            </label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-hltv-accent transition-colors" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#121519] border border-gray-700 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-hltv-accent focus:ring-1 focus:ring-hltv-accent transition-all duration-300 shadow-inner"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-bold text-white mt-4 flex items-center justify-center gap-2 transition-all duration-300 ${
              loading 
                ? 'bg-gray-700 cursor-not-allowed' 
                : 'bg-gradient-to-r from-hltv-accent to-orange-500 hover:from-hltv-accentHover hover:to-orange-400 shadow-[0_0_20px_rgba(234,88,12,0.3)] hover:shadow-[0_0_30px_rgba(234,88,12,0.5)] transform hover:-translate-y-0.5'
            }`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Ingresar al Hub
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-gray-800 pt-6 space-y-4">
          <Link to="/forgot-password" className="text-sm text-gray-400 hover:text-white transition-colors block">
            ¿Olvidaste tu contraseña?
          </Link>
          <p className="text-gray-400 text-sm">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-hltv-accent font-bold hover:text-hltv-accentHover transition-colors">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
