import { useEffect, useState, useMemo } from 'react';
import api from '../../services/api';
import { Calendar as CalendarIcon, Edit, Trash2, X, Search } from 'lucide-react';

interface Player {
  id: number;
  user_id: number;
  full_name: string;
  nickname: string;
}

interface Team {
  id: number;
  name: string;
  logo_url: string | null;
}

interface Contract {
  id: number;
  team_id: number;
  pro_id: number;
  salary: number;
  duration_months: number;
  buyout_clause: number | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  is_renegotiation: boolean;
  is_deleted: boolean;
  team: Team;
}

export default function ManageContracts() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editingContract, setEditingContract] = useState<Contract | null>(null);

  useEffect(() => {
    fetchPlayers();
  }, []);

  useEffect(() => {
    if (selectedPlayerId) {
      fetchContracts(selectedPlayerId);
    } else {
      setContracts([]);
    }
  }, [selectedPlayerId]);

  const fetchPlayers = async () => {
    try {
      setLoadingPlayers(true);
      const res = await api.get('/admin/players');
      setPlayers(res.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error cargando jugadores');
    } finally {
      setLoadingPlayers(false);
    }
  };

  const fetchContracts = async (playerId: number) => {
    try {
      setLoadingContracts(true);
      const res = await api.get(`/admin/players/${playerId}/contracts`);
      setContracts(res.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error cargando contratos');
    } finally {
      setLoadingContracts(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Seguro que quieres borrar este contrato (baja lógica)?')) return;
    try {
      await api.delete(`/admin/contracts/${id}`);
      setContracts(contracts.map(c => c.id === id ? { ...c, is_deleted: true } : c));
      if (editingContract?.id === id) setEditingContract(null);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al borrar contrato');
    }
  };

  const handleHardDelete = async (id: number) => {
    if (!window.confirm('¿Seguro que quieres eliminar este contrato permanentemente? Esta acción no se puede deshacer.')) return;
    try {
      await api.delete(`/admin/contracts/${id}/hard`);
      setContracts(contracts.filter(c => c.id !== id));
      if (editingContract?.id === id) setEditingContract(null);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al eliminar permanentemente');
    }
  };

  const handleRecover = async (id: number) => {
    try {
      const res = await api.put(`/admin/contracts/${id}`, { is_deleted: false });
      setContracts(contracts.map(c => c.id === id ? res.data : c));
      if (editingContract?.id === id) setEditingContract(res.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al recuperar contrato');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContract) return;

    try {
      const res = await api.put(`/admin/contracts/${editingContract.id}`, {
        salary: editingContract.salary,
        duration_months: editingContract.duration_months,
        buyout_clause: editingContract.buyout_clause,
        start_date: editingContract.start_date || null,
        end_date: editingContract.end_date || null,
        status: editingContract.status,
        is_deleted: editingContract.is_deleted,
      });
      setContracts(contracts.map(c => c.id === editingContract.id ? res.data : c));
      setEditingContract(null);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al editar contrato');
    }
  };

  const filteredPlayers = players.filter(p => 
    p.nickname.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-6rem)]">
      <div className="flex items-center gap-3 border-b border-gray-800 pb-4 mb-4 shrink-0">
        <CalendarIcon className="w-8 h-8 text-hltv-accent" />
        <h2 className="text-2xl font-black text-white">Línea de Tiempo de Contratos</h2>
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden">
        {/* Sidebar: Players List */}
        <div className="w-64 shrink-0 bg-[#1c2026] border border-gray-800 rounded-lg flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-800 bg-[#232830]">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Buscar jugador..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-[#121519] border border-gray-700 text-white text-sm rounded-md pl-9 pr-3 py-2 focus:border-hltv-accent focus:ring-1 focus:ring-hltv-accent outline-none transition-colors"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {loadingPlayers ? (
              <div className="text-center text-gray-500 py-4 text-sm">Cargando...</div>
            ) : filteredPlayers.length === 0 ? (
              <div className="text-center text-gray-500 py-4 text-sm">No hay jugadores</div>
            ) : (
              <div className="space-y-1">
                {filteredPlayers.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlayerId(p.id)}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${
                      selectedPlayerId === p.id 
                        ? 'bg-hltv-accent/10 text-hltv-accent font-bold border border-hltv-accent/20' 
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    {p.nickname}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content: Timeline */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {!selectedPlayerId ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 bg-[#1c2026] border border-gray-800 rounded-lg">
              Selecciona un jugador para ver su línea de tiempo
            </div>
          ) : loadingContracts ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 bg-[#1c2026] border border-gray-800 rounded-lg">
              Cargando línea de tiempo...
            </div>
          ) : contracts.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 bg-[#1c2026] border border-gray-800 rounded-lg">
              El jugador no tiene contratos registrados
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
              <div className="p-6 pb-2">
                <TimelineChart 
                  contracts={contracts} 
                  onEditContract={(c) => setEditingContract(c)} 
                />
              </div>
              
              <div className="flex-1 p-6 pt-2">
                <h3 className="text-lg font-bold text-white mb-4">Todos los Contratos</h3>
                <div className="bg-[#121519] border border-gray-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm text-gray-300">
                    <thead className="bg-[#1c2026] text-gray-400 font-bold uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3 border-b border-gray-800">Equipo</th>
                        <th className="px-4 py-3 border-b border-gray-800">Inicio</th>
                        <th className="px-4 py-3 border-b border-gray-800">Fin</th>
                        <th className="px-4 py-3 border-b border-gray-800">Salario</th>
                        <th className="px-4 py-3 border-b border-gray-800">Estado</th>
                        <th className="px-4 py-3 border-b border-gray-800 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {contracts.map(c => (
                        <tr key={c.id} className={`hover:bg-[#1a1e24] transition-colors ${c.is_deleted ? 'opacity-50' : ''}`}>
                          <td className="px-4 py-3 font-medium text-white">{c.team.name}</td>
                          <td className="px-4 py-3">{c.start_date ? new Date(c.start_date).toLocaleDateString() : '-'}</td>
                          <td className="px-4 py-3">{c.end_date ? new Date(c.end_date).toLocaleDateString() : '-'}</td>
                          <td className="px-4 py-3 text-hltv-accent">${c.salary}</td>
                          <td className="px-4 py-3">
                            {c.is_deleted ? (
                              <span className="text-red-400 text-xs font-bold bg-red-500/10 px-2 py-1 rounded">Eliminado</span>
                            ) : (
                              <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded">{c.status}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button 
                              onClick={() => setEditingContract(c)}
                              className="text-gray-400 hover:text-white transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingContract && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c2026] border border-gray-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 bg-gradient-to-r from-gray-900 to-[#121519] border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                <Edit className="w-4 h-4 text-hltv-accent"/> Editar Contrato ({editingContract.team.name})
              </h3>
              <button onClick={() => setEditingContract(null)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Salario (USD)</label>
                  <input 
                    type="number" 
                    value={editingContract.salary}
                    onChange={e => setEditingContract({...editingContract, salary: parseFloat(e.target.value)})}
                    className="w-full bg-[#121519] border border-gray-700 rounded px-3 py-2 text-white text-sm focus:border-hltv-accent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Meses</label>
                  <input 
                    type="number" 
                    value={editingContract.duration_months}
                    onChange={e => setEditingContract({...editingContract, duration_months: parseInt(e.target.value)})}
                    className="w-full bg-[#121519] border border-gray-700 rounded px-3 py-2 text-white text-sm focus:border-hltv-accent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Fecha Inicio</label>
                  <input 
                    type="date" 
                    value={editingContract.start_date ? editingContract.start_date.split('T')[0] : ''}
                    onChange={e => setEditingContract({...editingContract, start_date: e.target.value ? new Date(e.target.value).toISOString() : null})}
                    className="w-full bg-[#121519] border border-gray-700 rounded px-3 py-2 text-white text-sm focus:border-hltv-accent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Fecha Fin</label>
                  <input 
                    type="date" 
                    value={editingContract.end_date ? editingContract.end_date.split('T')[0] : ''}
                    onChange={e => setEditingContract({...editingContract, end_date: e.target.value ? new Date(e.target.value).toISOString() : null})}
                    className="w-full bg-[#121519] border border-gray-700 rounded px-3 py-2 text-white text-sm focus:border-hltv-accent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Cláusula</label>
                  <input 
                    type="number" 
                    value={editingContract.buyout_clause || ''}
                    onChange={e => setEditingContract({...editingContract, buyout_clause: e.target.value ? parseFloat(e.target.value) : null})}
                    className="w-full bg-[#121519] border border-gray-700 rounded px-3 py-2 text-white text-sm focus:border-hltv-accent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Estado</label>
                  <select 
                    value={editingContract.status}
                    onChange={e => setEditingContract({...editingContract, status: e.target.value})}
                    className="w-full bg-[#121519] border border-gray-700 rounded px-3 py-2 text-white text-sm focus:border-hltv-accent outline-none"
                  >
                    <option value="PENDING">Pendiente</option>
                    <option value="ACTIVE">Activo</option>
                    <option value="FINISHED">Finalizado</option>
                    <option value="REJECTED">Rechazado</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-gray-800 mt-4">
                {editingContract.is_deleted ? (
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => handleRecover(editingContract.id)}
                      className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-2 rounded text-sm font-bold transition-colors"
                    >
                      Recuperar
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleHardDelete(editingContract.id)}
                      className="flex items-center gap-2 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-2 rounded text-sm font-bold transition-colors"
                    >
                      <Trash2 className="w-4 h-4"/> Eliminar Permanente
                    </button>
                  </div>
                ) : (
                  <button 
                    type="button"
                    onClick={() => handleDelete(editingContract.id)}
                    className="flex items-center gap-2 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-2 rounded text-sm font-bold transition-colors"
                  >
                    <Trash2 className="w-4 h-4"/> Eliminar (Baja Lógica)
                  </button>
                )}
                <button 
                  type="submit"
                  className="bg-hltv-accent hover:bg-hltv-accentHover text-white px-5 py-2 rounded font-bold uppercase text-sm transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Custom Timeline Component ---

function TimelineChart({ contracts, onEditContract }: { contracts: Contract[], onEditContract: (c: Contract) => void }) {
  // 1. Determine min and max dates
  const validContracts = contracts.filter(c => c.start_date && !c.is_deleted);
  
  if (validContracts.length === 0) {
    return <div className="text-gray-500 italic">Los contratos no tienen fecha de inicio definida.</div>;
  }

  const minTime = Math.min(...validContracts.map(c => new Date(c.start_date!).getTime()));
  const maxTime = Math.max(...validContracts.map(c => c.end_date ? new Date(c.end_date).getTime() : new Date().getTime()));
  
  const minYear = new Date(minTime).getFullYear();
  const maxYear = new Date(maxTime).getFullYear();
  
  // Timeline spans from Jan 1 of minYear to exactly the maxTime (plus 1 month padding)
  const minD = new Date(minYear, 0, 1).getTime();
  const maxD = Math.max(new Date(minYear + 1, 0, 1).getTime(), maxTime + (30 * 24 * 60 * 60 * 1000));
  
  const totalYears = maxYear - minYear + 1;
  const years = Array.from({length: totalYears}, (_, i) => minYear + i);

  const getLeftPercentage = (dateStr: string) => {
    const d = new Date(dateStr).getTime();
    return Math.max(0, Math.min(100, ((d - minD) / (maxD - minD)) * 100));
  };

  const teamsMap = new Map<number, { id: number; name: string; contracts: Contract[] }>();
  validContracts.forEach(c => {
    if (!teamsMap.has(c.team.id)) {
      teamsMap.set(c.team.id, { id: c.team.id, name: c.team.name, contracts: [] });
    }
    teamsMap.get(c.team.id)!.contracts.push(c);
  });
  
  const teams = Array.from(teamsMap.values());
  const timelineMinWidth = Math.max(600, totalYears * 250);

  return (
    <div className="w-full h-fit bg-[#22272e] rounded-xl border border-gray-700/50 relative shadow-inner overflow-x-auto custom-scrollbar">
      <div className="p-6 pt-12 relative" style={{ minWidth: `${timelineMinWidth}px` }}>
        
        {/* Background Grid Lines (Years and Months) */}
        <div className="absolute top-12 bottom-6 left-[120px] right-8 border-l border-gray-700/30 border-r pointer-events-none">
          {years.map((year) => {
            const d = new Date(year, 0, 1).getTime();
            if (d > maxD) return null;
            const left = ((d - minD) / (maxD - minD)) * 100;
            return (
              <div 
                key={year} 
                className="absolute top-0 bottom-0 border-l border-dashed border-gray-600/50"
                style={{ left: `${left}%` }}
              >
                <div className="absolute -top-10 left-0 -translate-x-1/2 bg-[#1c2026] border border-gray-700 text-gray-400 text-xs px-3 py-1 rounded font-mono font-bold z-10 shadow">
                  {year}
                </div>
              </div>
            );
          })}
          {/* Render Month Lines */}
          {years.map(year => {
            return Array.from({length: 12}).map((_, month) => {
              if (month === 0) return null; // skip year lines
              const d = new Date(year, month, 1).getTime();
              if (d > maxD) return null; // skip if beyond max time
              const left = ((d - minD) / (maxD - minD)) * 100;
              return (
                <div 
                  key={`month-${year}-${month}`} 
                  className="absolute top-0 bottom-0 border-l border-dashed border-gray-700/20"
                  style={{ left: `${left}%` }}
                >
                </div>
              );
            });
          })}
        </div>

        {/* Teams Rows */}
        <div className="relative mt-2 flex flex-col gap-6 pb-4">
          {teams.map(t => (
            <div key={t.id} className="relative h-10 w-full flex items-center group">
              
              {/* Team Label */}
              <div className="absolute left-0 w-[110px] flex items-center justify-end pr-4 text-sm font-bold text-gray-300 uppercase tracking-wide group-hover:text-white transition-colors z-10">
                <span className="truncate">{t.name}</span>
              </div>

              {/* Timeline Bars Area */}
              <div className="absolute left-[120px] right-8 h-full flex items-center">
                <div className="w-full h-px bg-gray-700/20 absolute"></div>
              {t.contracts.map(c => {
                const left = getLeftPercentage(c.start_date!);
                const right = getLeftPercentage(c.end_date || new Date().toISOString());
                const width = right - left;
                
                return (
                  <div
                    key={c.id}
                    onClick={() => onEditContract(c)}
                    className="absolute h-2.5 rounded-full bg-gradient-to-r from-blue-500/80 to-cyan-400/80 cursor-pointer hover:brightness-125 transition-all shadow-md hover:shadow-cyan-500/30 flex items-center overflow-hidden border border-cyan-400/30 group/bar"
                    style={{ left: `${left}%`, width: `${width}%`, minWidth: '16px' }}
                    title={`Salario: $${c.salary} - Click para editar`}
                  >
                    <div className="absolute inset-0 bg-white/0 group-hover/bar:bg-white/10 transition-colors"></div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
