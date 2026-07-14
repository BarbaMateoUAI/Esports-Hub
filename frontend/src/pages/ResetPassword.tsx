import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('El enlace de recuperación es inválido o ha expirado. Falta el token de seguridad.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await api.post('/users/reset-password', { 
        token,
        new_password: password
      });
      setMessage(response.data.message);
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ocurrió un error al restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hltv-bg flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#1e2329] rounded-xl shadow-2xl p-8 border border-gray-800 animate-fade-in">
        <h2 className="text-3xl font-bold text-center text-hltv-textLight mb-2">
          Nueva Contraseña
        </h2>
        <p className="text-center text-gray-400 mb-8 text-sm">
          Ingresa tu nueva contraseña para acceder nuevamente a tu cuenta.
        </p>

        {message && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 flex flex-col items-center text-center gap-2">
            <ShieldCheck className="w-8 h-8 flex-shrink-0" />
            <p className="text-sm font-bold">{message}</p>
            <p className="text-xs">Serás redirigido al inicio de sesión...</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {(!message && token) && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Nueva Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-[#121519] border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-hltv-textLight focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Confirmar Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#121519] border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-hltv-textLight focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-bold text-white transition-all duration-300 ${
                loading
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-hltv-accent hover:bg-hltv-accentHover shadow-[0_0_15px_rgba(33,150,243,0.3)]'
              }`}
            >
              {loading ? 'Guardando...' : 'Restablecer contraseña'}
            </button>
          </form>
        )}

        {(!token) && (
          <div className="text-center mt-6">
            <Link 
              to="/forgot-password"
              className="inline-flex items-center gap-2 text-sm text-hltv-accent hover:text-white transition-colors group"
            >
              Solicitar un nuevo enlace
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
