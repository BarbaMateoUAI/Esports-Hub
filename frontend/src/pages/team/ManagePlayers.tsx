import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Shield, X, Users, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ManagePlayers() {
  const { isAuthenticated, roles } = useAuth();
  const navigate = useNavigate();

  const [team, setTeam] = useState<any>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [renegotiatePlayer, setRenegotiatePlayer] = useState<any>(null);
  const [offerSalary, setOfferSalary] = useState<number>(0);
  const [offerDuration, setOfferDuration] = useState<number>(6);
  const [offerBuyout, setOfferBuyout] = useState<number | ''>('');
  const [isOffering, setIsOffering] = useState(false);

  const getRemainingContractTime = (contract: any) => {
    let endDate = contract.end_date ? new Date(contract.end_date) : null;
    if (!endDate && contract.start_date) {
        endDate = new Date(contract.start_date);
        endDate.setMonth(endDate.getMonth() + contract.duration_months);
    }
    if (!endDate) return `${contract.duration_months} meses`;

    const now = new Date();
    let months = (endDate.getFullYear() - now.getFullYear()) * 12;
    months -= now.getMonth();
    months += endDate.getMonth();

    if (months < 0) months = 0;
    const formattedDate = endDate.toLocaleDateString('es-ES', { month: '2-digit', year: 'numeric' });
    return `${months} meses (${formattedDate})`;
  };

  useEffect(() => {
    if (!isAuthenticated || !roles?.includes('TeamOwner')) {
      navigate('/');
      return;
    }
    fetchTeamData();
  }, [isAuthenticated, roles, navigate]);

  const fetchTeamData = async () => {
    try {
      const res = await api.get('/teams/mine');
      setTeam(res.data);

      const offersRes = await api.get('/market/my-offers');
      const activeContracts = offersRes.data.contracts.filter((c: any) => c.status === 'ACTIVE');
      setRoster(activeContracts);
    } catch (err: any) {
      console.error('Error fetching team for management:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRenegotiate = async () => {
    if (!renegotiatePlayer) return;
    setIsOffering(true);
    try {
      const payload: any = {
        salary: offerSalary,
        duration_months: offerDuration,
        pro_id: renegotiatePlayer.pro.id
      };
      if (offerBuyout !== '') payload.buyout_clause = Number(offerBuyout);

      await api.post('/market/offer/contract', payload);
      alert('Oferta de renovación enviada al jugador');
      setRenegotiatePlayer(null);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al enviar oferta');
    } finally {
      setIsOffering(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Cargando gestión...</div>;

  const isCoachingStaff = (c: any) => c.pro?.roles_in_game?.some((r: string) => ['Coach', 'Analyst'].includes(r));
  const rosterPlayers = roster.filter(c => !isCoachingStaff(c));
  const coachingStaff = roster.filter(isCoachingStaff);

  const renderRosterMember = (c: any) => (
    <div key={c.id} className="bg-[#121519] border border-gray-800 rounded-xl p-6 flex justify-between items-center shadow-md mb-4">
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

      <div className="flex items-center gap-4">

        {!isCoachingStaff(c) && (
          <div className="flex items-center gap-2 mr-4 bg-[#1c2026] p-1 rounded-lg border border-gray-800">
            <button className="px-3 py-1 bg-hltv-accent text-white text-xs font-bold rounded shadow-sm">Titular</button>
            <button className="px-3 py-1 text-gray-500 hover:text-white text-xs font-bold rounded transition-colors" title="Funcionalidad próxima">Suplente</button>
          </div>
        )}

        <button 
          onClick={() => {
            setRenegotiatePlayer(c);
            setOfferSalary(c.salary);
            setOfferDuration(c.duration_months);
            setOfferBuyout(c.buyout_clause || '');
          }}
          className="px-4 py-2 bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white rounded font-bold text-sm uppercase transition-colors flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Renovar
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Users className="w-8 h-8 text-hltv-accent" />
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">Gestión de Plantilla</h1>
        </div>
        <button onClick={() => navigate('/my-team')} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded font-bold text-sm uppercase transition-colors">
          Volver a Mi Equipo
        </button>
      </div>

      <div className="bg-[#1c2026] border border-gray-800 rounded-xl overflow-hidden shadow-lg p-8">
        <h2 className="text-xl font-bold text-white mb-4 border-l-4 border-hltv-accent pl-3">Alineación Activa</h2>
        {rosterPlayers.length === 0 ? (
          <p className="text-gray-500 font-medium bg-[#121519] border border-gray-800 rounded-xl p-8 text-center">Aún no hay jugadores contratados en la alineación.</p>
        ) : (
          <div className="mb-8">
            {rosterPlayers.map(renderRosterMember)}
          </div>
        )}

        <h2 className="text-xl font-bold text-white mb-4 border-l-4 border-blue-500 pl-3">Cuerpo Técnico</h2>
        {coachingStaff.length === 0 ? (
          <p className="text-gray-500 font-medium bg-[#121519] border border-gray-800 rounded-xl p-8 text-center">No hay entrenadores ni analistas en el equipo.</p>
        ) : (
          <div>
            {coachingStaff.map(renderRosterMember)}
          </div>
        )}
      </div>

      {renegotiatePlayer && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c2026] border border-gray-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 bg-gradient-to-r from-gray-900 to-[#121519] border-b border-gray-800 flex justify-between items-center">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Renovar Contrato</h2>
              <button onClick={() => setRenegotiatePlayer(null)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <p className="text-gray-400 text-sm">
                Envía una oferta de renovación a <span className="text-white font-bold">{renegotiatePlayer.pro?.nickname}</span>.
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
