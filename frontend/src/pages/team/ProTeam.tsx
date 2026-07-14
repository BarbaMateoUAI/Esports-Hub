import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Shield, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProTeam() {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  
  const [team, setTeam] = useState<any>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && role === 'ProPlayer') {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, role]);

  const fetchData = async () => {
    try {
      const teamRes = await api.get('/teams/mine');
      setTeam(teamRes.data);

      if (teamRes.data?.id) {
        const rosterRes = await api.get(`/teams/${teamRes.data.id}/roster`);
        setRoster(rosterRes.data);
      }
    } catch (err: any) {
      if (err.response?.status !== 404) {
        console.error('Error fetching pro team data', err);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Cargando...</div>;

  if (!isAuthenticated || role !== 'ProPlayer') {
    return <div className="p-8 text-center text-red-500">Acceso denegado</div>;
  }

  if (!team) {
    return (
      <div className="max-w-5xl mx-auto p-4 py-8">
        <div className="bg-[#1c2026] border border-gray-800 rounded-xl p-12 text-center shadow-lg">
          <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Agente Libre</h2>
          <p className="text-gray-400">Actualmente no estás bajo contrato con ningún equipo.</p>
          <button 
            onClick={() => navigate('/offers')}
            className="mt-6 px-8 py-3 bg-hltv-accent hover:bg-hltv-accentHover text-white rounded font-bold uppercase tracking-wider transition-colors"
          >
            Ver Ofertas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 py-8">
      {/* Team Header */}
      <div className="bg-[#1c2026] border border-gray-800 rounded-xl overflow-hidden shadow-lg mb-8">
        <div className="bg-gradient-to-r from-gray-900 to-[#121519] p-8 flex items-center gap-8 border-b border-gray-800">
          <div className="w-32 h-32 bg-[#0d1015] rounded-xl flex items-center justify-center p-4 border border-gray-800 shadow-inner">
            {team.logo_url ? (
              <img src={team.logo_url} alt={team.name} className="max-w-full max-h-full object-contain" />
            ) : (
              <Shield className="w-16 h-16 text-gray-600" />
            )}
          </div>
          <div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tight">{team.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="bg-gray-800 px-3 py-1 rounded text-xs font-bold text-gray-300 uppercase">
                {team.country}
              </span>
              <span className="text-hltv-accent font-bold text-sm">Equipo Actual</span>
            </div>
          </div>
        </div>

        {/* Roster Section */}
        <div className="p-8 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white mb-4 border-l-4 border-hltv-accent pl-3">Alineación (Roster)</h2>
          {roster.length === 0 ? (
            <p className="text-gray-500">Cargando compañeros...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roster.map((c: any) => (
                <div key={c.id} className="bg-[#121519] border border-gray-800 rounded-xl p-4 flex items-center gap-4 shadow-md">
                  <div className="w-12 h-12 rounded bg-[#0d1015] border border-gray-700 overflow-hidden flex-shrink-0">
                    {c.pro.photo_url ? (
                      <img src={c.pro.photo_url} alt={c.pro.nickname} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs font-bold">PRO</div>
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-white font-bold text-lg truncate">{c.pro.nickname}</div>
                    <div className="text-gray-400 text-xs truncate">{c.pro.full_name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Matches Placeholder */}
        <div className="p-8">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-bold text-white border-l-4 border-hltv-accent pl-3">Próximos Partidos</h2>
          </div>
          <div className="bg-[#121519] border border-dashed border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center text-center">
            <Calendar className="w-12 h-12 text-gray-600 mb-3" />
            <p className="text-gray-400 font-bold uppercase tracking-wider mb-1">En Desarrollo</p>
            <p className="text-gray-500 text-sm">Próximamente se listarán aquí los encuentros oficiales del equipo.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
