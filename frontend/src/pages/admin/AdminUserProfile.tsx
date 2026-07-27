import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Save, UserCog, Lock, Briefcase, FileText } from 'lucide-react';

interface FullUserData {
  user: {
    id: number;
    email: string;
    role: { name: string } | null;
  };
  profile: {
    id: number;
    full_name: string;
    nickname: string;
    country: string;
    birth_date: string;
    roles_in_game: string[];
  } | null;
  contract: {
    id: number;
    salary: number;
    duration_months: number;
    buyout_clause: number;
    start_date: string;
    end_date: string;
    team: { name: string } | null;
  } | null;
}

export default function AdminUserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<FullUserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    nickname: '',
    country: '',
    birth_date: '',
    roles_in_game: [] as string[],
    salary: 0,
    duration_months: 0,
    buyout_clause: 0,
    start_date: '',
    end_date: ''
  });
  
  const [initialData, setInitialData] = useState<any>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const CS2_ROLES = ["Entry", "AWP", "Support", "Lurker", "IGL", "Coach", "Analyst"];
  const COUNTRIES = [
    { code: "ARG", name: "Argentina" },
    { code: "BOL", name: "Bolivia" },
    { code: "BRA", name: "Brasil" },
    { code: "CHL", name: "Chile" },
    { code: "COL", name: "Colombia" },
    { code: "CRI", name: "Costa Rica" },
    { code: "CUB", name: "Cuba" },
    { code: "ECU", name: "Ecuador" },
    { code: "SLV", name: "El Salvador" },
    { code: "ESP", name: "España" },
    { code: "USA", name: "Estados Unidos" },
    { code: "GTM", name: "Guatemala" },
    { code: "HND", name: "Honduras" },
    { code: "MEX", name: "México" },
    { code: "NIC", name: "Nicaragua" },
    { code: "PAN", name: "Panamá" },
    { code: "PRY", name: "Paraguay" },
    { code: "PER", name: "Perú" },
    { code: "PRI", name: "Puerto Rico" },
    { code: "DOM", name: "República Dominicana" },
    { code: "URY", name: "Uruguay" },
    { code: "VEN", name: "Venezuela" },
    { code: "OTR", name: "Otro" }
  ];

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/users/${id}/full`);
      const d = res.data;
      setData(d);
      
      const loadedData = {
        email: d.user.email,
        password: '',
        full_name: d.profile?.full_name || '',
        nickname: d.profile?.nickname || '',
        country: d.profile?.country || '',
        birth_date: d.profile?.birth_date || '',
        roles_in_game: d.profile?.roles_in_game || [],
        salary: d.contract?.salary || 0,
        duration_months: d.contract?.duration_months || 0,
        buyout_clause: d.contract?.buyout_clause || 0,
        start_date: d.contract?.start_date ? d.contract.start_date.split('T')[0] : '',
        end_date: d.contract?.end_date ? d.contract.end_date.split('T')[0] : ''
      };
      setFormData(loadedData);
      setInitialData(loadedData);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error cargando datos del usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = (role: string) => {
    setFormData(prev => ({
      ...prev,
      roles_in_game: prev.roles_in_game.includes(role)
        ? prev.roles_in_game.filter(r => r !== role)
        : [...prev.roles_in_game, role]
    }));
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value;
    setFormData(prev => {
      const state = { ...prev, start_date: newStart };
      if (newStart && state.duration_months > 0) {
        const start = new Date(newStart);
        start.setUTCMonth(start.getUTCMonth() + state.duration_months);
        state.end_date = start.toISOString().split('T')[0];
      }
      return state;
    });
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDuration = Number(e.target.value);
    setFormData(prev => {
      const state = { ...prev, duration_months: newDuration };
      if (state.start_date) {
        const start = new Date(state.start_date);
        start.setUTCMonth(start.getUTCMonth() + newDuration);
        state.end_date = start.toISOString().split('T')[0];
      }
      return state;
    });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = e.target.value;
    setFormData(prev => {
      const state = { ...prev, end_date: newEnd };
      if (state.start_date && newEnd) {
        const start = new Date(state.start_date);
        const end = new Date(newEnd);
        let months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + (end.getUTCMonth() - start.getUTCMonth());
        if (end.getUTCDate() < start.getUTCDate()) months--;
        state.duration_months = months > 0 ? months : 0;
      }
      return state;
    });
  };

  const hasUnsavedChanges = () => {
    return initialData && JSON.stringify(formData) !== JSON.stringify(initialData);
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formData, initialData]);

  const handleLeaveRequest = (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (hasUnsavedChanges()) {
      setShowLeaveModal(true);
    } else {
      navigate('/admin/users');
    }
  };

  const handleSaveRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSaveModal(true);
  };

  const handleSave = async () => {
    setShowSaveModal(false);
    try {
      setSaving(true);
      const payload: any = {
        email: formData.email
      };
      
      if (formData.password) {
        payload.password = formData.password;
      }
      
      if (data?.profile) {
        payload.profile = {
          full_name: formData.full_name,
          nickname: formData.nickname,
          country: formData.country,
          birth_date: formData.birth_date || null,
          roles_in_game: formData.roles_in_game
        };
      }
      
      if (data?.contract) {
        payload.contract = {
          salary: formData.salary,
          duration_months: formData.duration_months,
          buyout_clause: formData.buyout_clause,
          start_date: formData.start_date ? formData.start_date : null,
          end_date: formData.end_date ? formData.end_date : null
        };
      }

      await api.put(`/admin/users/${id}/full`, payload);
      alert('Cambios guardados con éxito');
      navigate('/admin/users');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error guardando datos');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-gray-400 p-8">Cargando...</div>;
  if (error || !data) return <div className="text-red-400 p-8">{error}</div>;

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={handleLeaveRequest}
            className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-white">Editar Usuario</h2>
            <p className="text-sm text-gray-500">Superuser Override</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="px-6 py-2.5 rounded font-bold transition-colors bg-gray-800 hover:bg-gray-700 text-white"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSaveRequest}
            disabled={saving}
            className="flex items-center gap-2 bg-hltv-accent hover:bg-hltv-accentHover text-white px-6 py-2.5 rounded font-bold transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1c2026] border border-gray-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">¿Guardar Cambios?</h3>
            <p className="text-gray-400 mb-6">Estás a punto de sobrescribir los datos oficiales de este usuario. Esta acción modificará su perfil y contrato activo sin mediación.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 rounded font-bold text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-2 rounded font-bold bg-hltv-accent hover:bg-hltv-accentHover text-white transition-colors"
              >
                Confirmar Guardado
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1c2026] border border-gray-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">¿Cancelar edición?</h3>
            <p className="text-gray-400 mb-6">Estás a punto de cancelar la edición. Si tienes cambios sin guardar, se perderán.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded font-bold text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Volver a editar
              </button>
              <button 
                onClick={() => navigate('/admin/users')}
                className="px-4 py-2 rounded font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              >
                Sí, cancelar y salir
              </button>
            </div>
          </div>
        </div>
      )}

      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1c2026] border border-red-900/50 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-red-400 mb-2">Tienes cambios sin guardar</h3>
            <p className="text-gray-400 mb-6">Si sales ahora, todos los cambios que realizaste en el perfil y contrato se perderán para siempre.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowLeaveModal(false)}
                className="px-4 py-2 rounded font-bold text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Volver
              </button>
              <button 
                onClick={() => navigate('/admin/users')}
                className="px-4 py-2 rounded font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              >
                Continuar sin guardar
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSaveRequest} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Login Section */}
        <div className="bg-[#1c2026] border border-gray-800 rounded-xl overflow-hidden shadow-lg">
          <div className="p-4 bg-[#232830] border-b border-gray-800 flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-bold text-white uppercase tracking-wider">Datos de Acceso</h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Correo Electrónico</label>
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-[#121519] border border-gray-700 text-white px-4 py-2.5 rounded focus:border-hltv-accent focus:ring-1 focus:ring-hltv-accent outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Forzar Nueva Contraseña</label>
              <input 
                type="password" 
                placeholder="Dejar en blanco para no cambiarla"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full bg-[#121519] border border-gray-700 text-white px-4 py-2.5 rounded focus:border-hltv-accent focus:ring-1 focus:ring-hltv-accent outline-none placeholder:text-gray-600"
              />
            </div>
            <div className="pt-2">
              <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Rol en Sistema (Solo Lectura)</label>
              <div className="bg-[#121519] border border-gray-700 text-gray-400 px-4 py-2.5 rounded font-bold uppercase tracking-wider text-sm">
                {data.user.role?.name || 'Sin Rol'}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Section */}
        {data.profile && (
          <div className="bg-[#1c2026] border border-gray-800 rounded-xl overflow-hidden shadow-lg">
            <div className="p-4 bg-[#232830] border-b border-gray-800 flex items-center gap-2">
              <UserCog className="w-5 h-5 text-hltv-accent" />
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">Perfil Público / Jugador</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Nombre Completo</label>
                <input 
                  type="text" 
                  required
                  value={formData.full_name}
                  onChange={e => setFormData({...formData, full_name: e.target.value})}
                  className="w-full bg-[#121519] border border-gray-700 text-white px-4 py-2.5 rounded focus:border-hltv-accent focus:ring-1 focus:ring-hltv-accent outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Alias (In-Game)</label>
                <input 
                  type="text" 
                  required
                  value={formData.nickname}
                  onChange={e => setFormData({...formData, nickname: e.target.value})}
                  className="w-full bg-[#121519] border border-gray-700 text-white px-4 py-2.5 rounded focus:border-hltv-accent focus:ring-1 focus:ring-hltv-accent outline-none font-bold text-hltv-accent"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">País</label>
                <select 
                  required
                  value={formData.country}
                  onChange={e => setFormData({...formData, country: e.target.value})}
                  className="w-full bg-[#121519] border border-gray-700 text-white px-4 py-2.5 rounded focus:border-hltv-accent focus:ring-1 focus:ring-hltv-accent outline-none appearance-none"
                >
                  <option value="" disabled>Seleccione un país</option>
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Fecha de Nacimiento</label>
                <input 
                  type="date" 
                  required
                  value={formData.birth_date}
                  onChange={e => setFormData({...formData, birth_date: e.target.value})}
                  className="w-full bg-[#121519] border border-gray-700 text-gray-400 px-4 py-2.5 rounded focus:border-hltv-accent focus:ring-1 focus:ring-hltv-accent outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Roles en el Juego (CS2)</label>
                <div className="flex flex-wrap gap-2">
                  {CS2_ROLES.map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleRoleToggle(role)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                        formData.roles_in_game.includes(role)
                          ? 'bg-hltv-accent/20 border-hltv-accent text-hltv-accent'
                          : 'bg-transparent border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-300'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contract Section */}
        {data.contract ? (
          <div className="bg-[#1c2026] border border-gray-800 rounded-xl overflow-hidden shadow-lg col-span-full" style={{ gridColumn: '1 / -1' }}>
            <div className="p-4 bg-[#232830] border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-hltv-accent" />
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Contrato Activo</h3>
              </div>
              <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-bold uppercase rounded">
                Equipo: {data.contract.team?.name || 'Desconocido'}
              </span>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Salario Mensual (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                  <input 
                    type="number" 
                    min="0"
                    required
                    value={formData.salary}
                    onChange={e => setFormData({...formData, salary: Number(e.target.value)})}
                    className="w-full bg-[#121519] border border-gray-700 text-white pl-8 pr-4 py-2.5 rounded focus:border-hltv-accent focus:ring-1 focus:ring-hltv-accent outline-none font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Cláusula de Rescisión</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                  <input 
                    type="number" 
                    min="0"
                    required
                    value={formData.buyout_clause}
                    onChange={e => setFormData({...formData, buyout_clause: Number(e.target.value)})}
                    className="w-full bg-[#121519] border border-gray-700 text-white pl-8 pr-4 py-2.5 rounded focus:border-hltv-accent focus:ring-1 focus:ring-hltv-accent outline-none font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Duración (Meses)</label>
                <input 
                  type="number" 
                  min="0"
                  required
                  value={formData.duration_months}
                  onChange={handleDurationChange}
                  className="w-full bg-[#121519] border border-gray-700 text-white px-4 py-2.5 rounded focus:border-hltv-accent focus:ring-1 focus:ring-hltv-accent outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Inicio del Contrato</label>
                <input 
                  type="date" 
                  required
                  value={formData.start_date}
                  onChange={handleStartDateChange}
                  className="w-full bg-[#121519] border border-gray-700 text-gray-400 px-4 py-2.5 rounded focus:border-hltv-accent focus:ring-1 focus:ring-hltv-accent outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Fin del Contrato</label>
                <input 
                  type="date" 
                  required
                  value={formData.end_date}
                  onChange={handleEndDateChange}
                  className="w-full bg-[#121519] border border-gray-700 text-gray-400 px-4 py-2.5 rounded focus:border-hltv-accent focus:ring-1 focus:ring-hltv-accent outline-none"
                />
              </div>
              </div>
              <div className="bg-red-900/10 border border-red-900/30 p-4 rounded-lg flex items-start gap-3">
                <FileText className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-red-400 font-bold text-sm">Advertencia de Edición</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Modificar estos valores alterará directamente el contrato oficial firmado sin pasar por un proceso de negociación. Utilice esta herramienta únicamente para corregir errores administrativos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#1c2026] border border-gray-800 rounded-xl overflow-hidden shadow-lg flex flex-col items-center justify-center p-8 text-center h-full min-h-[250px] col-span-full" style={{ gridColumn: '1 / -1' }}>
            <Briefcase className="w-12 h-12 text-gray-700 mb-4" />
            <h3 className="text-lg font-bold text-gray-400">Sin Contrato Activo</h3>
            <p className="text-sm text-gray-600 mt-2">Este usuario es un agente libre o no pertenece a ningún equipo actualmente.</p>
          </div>
        )}

      </form>
    </div>
  );
}
