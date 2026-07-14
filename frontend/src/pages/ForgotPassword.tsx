import React, { useState } from 'react';
import { Mail, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await api.post('/users/password-recovery', { email });
      setMessage(response.data.message);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ocurrió un error al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hltv-bg flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#1e2329] rounded-xl shadow-2xl p-8 border border-gray-800 animate-fade-in">
        <h2 className="text-3xl font-bold text-center text-hltv-textLight mb-2">
          Recuperar Contraseña
        </h2>
        <p className="text-center text-gray-400 mb-8 text-sm">
          Ingresa el correo electrónico asociado a tu cuenta y te enviaremos las instrucciones para restablecer tu contraseña.
        </p>

        {message && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{message}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#121519] border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-hltv-textLight focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="correo@ejemplo.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !!message}
            className={`w-full py-3 rounded-lg font-bold text-white transition-all duration-300 ${
              loading || !!message
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-hltv-accent hover:bg-hltv-accentHover shadow-[0_0_15px_rgba(33,150,243,0.3)]'
            }`}
          >
            {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
          </button>

          <div className="text-center">
            <Link 
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Volver al inicio de sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
