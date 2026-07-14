import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Search, Filter, ShieldCheck, Euro } from 'lucide-react';

export default function Scouting() {
  const { isAuthenticated, role } = useAuth();
  
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);
  const [offerAmount, setOfferAmount] = useState<number>(0);
  const [durationMonths, setDurationMonths] = useState<number>(6);
  const [buyoutClause, setBuyoutClause] = useState<number | ''>('');
  const [isOffering, setIsOffering] = useState(false);

  useEffect(() => {
    fetchPlayers();
  }, [search, statusFilter]);

  const fetchPlayers = async () => {
    try {
      const res = await api.get(`/market/players?search=${search}&filter_status=${statusFilter}`);
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
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
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
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-[#1c2026] border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white appearance-none focus:border-hltv-accent focus:ring-1 focus:outline-none transition-colors min-w-[200px]"
          >
            <option value="all">Todos los jugadores</option>
            <option value="free">Agentes Libres</option>
            <option value="team">Con Equipo</option>
          </select>
        </div>
      </div>

      <div className="bg-[#1c2026] border border-gray-800 rounded-xl overflow-hidden shadow-lg">
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
              <tr key={idx} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded bg-[#121519] border border-gray-700 overflow-hidden">
                      {p.pro.photo_url ? (
                        <img src={p.pro.photo_url} alt={p.pro.nickname} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs font-bold">PRO</div>
                      )}
                    </div>
                    <div>
                      <div className="text-white font-bold text-lg">{p.pro.nickname}</div>
                      <div className="text-gray-400 text-xs">{p.pro.full_name} • {p.pro.age} años</div>
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
                    onClick={() => {
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
    </div>
  );
}
