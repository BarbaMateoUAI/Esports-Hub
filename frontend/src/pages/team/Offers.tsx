import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Check, X, Inbox, Handshake } from 'lucide-react';

export default function Offers() {
  const { isAuthenticated, role } = useAuth();
  const [data, setData] = useState<{ transfers: any[], contracts: any[] }>({ transfers: [], contracts: [] });
  const [loading, setLoading] = useState(true);

  const [showCounter, setShowCounter] = useState<number | string | null>(null);
  const [counterAmount, setCounterAmount] = useState<number>(0);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await api.get('/market/my-offers');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (id: number, status: string, amount?: number) => {
    try {
      let url = `/market/offer/transfer/${id}?status=${status}`;
      
      if (amount !== undefined) {
        const formData = new FormData();
        formData.append('amount', amount.toString());
        await api.put(url, formData);
      } else {
        await api.put(url);
      }
      
      fetchOffers();
      setShowCounter(null);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al actualizar traspaso');
    }
  };

  const handleContract = async (id: number, status: string, salary?: number) => {
    try {
      let url = `/market/offer/contract/${id}?status=${status}`;
      
      const formData = new FormData();
      if (salary !== undefined) {
        formData.append('salary', salary.toString());
      }
      
      await api.put(url, formData);
      fetchOffers();
      setShowCounter(null);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al actualizar contrato');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Cargando ofertas...</div>;

  const isOwner = role === 'TeamOwner';
  const isPro = role === 'ProPlayer';

  return (
    <div className="max-w-4xl mx-auto p-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Inbox className="w-8 h-8 text-hltv-accent" />
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">Centro de Ofertas</h1>
      </div>

      {isOwner && (
        <div className="mb-12">
          <h2 className="text-xl font-bold text-white mb-4 border-l-4 border-hltv-accent pl-3">Traspasos (Equipos)</h2>
          {data.transfers.length === 0 ? (
            <p className="text-gray-500 bg-[#1c2026] p-6 rounded-xl border border-gray-800">No hay ofertas de traspaso.</p>
          ) : (
            <div className="space-y-4">
              {data.transfers.map((t: any) => (
                <div key={t.id} className="bg-[#1c2026] border border-gray-800 rounded-xl shadow-md">
                  <div className="p-6 flex justify-between items-center">
                    <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        t.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                        t.status === 'ACCEPTED' ? 'bg-green-500/20 text-green-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {t.status}
                      </span>
                      <span className="text-gray-400 text-sm">Traspaso por {t.pro.nickname}</span>
                    </div>
                    <div className="text-white">
                      <span className="font-bold">{t.from_team.name}</span> ➔ <span className="font-bold">{t.to_team.name}</span>
                    </div>
                    <div className="text-hltv-accent font-black mt-2">${t.amount}</div>
                  </div>
                  
                  {(t.status === 'PENDING' || t.status === 'NEGOTIATING') && (
                    <div className="flex flex-col gap-2 items-end">
                      <div className="flex gap-2">
                        <button onClick={() => handleTransfer(t.id, 'ACCEPTED')} className="p-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded transition-colors" title="Aceptar">
                          <Check className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleTransfer(t.id, 'REJECTED')} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded transition-colors" title="Rechazar">
                          <X className="w-5 h-5" />
                        </button>
                        <button onClick={() => { setShowCounter(`transfer-${t.id}`); setCounterAmount(t.amount); }} className="p-2 bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white rounded transition-colors" title="Contraofertar">
                          <Handshake className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                  </div>
                  {showCounter === `transfer-${t.id}` && (
                  <div className="mt-4 p-4 bg-[#121519] border border-gray-700 rounded-lg flex items-center gap-4 animate-fade-in mx-6 mb-6">
                    <input 
                      type="number" 
                      value={counterAmount} 
                      onChange={e => setCounterAmount(Number(e.target.value))}
                      className="bg-[#1c2026] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-hltv-accent"
                    />
                    <button onClick={() => handleTransfer(t.id, 'NEGOTIATING', counterAmount)} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded font-bold transition-colors text-sm">
                      Enviar Contraoferta
                    </button>
                    <button onClick={() => setShowCounter(null)} className="text-gray-400 hover:text-white text-sm">Cancelar</button>
                  </div>
                )}
              </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold text-white mb-4 border-l-4 border-hltv-accent pl-3">Contratos de Jugador</h2>
        {data.contracts.length === 0 ? (
          <p className="text-gray-500 bg-[#1c2026] p-6 rounded-xl border border-gray-800">No hay contratos pendientes.</p>
        ) : (
          <div className="space-y-4">
            {data.contracts.map((c: any) => (
              <div key={c.id} className="bg-[#1c2026] border border-gray-800 rounded-xl p-6 shadow-md">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        c.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                        c.status === 'COUNTER_OFFER' ? 'bg-orange-500/20 text-orange-400' :
                        c.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <div className="text-white text-lg">
                      Contrato de <span className="font-bold">{c.team?.name}</span> para <span className="font-bold">{c.pro?.nickname}</span>
                    </div>
                    <div className="flex gap-4 mt-2">
                      <div className="text-hltv-accent font-black">Salario: ${c.salary}</div>
                      <div className="text-gray-400 font-bold">Duración: {c.duration_months} meses</div>
                      {c.buyout_clause && <div className="text-blue-400 font-bold">Cláusula: ${c.buyout_clause}</div>}
                    </div>
                  </div>
                  
                  {isPro && (c.status === 'PENDING' || c.status === 'COUNTER_OFFER') && (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button onClick={() => handleContract(c.id, 'ACTIVE')} className="p-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded transition-colors" title="Aceptar Contrato">
                          <Check className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleContract(c.id, 'REJECTED')} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded transition-colors" title="Rechazar">
                          <X className="w-5 h-5" />
                        </button>
                        <button onClick={() => { setShowCounter(`contract-${c.id}`); setCounterAmount(c.salary); }} className="p-2 bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white rounded transition-colors" title="Contraofertar">
                          <Handshake className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {isOwner && c.status === 'COUNTER_OFFER' && (
                    <div className="flex gap-2">
                        <button onClick={() => handleContract(c.id, 'PENDING')} className="px-3 py-1 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded text-sm font-bold transition-colors">
                          Aceptar Contraoferta (Re-emitir)
                        </button>
                        <button onClick={() => handleContract(c.id, 'REJECTED')} className="px-3 py-1 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded text-sm font-bold transition-colors">
                          Rechazar
                        </button>
                    </div>
                  )}
                </div>

                {showCounter === `contract-${c.id}` && (
                  <div className="mt-4 p-4 bg-[#121519] border border-gray-700 rounded-lg flex items-center gap-4 animate-fade-in">
                    <input 
                      type="number" 
                      value={counterAmount} 
                      onChange={e => setCounterAmount(Number(e.target.value))}
                      className="bg-[#1c2026] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-hltv-accent"
                    />
                    <button onClick={() => handleContract(c.id, 'COUNTER_OFFER', counterAmount)} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded font-bold transition-colors text-sm">
                      Enviar Contraoferta
                    </button>
                    <button onClick={() => setShowCounter(null)} className="text-gray-400 hover:text-white text-sm">Cancelar</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
