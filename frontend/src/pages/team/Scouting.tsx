import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Search, Filter, ShieldCheck, Euro, ChevronDown, ChevronUp, User, Clock, FileText } from 'lucide-react';

export default function Scouting() {
  const { isAuthenticated, role } = useAuth();

  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [rolesFilter, setRolesFilter] = useState<string[]>([]);
  const [minAge, setMinAge] = useState<string>('');
  const [maxAge, setMaxAge] = useState<string>('');
  const [teamNameFilter, setTeamNameFilter] = useState('');
  const [isFreeAgent, setIsFreeAgent] = useState(false);

  const [teams, setTeams] = useState<any[]>([]);

  const [selectedDetailPlayer, setSelectedDetailPlayer] = useState<any | null>(null);

  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);
  const [offerAmount, setOfferAmount] = useState<number>(0);
  const [durationMonths, setDurationMonths] = useState<number>(6);
  const [buyoutClause, setBuyoutClause] = useState<number | ''>('');
  const [isOffering, setIsOffering] = useState(false);

  useEffect(() => {
    fetchPlayers();
  }, [search, statusFilter, rolesFilter, minAge, maxAge, teamNameFilter, isFreeAgent]);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await api.get('/teams');
      setTeams(res.data);
    } catch (err) {
      console.error('Error fetching teams', err);
    }
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 'N/A';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const fetchPlayers = async () => {
    try {
      const rolesQuery = rolesFilter.length > 0 ? `&roles=${rolesFilter.join(',')}` : '';
      const minAgeQuery = minAge ? `&min_age=${minAge}` : '';
      const maxAgeQuery = maxAge ? `&max_age=${maxAge}` : '';
      const teamQuery = teamNameFilter ? `&team_name=${teamNameFilter}` : '';
      const statusF = isFreeAgent ? 'free' : statusFilter;

      const res = await api.get(`/market/players?search=${search}&filter_status=${statusF}${rolesQuery}${minAgeQuery}${maxAgeQuery}${teamQuery}`);
      setPlayers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOffer = async () => {
    if (!selectedPlayer) return;
    setIsOffering(true);

    try {
      if (selectedPlayer.team) {
        await api.post('/market/offer/transfer', {
          amount: offerAmount,
          pro_id: selectedPlayer.pro.id,
          to_team_id: selectedPlayer.team.id
        });
        alert('Oferta de traspaso enviada al equipo dueño');
      } else {
        await api.post('/market/offer/contract', {
          salary: offerAmount,
          duration_months: durationMonths,
          buyout_clause: buyoutClause === '' ? null : buyoutClause,
          pro_id: selectedPlayer.pro.id
        });
        alert('Oferta de contrato enviada al jugador');
      }
      setSelectedPlayer(null);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al enviar oferta');
    } finally {
      setIsOffering(false);
    }
  };

  if (!isAuthenticated || role !== 'TeamOwner') {
    return <div className="p-8 text-center text-red-500">Acceso denegado</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 py-8 relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">Scouting</h1>
          <p className="text-gray-400 mt-1">Busca y ofrece contratos a los mejores talentos.</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-6 relative z-20">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#1c2026] border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:border-hltv-accent focus:ring-1 focus:outline-none transition-colors"
              placeholder="Buscar por nombre o apodo..."
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-[#1c2026] border border-gray-800 rounded-xl px-6 py-3 text-white flex items-center gap-2 hover:bg-gray-800/50 transition-colors font-bold"
          >
            <Filter className="w-5 h-5 text-gray-500" />
            Filtros
            {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
          </button>
        </div>

        {showFilters && (
          <div className="absolute top-full right-0 mt-2 w-80 bg-[#1c2026] border border-gray-800 rounded-xl p-6 animate-fade-in shadow-2xl z-30">
            <div className="flex flex-col gap-6">
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Roles</label>
                <div className="flex flex-wrap gap-2">
                  {['Entry', 'AWP', 'Support', 'Lurker', 'IGL'].map(r => (
                    <button
                      key={r}
                      onClick={() => setRolesFilter(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])}
                      className={`px-3 py-1 rounded text-xs font-bold uppercase transition-colors ${rolesFilter.includes(r) ? 'bg-hltv-accent text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Rango de Edad</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={minAge} onChange={e => setMinAge(e.target.value)} placeholder="Min" className="w-full bg-[#121519] border border-gray-700 rounded p-2 text-white text-sm focus:border-hltv-accent focus:outline-none" />
                  <span className="text-gray-500">-</span>
                  <input type="number" value={maxAge} onChange={e => setMaxAge(e.target.value)} placeholder="Max" className="w-full bg-[#121519] border border-gray-700 rounded p-2 text-white text-sm focus:border-hltv-accent focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Equipo</label>
                <div className="relative">
                  <select
                    value={teamNameFilter}
                    onChange={e => setTeamNameFilter(e.target.value)}
                    className="w-full bg-[#121519] border border-gray-700 rounded p-2 text-white text-sm focus:border-hltv-accent focus:outline-none appearance-none pr-8"
                  >
                    <option value="">Todos los equipos</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 pt-6 border-t border-gray-800">
              <input type="checkbox" id="freeAgent" checked={isFreeAgent} onChange={e => setIsFreeAgent(e.target.checked)} className="w-4 h-4 rounded border-gray-700 bg-[#121519] text-hltv-accent focus:ring-hltv-accent focus:ring-offset-gray-900" />
              <label htmlFor="freeAgent" className="text-gray-300 text-sm font-bold cursor-pointer">Solo agentes libres</label>
            </div>
          </div>
        )}
      </div>

      <div className="bg-[#1c2026] border border-gray-800 rounded-xl overflow-hidden shadow-lg relative">
        <table className="w-full text-left">
          <thead className="bg-[#121519] border-b border-gray-800">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Jugador</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Roles</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {loading ? (
              <tr><td colSpan={4} className="p-8 text-center text-gray-500">Cargando...</td></tr>
            ) : players.map((p, idx) => (
              <tr key={idx} onClick={() => setSelectedDetailPlayer(p)} className="hover:bg-gray-800/50 transition-colors cursor-pointer">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded bg-[#121519] border border-gray-700 overflow-hidden shrink-0">
                      {p.pro.photo_url ? (
                        <img src={p.pro.photo_url} alt={p.pro.nickname} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs font-bold">PRO</div>
                      )}
                    </div>
                    <div>
                      <div className="text-white font-bold text-lg">{p.pro.nickname}</div>
                      <div className="text-gray-400 text-xs">{p.pro.full_name} • {calculateAge(p.pro.birth_date)} años</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1 flex-wrap">
                    {p.pro.roles_in_game.map((r: string) => (
                      <span key={r} className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{r}</span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {p.team ? (
                    <div className="flex items-center gap-2 text-orange-400 text-sm font-bold">
                      <ShieldCheck className="w-4 h-4" />
                      {p.team.name}
                    </div>
                  ) : (
                    <span className="text-green-400 text-sm font-bold">Agente Libre</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlayer(p);
                      setOfferAmount(p.team ? 10000 : 5000);
                    }}
                    className="bg-hltv-accent/10 hover:bg-hltv-accent hover:text-white text-hltv-accent px-4 py-2 rounded font-bold text-sm transition-colors"
                  >
                    Ofertar
                  </button>
                </td>
              </tr>
            ))}
            {!loading && players.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-gray-500">No se encontraron jugadores.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedPlayer && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1c2026] border border-gray-800 rounded-xl p-8 max-w-md w-full animate-fade-in shadow-2xl">
            <h3 className="text-xl font-black text-white mb-2">
              Ofertar a {selectedPlayer.pro.nickname}
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              {selectedPlayer.team
                ? `El jugador pertenece a ${selectedPlayer.team.name}. Debes ofrecer un monto de traspaso.`
                : 'El jugador es libre. Ofrece un salario base para el contrato.'}
            </p>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">
                  {selectedPlayer.team ? 'Monto de la Oferta (Transferencia)' : 'Salario Mensual (USD)'}
                </label>
                <input
                  type="number"
                  value={offerAmount}
                  onChange={e => setOfferAmount(Number(e.target.value))}
                  className="w-full bg-[#121519] border border-gray-700 rounded p-3 text-white focus:border-hltv-accent focus:outline-none"
                  min="0"
                />
              </div>

              {!selectedPlayer.team && (
                <>
                  <div>
                    <label className="block text-gray-400 text-xs font-bold uppercase mb-2">
                      Duración del Contrato (Meses)
                    </label>
                    <input
                      type="number"
                      value={durationMonths}
                      onChange={e => setDurationMonths(Number(e.target.value))}
                      className="w-full bg-[#121519] border border-gray-700 rounded p-3 text-white focus:border-hltv-accent focus:outline-none"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs font-bold uppercase mb-2">
                      Cláusula de Rescisión (USD) - Opcional
                    </label>
                    <input
                      type="number"
                      value={buyoutClause}
                      onChange={e => setBuyoutClause(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-[#121519] border border-gray-700 rounded p-3 text-white focus:border-hltv-accent focus:outline-none"
                      min="0"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedPlayer(null)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleOffer}
                disabled={isOffering}
                className="flex-1 bg-hltv-accent hover:bg-hltv-accentHover text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50"
              >
                {isOffering ? 'Enviando...' : 'Enviar Oferta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedDetailPlayer && (
        <div className="absolute inset-0 bg-[#121519]/90 backdrop-blur-sm z-10 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setSelectedDetailPlayer(null)}>
          <div className="bg-[#1c2026] border border-gray-800 rounded-xl p-8 max-w-sm w-full flex flex-col items-center animate-fade-in shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedDetailPlayer(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">✕</button>

            <div className="w-32 h-32 rounded-full bg-[#121519] border-4 border-gray-800 overflow-hidden mb-4 shadow-lg">
              {selectedDetailPlayer.pro.photo_url ? (
                <img src={selectedDetailPlayer.pro.photo_url} alt={selectedDetailPlayer.pro.nickname} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600 text-2xl font-black">PRO</div>
              )}
            </div>

            <h2 className="text-3xl font-black text-white text-center leading-none mb-1">{selectedDetailPlayer.pro.nickname}</h2>
            <div className="text-gray-400 text-sm text-center mb-4">{selectedDetailPlayer.pro.full_name}</div>

            <div className="flex gap-2 flex-wrap justify-center mb-4">
              {selectedDetailPlayer.pro.roles_in_game.map((r: string) => (
                <span key={r} className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-xs font-bold uppercase">{r}</span>
              ))}
            </div>

            <div className="mb-6">
              {selectedDetailPlayer.team ? (
                <div className="flex items-center gap-2 text-orange-400 font-bold bg-orange-400/10 px-4 py-2 rounded-full">
                  <ShieldCheck className="w-5 h-5" />
                  {selectedDetailPlayer.team.name}
                </div>
              ) : (
                <span className="text-green-400 font-bold bg-green-400/10 px-4 py-2 rounded-full">Agente Libre</span>
              )}
            </div>

            <div className="w-full space-y-3 mb-8">
              <div className="flex justify-between items-center bg-[#121519] rounded p-3 border border-gray-800">
                <span className="text-gray-400 text-xs font-bold uppercase flex items-center gap-2"><User className="w-4 h-4" /> Edad</span>
                <span className="text-white font-bold">{calculateAge(selectedDetailPlayer.pro.birth_date)} años <span className="text-gray-500 font-normal text-xs ml-1">({selectedDetailPlayer.pro.birth_date || 'N/A'})</span></span>
              </div>

              {selectedDetailPlayer.contract ? (
                <>
                  <div className="flex justify-between items-center bg-[#121519] rounded p-3 border border-gray-800">
                    <span className="text-gray-400 text-xs font-bold uppercase flex items-center gap-2"><Clock className="w-4 h-4" /> Duración</span>
                    <span className="text-white font-bold">{selectedDetailPlayer.contract.duration_months} meses</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#121519] rounded p-3 border border-gray-800">
                    <span className="text-gray-400 text-xs font-bold uppercase flex items-center gap-2"><FileText className="w-4 h-4" /> Cláusula</span>
                    <span className="text-hltv-accent font-black">{selectedDetailPlayer.contract.buyout_clause ? `$${selectedDetailPlayer.contract.buyout_clause.toLocaleString()}` : 'No tiene'}</span>
                  </div>
                </>
              ) : (
                <div className="bg-[#121519] rounded p-3 border border-gray-800 text-center text-gray-500 text-sm">
                  Sin contrato activo.
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setSelectedPlayer(selectedDetailPlayer);
                setOfferAmount(selectedDetailPlayer.team ? 10000 : 5000);
                setSelectedDetailPlayer(null);
              }}
              className="w-full bg-hltv-accent hover:bg-hltv-accentHover text-white py-3 rounded-xl font-bold transition-colors"
            >
              Hacer Oferta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
