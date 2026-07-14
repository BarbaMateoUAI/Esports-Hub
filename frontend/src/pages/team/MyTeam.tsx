import { useEffect, useState, useRef } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Camera, Shield, Trophy, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MyTeam() {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [team, setTeam] = useState<any>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [renegotiatePlayer, setRenegotiatePlayer] = useState<any>(null);
  const [offerSalary, setOfferSalary] = useState<number>(0);
  const [offerDuration, setOfferDuration] = useState<number>(6);
  const [offerBuyout, setOfferBuyout] = useState<number | ''>('');
  const [isOffering, setIsOffering] = useState(false);
  
  const [name, setName] = useState('');
  const [country, setCountry] = useState('US');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const getRemainingContractTime = (contract: any) => {
    let endDate = contract.end_date ? new Date(contract.end_date) : null;
    
    if (!endDate && contract.start_date) {
        endDate = new Date(contract.start_date);
        endDate.setMonth(endDate.getMonth() + contract.duration_months);
    }
    
    if (!endDate) {
        return `${contract.duration_months} meses`;
    }

    const now = new Date();
    let months = (endDate.getFullYear() - now.getFullYear()) * 12;
    months -= now.getMonth();
    months += endDate.getMonth();
    
    if (months < 0) months = 0;
    
    const formattedDate = endDate.toLocaleDateString('es-ES', { month: '2-digit', year: 'numeric' });
    
    return `${months} meses (${formattedDate})`;
  };

  useEffect(() => {
    if (!isAuthenticated || role !== 'TeamOwner') {
      navigate('/');
      return;
    }
    fetchTeam();
  }, [isAuthenticated, role, navigate]);

  const fetchTeam = async () => {
    try {
      const res = await api.get('/teams/mine');
      setTeam(res.data);
      setName(res.data.name);
      setCountry(res.data.country);

      const offersRes = await api.get('/market/my-offers');
      const activeContracts = offersRes.data.contracts.filter((c: any) => c.status === 'ACTIVE');
      setRoster(activeContracts);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setIsCreating(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('country', country);
      if (selectedFile) formData.append('logo', selectedFile);
      
      const res = await api.post('/teams/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setTeam(res.data);
      setIsCreating(false);
      alert('Equipo creado exitosamente');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error creando equipo');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) {
      alert('Error: No se encontró el equipo para editar.');
      return;
    }
    try {
      const formData = new FormData();
      if (name !== team.name) formData.append('name', name);
      if (country !== team.country) formData.append('country', country);
      if (selectedFile) formData.append('logo', selectedFile);
      
      const res = await api.put('/teams/mine', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setTeam(res.data);
      setIsEditing(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      alert('Equipo actualizado exitosamente');
    } catch (err: any) {
      console.error(err);
      if (err.response) {
        alert(`Error ${err.response.status}: ${JSON.stringify(err.response.data)}`);
      } else {
        alert(`Error de red o CORS: ${err.message}`);
      }
    }
  };

  const handleRenegotiate = async () => {
    if (!renegotiatePlayer) return;
    setIsOffering(true);
    try {
      await api.post('/market/offer/contract', {
        salary: offerSalary,
        duration_months: offerDuration,
        buyout_clause: offerBuyout === '' ? null : offerBuyout,
        pro_id: renegotiatePlayer.pro.id
      });
      alert('Oferta de renovación enviada al jugador');
      setRenegotiatePlayer(null);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al enviar oferta');
    } finally {
      setIsOffering(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Cargando...</div>;

  if (isCreating || isEditing) {
    return (
      <div className="max-w-xl mx-auto p-4 py-12">
        <div className="bg-[#1c2026] border border-gray-800 rounded-xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <Trophy className="w-16 h-16 text-hltv-accent mx-auto mb-4" />
            <h1 className="text-3xl font-black text-white uppercase tracking-wider">
              {isEditing ? 'Editar Franquicia' : 'Crear Franquicia'}
            </h1>
            <p className="text-gray-400 mt-2">
              {isEditing ? 'Actualiza la información de tu equipo.' : 'Fundarás tu equipo desde cero.'}
            </p>
          </div>
          
          <form onSubmit={isEditing ? handleEdit : handleCreate} className="space-y-6">
            <div className="flex justify-center mb-6">
              <div 
                className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-600 flex items-center justify-center overflow-hidden cursor-pointer group relative bg-[#121519]"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Logo preview" className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="text-center text-gray-500 group-hover:text-hltv-accent transition-colors">
                    <Camera className="w-8 h-8 mx-auto mb-2" />
                    <span className="text-xs font-bold uppercase">Subir Logo</span>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nombre del Equipo</label>
              <input
                required
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-[#121519] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-hltv-accent focus:ring-1 transition-colors"
                placeholder="e.g. Natus Vincere"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">País</label>
              <select
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="w-full bg-[#121519] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-hltv-accent focus:ring-1 transition-colors appearance-none"
              >
                <option value="AR">Argentina</option>
                <option value="BR">Brasil</option>
                <option value="ES">España</option>
                <option value="US">Estados Unidos</option>
                <option value="MX">México</option>
                <option value="FR">Francia</option>
                <option value="DK">Dinamarca</option>
              </select>
            </div>

            <div className="flex gap-4">
              {isEditing && (
                <button 
                  type="button" 
                  onClick={() => {
                    setIsEditing(false);
                    setName(team.name);
                    setCountry(team.country);
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="w-1/3 bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-wider transition-colors"
                >
                  Cancelar
                </button>
              )}
              <button type="submit" className={`${isEditing ? 'w-2/3' : 'w-full'} bg-hltv-accent hover:bg-hltv-accentHover text-white px-8 py-3 rounded-xl font-bold uppercase tracking-wider transition-colors`}>
                {isEditing ? 'Guardar Cambios' : 'Fundar Equipo'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 py-8">
      <div className="bg-[#1c2026] border border-gray-800 rounded-xl overflow-hidden shadow-lg mb-8">
        <div className="bg-gradient-to-r from-gray-900 to-[#121519] p-8 flex items-center gap-8 border-b border-gray-800">
          <div className="w-32 h-32 bg-[#0d1015] rounded-xl flex items-center justify-center p-4 border border-gray-800 shadow-inner">
            {team?.logo_url ? (
              <img src={team.logo_url} alt={team.name} className="max-w-full max-h-full object-contain" />
            ) : (
              <Shield className="w-16 h-16 text-gray-600" />
            )}
          </div>
          <div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tight">{team?.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="bg-gray-800 px-3 py-1 rounded text-xs font-bold text-gray-300 uppercase">
                {team?.country}
              </span>
              <span className="text-hltv-accent font-bold text-sm">Equipo Propio</span>
              <button 
                onClick={() => setIsEditing(true)}
                className="ml-4 text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-white font-bold uppercase transition-colors"
              >
                Editar
              </button>
            </div>
          </div>
        </div>
        <div className="p-8">
          <h2 className="text-xl font-bold text-white mb-4 border-l-4 border-hltv-accent pl-3">Roster Actual</h2>
          {roster.length === 0 ? (
            <div className="bg-[#121519] border border-gray-800 rounded-xl p-8 text-center">
              <p className="text-gray-500 font-medium">Aún no hay jugadores contratados en la alineación.</p>
              <button onClick={() => navigate('/scouting')} className="mt-4 px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded font-bold text-sm transition-colors">
                Ir a Scouting
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {roster.map((c: any) => (
                <div key={c.id} className="bg-[#121519] border border-gray-800 rounded-xl p-6 flex justify-between items-center shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded bg-[#0d1015] border border-gray-700 overflow-hidden">
                      {c.pro?.photo_url ? (
                        <img src={c.pro.photo_url} alt={c.pro.nickname} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs font-bold">PRO</div>
                      )}
                    </div>
                    <div>
                      <div className="text-white font-bold text-lg">{c.pro?.nickname}</div>
                      <div className="text-gray-400 text-xs">{c.pro?.full_name}</div>
                      <div className="flex gap-3 mt-1 items-center">
                        <span className="text-hltv-accent font-bold text-xs">Salario: ${c.salary}</span>
                        {c.buyout_clause && <span className="text-blue-400 font-bold text-xs">Cláusula: ${c.buyout_clause}</span>}
                        <span className="text-gray-400 font-bold text-xs bg-gray-800 px-2 py-0.5 rounded">Contrato: {getRemainingContractTime(c)}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setRenegotiatePlayer(c);
                      setOfferSalary(c.salary);
                      setOfferDuration(c.duration_months);
                      setOfferBuyout(c.buyout_clause || '');
                    }}
                    className="px-4 py-2 bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white rounded font-bold text-sm uppercase transition-colors"
                  >
                    Renegociar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {renegotiatePlayer && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c2026] border border-gray-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 bg-gradient-to-r from-gray-900 to-[#121519] border-b border-gray-800 flex justify-between items-center">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Renegociar Contrato</h2>
              <button onClick={() => setRenegotiatePlayer(null)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <p className="text-gray-400 text-sm">
                Envía una nueva oferta a <span className="text-white font-bold">{renegotiatePlayer.pro?.nickname}</span>. Si el jugador la acepta, reemplazará su contrato actual.
              </p>
              
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Nuevo Salario Mensual (USD)</label>
                <input 
                  type="number" 
                  value={offerSalary} 
                  onChange={e => setOfferSalary(Number(e.target.value))}
                  className="w-full bg-[#121519] border border-gray-700 rounded p-3 text-white focus:border-hltv-accent focus:outline-none"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Nueva Duración (Meses)</label>
                <input 
                  type="number" 
                  value={offerDuration} 
                  onChange={e => setOfferDuration(Number(e.target.value))}
                  className="w-full bg-[#121519] border border-gray-700 rounded p-3 text-white focus:border-hltv-accent focus:outline-none"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Nueva Cláusula (USD) - Opcional</label>
                <input 
                  type="number" 
                  value={offerBuyout} 
                  onChange={e => setOfferBuyout(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-[#121519] border border-gray-700 rounded p-3 text-white focus:border-hltv-accent focus:outline-none"
                  min="0"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-800 flex gap-3">
              <button 
                onClick={() => setRenegotiatePlayer(null)}
                className="flex-1 py-3 font-bold text-gray-400 uppercase tracking-wider hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleRenegotiate}
                disabled={isOffering}
                className="flex-1 py-3 bg-hltv-accent hover:bg-hltv-accentHover text-white font-bold uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50"
              >
                {isOffering ? 'Enviando...' : 'Enviar Oferta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
