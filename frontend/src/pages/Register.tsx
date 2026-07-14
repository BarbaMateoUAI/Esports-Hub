import React, { useState } from 'react';
import { Gamepad2, ShieldCheck, Mail, Lock, User, UserSquare2, Crown, ArrowRight, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const CS2_ROLES = ["Entry", "AWP", "Support", "Lurker", "IGL"];

export default function Register() {
  const navigate = useNavigate();
  
  const [mode, setMode] = useState<'regular' | 'advanced'>('regular');
  const [profileType, setProfileType] = useState<'pro' | 'owner'>('pro');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  
  const toggleRole = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'regular') {
        await api.post('/users/register/user', {
          email,
          password
        });
      } else {
        if (profileType === 'pro') {
          await api.post('/users/register/pro', {
            user: { email, password },
            profile: {
              full_name: fullName,
              nickname,
              age: parseInt(age),
              roles_in_game: selectedRoles
            }
          });
        } else {
          await api.post('/users/register/owner', {
            user: { email, password },
            profile: {
              full_name: fullName
            }
          });
        }
      }
      
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hltv-bg flex flex-col items-center justify-center p-4">
      <div className="max-w-xl w-full bg-[#1e2329] rounded-xl shadow-2xl p-8 border border-gray-800">
        <h2 className="text-3xl font-bold text-center text-hltv-textLight mb-2">
          {mode === 'regular' ? 'Crear Cuenta' : 'Join the Arena'}
        </h2>
        <p className="text-center text-gray-400 mb-8">
          {mode === 'regular' 
            ? 'Regístrate para interactuar con la comunidad.' 
            : 'Crea un perfil avanzado de Jugador o Dueño.'}
        </p>

        {/* Profile Selector (Only for Advanced Mode) */}
        {mode === 'advanced' && (
          <div className="flex gap-4 mb-8 animate-fade-in">
            <button
              type="button"
              onClick={() => setProfileType('pro')}
              className={`flex-1 flex flex-col items-center p-4 rounded-lg border-2 transition-all duration-300 ${
                profileType === 'pro' 
                  ? 'border-blue-500 bg-blue-500/10 text-blue-400' 
                  : 'border-gray-700 hover:border-gray-600 text-gray-400'
              }`}
            >
              <Gamepad2 className="w-8 h-8 mb-2" />
              <span className="font-semibold">Pro Player</span>
            </button>
            
            <button
              type="button"
              onClick={() => setProfileType('owner')}
              className={`flex-1 flex flex-col items-center p-4 rounded-lg border-2 transition-all duration-300 ${
                profileType === 'owner' 
                  ? 'border-orange-500 bg-orange-500/10 text-orange-400' 
                  : 'border-gray-700 hover:border-gray-600 text-gray-400'
              }`}
            >
              <Crown className="w-8 h-8 mb-2" />
              <span className="font-semibold">Team Owner</span>
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            {mode === 'advanced' && (
              <h3 className="text-xl text-hltv-textLight border-b border-gray-700 pb-2">Account Details</h3>
            )}
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
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

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-400 mb-1">Contraseña</label>
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
            </div>
          </div>

          {/* Advanced Profile Details */}
          {mode === 'advanced' && (
            <div className="space-y-4 pt-4 animate-fade-in">
              <h3 className="text-xl text-hltv-textLight border-b border-gray-700 pb-2">
                {profileType === 'pro' ? 'Player Profile' : 'Owner Profile'}
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    required={mode === 'advanced'}
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full bg-[#121519] border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-hltv-textLight focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {profileType === 'pro' && (
                <>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-400 mb-1">Nickname</label>
                      <div className="relative">
                        <UserSquare2 className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                        <input
                          type="text"
                          required={mode === 'advanced' && profileType === 'pro'}
                          value={nickname}
                          onChange={e => setNickname(e.target.value)}
                          className="w-full bg-[#121519] border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-hltv-textLight focus:outline-none focus:border-blue-500 transition-colors"
                          placeholder="s1mple"
                        />
                      </div>
                    </div>

                    <div className="flex-[0.5]">
                      <label className="block text-sm font-medium text-gray-400 mb-1">Age</label>
                      <input
                        type="number"
                        required={mode === 'advanced' && profileType === 'pro'}
                        min="13"
                        max="99"
                        value={age}
                        onChange={e => setAge(e.target.value)}
                        className="w-full bg-[#121519] border border-gray-700 rounded-lg py-2.5 px-4 text-hltv-textLight focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="21"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">CS2 Roles</label>
                    <div className="flex flex-wrap gap-2">
                      {CS2_ROLES.map(role => (
                        <button
                          type="button"
                          key={role}
                          onClick={() => toggleRole(role)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                            selectedRoles.includes(role)
                              ? 'bg-blue-600 border-blue-500 text-white'
                              : 'bg-[#121519] border-gray-700 text-gray-400 hover:border-gray-500'
                          }`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-bold text-white mt-8 transition-all duration-300 ${
              loading 
                ? 'bg-gray-600 cursor-not-allowed' 
                : mode === 'regular'
                  ? 'bg-hltv-accent hover:bg-hltv-accentHover shadow-[0_0_15px_rgba(33,150,243,0.3)]'
                  : profileType === 'pro'
                    ? 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)]'
                    : 'bg-orange-600 hover:bg-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.4)] hover:shadow-[0_0_25px_rgba(234,88,12,0.6)]'
            }`}
          >
            {loading ? 'Procesando...' : mode === 'regular' ? 'Registrarse' : 'Crear Cuenta Avanzada'}
          </button>
          
          {/* Toggle Mode Link */}
          <div className="text-center mt-6">
            {mode === 'regular' ? (
              <button
                type="button"
                onClick={() => setMode('advanced')}
                className="text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto group"
              >
                Crear cuenta profesional/dueño
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMode('regular')}
                className="text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Volver al registro común
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
