import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Check, X, Inbox, Handshake, ChevronDown, ChevronUp } from 'lucide-react';

export default function Offers() {
  const { role } = useAuth();
  const [data, setData] = useState<{ transfers: any[], contracts: any[] }>({ transfers: [], contracts: [] });
  const [loading, setLoading] = useState(true);

  const [showCounter, setShowCounter] = useState<number | string | null>(null);
  const [counterAmount, setCounterAmount] = useState<number>(0);
  const [counterDuration, setCounterDuration] = useState<number>(0);
  const [counterBuyout, setCounterBuyout] = useState<string>('');

  const [showOldTransfers, setShowOldTransfers] = useState(false);
  const [showOldContracts, setShowOldContracts] = useState(false);
  const [showOldTeamRenegs, setShowOldTeamRenegs] = useState(false);
  const [showOldProRenegs, setShowOldProRenegs] = useState(false);

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

  const handleContract = async (id: number, status: string, salary?: number, duration?: number, buyout?: string) => {
    try {
      let url = `/market/offer/contract/${id}?status=${status}`;
      const payload: any = {};
      if (salary !== undefined) payload.salary = salary;
      if (duration !== undefined) payload.duration_months = duration;
      if (buyout !== undefined && buyout !== '') payload.buyout_clause = Number(buyout);
      await api.put(url, payload);
      fetchOffers();
      setShowCounter(null);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al actualizar contrato');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Cargando ofertas...</div>;

  const isOwner = role === 'TeamOwner';
  const isPro = role === 'ProPlayer';

  const isPending = (status: string) => ['PENDING', 'NEGOTIATING', 'COUNTER_OFFER'].includes(status);

  const pendingTransfers = data.transfers.filter(t => isPending(t.status));
  const oldTransfers = data.transfers.filter(t => !isPending(t.status));

  const newContracts = data.contracts.filter(c => !c.is_renegotiation);
  const pendingContracts = newContracts.filter(c => isPending(c.status));
  const oldContracts = newContracts.filter(c => !isPending(c.status));

  const teamRenegotiations = data.contracts.filter(c => c.is_renegotiation);
  const pendingTeamRenegs = teamRenegotiations.filter(c => isPending(c.status));
  const oldTeamRenegs = teamRenegotiations.filter(c => !isPending(c.status));

  const renderTransferItem = (t: any) => (
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
  );

  const renderContractItem = (c: any, isRenegotiation = false) => (
    <div key={c.id} className={`bg-[#1c2026] border border-gray-800 rounded-xl p-6 shadow-md ${isRenegotiation ? 'border-l-4 border-l-blue-500' : ''}`}>
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
            {isRenegotiation && <span className="text-blue-400 text-xs font-bold uppercase">Renegociación</span>}
          </div>
          <div className="text-white text-lg">
            {isRenegotiation ? (
              isPro ? (
                <>Renegociación con <span className="font-bold">{c.team?.name}</span></>
              ) : (
                <>Jugador <span className="font-bold">{c.pro?.nickname}</span> solicita un nuevo contrato</>
              )
            ) : (
              <>Contrato de <span className="font-bold">{c.team?.name}</span> para <span className="font-bold">{c.pro?.nickname}</span></>
            )}
          </div>
          <div className="flex gap-4 mt-2">
            <div className="text-hltv-accent font-black">Salario: ${c.salary}</div>
            <div className="text-gray-400 font-bold">Duración: {c.duration_months} meses</div>
            {c.buyout_clause && <div className="text-blue-400 font-bold">Cláusula: ${c.buyout_clause}</div>}
          </div>
        </div>

        <div className="flex flex-col gap-2 items-end">
          {isPro && c.status === 'PENDING' && !isRenegotiation && (
            <div className="flex gap-2">
              <button onClick={() => handleContract(c.id, 'ACTIVE')} className="p-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded transition-colors" title="Aceptar Contrato">
                <Check className="w-5 h-5" />
              </button>
              <button onClick={() => handleContract(c.id, 'REJECTED')} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded transition-colors" title="Rechazar">
                <X className="w-5 h-5" />
              </button>
              <button onClick={() => { setShowCounter(`contract-${c.id}`); setCounterAmount(c.salary); setCounterDuration(c.duration_months); setCounterBuyout(c.buyout_clause || ''); }} className="p-2 bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white rounded transition-colors" title="Contraofertar">
                <Handshake className="w-5 h-5" />
              </button>
            </div>
          )}

          {isPro && c.status === 'COUNTER_OFFER' && (
            isRenegotiation ? (
              <div className="flex gap-2">
                <button onClick={() => handleContract(c.id, 'ACTIVE')} className="p-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded transition-colors" title="Aceptar Contraoferta">
                  <Check className="w-5 h-5" />
                </button>
                <button onClick={() => handleContract(c.id, 'REJECTED')} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded transition-colors" title="Rechazar">
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="text-orange-500 text-sm font-bold mt-2">Esperando respuesta del equipo...</div>
            )
          )}

          {isOwner && c.status === 'PENDING' && (
            isRenegotiation ? (
              <div className="flex gap-2">
                <button onClick={() => handleContract(c.id, 'ACTIVE')} className="p-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded transition-colors" title="Aceptar Renegociación">
                  <Check className="w-5 h-5" />
                </button>
                <button onClick={() => handleContract(c.id, 'REJECTED')} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded transition-colors" title="Rechazar">
                  <X className="w-5 h-5" />
                </button>
                <button onClick={() => { setShowCounter(`renegotiate-${c.id}`); setCounterAmount(c.salary); setCounterDuration(c.duration_months); setCounterBuyout(c.buyout_clause || ''); }} className="p-2 bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white rounded transition-colors" title="Contraofertar">
                  <Handshake className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="text-yellow-500 text-sm font-bold mt-2">Esperando respuesta del jugador...</div>
            )
          )}

          {isOwner && c.status === 'COUNTER_OFFER' && (
            isRenegotiation ? (
              <div className="text-orange-500 text-sm font-bold mt-2">Esperando respuesta del jugador...</div>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => handleContract(c.id, 'ACTIVE')} className="px-3 py-1 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded text-sm font-bold transition-colors">
                  Aceptar Contraoferta
                </button>
                <button onClick={() => handleContract(c.id, 'REJECTED')} className="px-3 py-1 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded text-sm font-bold transition-colors">
                  Rechazar
                </button>
              </div>
            )
          )}
        </div>
      </div>

      {showCounter === (isRenegotiation ? `renegotiate-${c.id}` : `contract-${c.id}`) && (
        <div className="mt-4 p-4 bg-[#121519] border border-gray-700 rounded-lg animate-fade-in">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Salario ($)</label>
              <input 
                type="number" 
                value={counterAmount} 
                onChange={e => setCounterAmount(Number(e.target.value))}
                className="w-full bg-[#1c2026] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-hltv-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Duración (Meses)</label>
              <input 
                type="number" 
                value={counterDuration} 
                onChange={e => setCounterDuration(Number(e.target.value))}
                className="w-full bg-[#1c2026] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-hltv-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Cláusula ($) Opcional</label>
              <input 
                type="number" 
                value={counterBuyout} 
                onChange={e => setCounterBuyout(e.target.value)}
                className="w-full bg-[#1c2026] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-hltv-accent"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => handleContract(c.id, 'COUNTER_OFFER', counterAmount, counterDuration, counterBuyout)} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded font-bold transition-colors text-sm">
              Enviar Contraoferta
            </button>
            <button onClick={() => setShowCounter(null)} className="text-gray-400 hover:text-white text-sm">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Inbox className="w-8 h-8 text-hltv-accent" />
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">Centro de Ofertas</h1>
      </div>

      {isOwner && (
        <div className="mb-12">
          <h2 className="text-xl font-bold text-white mb-4 border-l-4 border-hltv-accent pl-3">Traspasos (Equipos)</h2>

          {pendingTransfers.length === 0 ? (
            <p className="text-gray-500 bg-[#1c2026] p-6 rounded-xl border border-gray-800 text-center mb-4">No hay traspasos pendientes.</p>
          ) : (
            <div className="space-y-4 mb-4">
              {pendingTransfers.map(renderTransferItem)}
            </div>
          )}

          {oldTransfers.length > 0 && (
            <div className="mt-4 border-t border-gray-800 pt-4">
              <button onClick={() => setShowOldTransfers(!showOldTransfers)} className="text-gray-400 hover:text-white text-sm font-bold flex items-center gap-2 mb-4 mx-auto bg-[#1c2026] px-4 py-2 rounded-full border border-gray-800 transition-colors">
                {showOldTransfers ? <><ChevronUp className="w-4 h-4"/> Ocultar traspasos antiguos</> : <><ChevronDown className="w-4 h-4"/> Ver traspasos antiguos</>}
              </button>
              {showOldTransfers && (
                <div className="space-y-4 animate-fade-in opacity-75">
                  {oldTransfers.map(renderTransferItem)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold text-white mb-4 border-l-4 border-hltv-accent pl-3">Contratos (Nuevos)</h2>

        {pendingContracts.length === 0 ? (
          <p className="text-gray-500 bg-[#1c2026] p-6 rounded-xl border border-gray-800 text-center mb-4">No hay contratos nuevos pendientes.</p>
        ) : (
          <div className="space-y-4 mb-4">
            {pendingContracts.map(c => renderContractItem(c, false))}
          </div>
        )}

        {oldContracts.length > 0 && (
          <div className="mt-4 border-t border-gray-800 pt-4">
            <button onClick={() => setShowOldContracts(!showOldContracts)} className="text-gray-400 hover:text-white text-sm font-bold flex items-center gap-2 mb-4 mx-auto bg-[#1c2026] px-4 py-2 rounded-full border border-gray-800 transition-colors">
              {showOldContracts ? <><ChevronUp className="w-4 h-4"/> Ocultar contratos antiguos</> : <><ChevronDown className="w-4 h-4"/> Ver contratos antiguos</>}
            </button>
            {showOldContracts && (
              <div className="space-y-4 animate-fade-in opacity-75">
                {oldContracts.map(c => renderContractItem(c, false))}
              </div>
            )}
          </div>
        )}
      </div>

      {isOwner && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-white mb-4 border-l-4 border-hltv-accent pl-3">Equipo (Renegociaciones)</h2>

          {pendingTeamRenegs.length === 0 ? (
            <p className="text-gray-500 bg-[#1c2026] p-6 rounded-xl border border-gray-800 text-center mb-4">No hay renegociaciones pendientes.</p>
          ) : (
            <div className="space-y-4 mb-4">
              {pendingTeamRenegs.map(c => renderContractItem(c, true))}
            </div>
          )}

          {oldTeamRenegs.length > 0 && (
            <div className="mt-4 border-t border-gray-800 pt-4">
              <button onClick={() => setShowOldTeamRenegs(!showOldTeamRenegs)} className="text-gray-400 hover:text-white text-sm font-bold flex items-center gap-2 mb-4 mx-auto bg-[#1c2026] px-4 py-2 rounded-full border border-gray-800 transition-colors">
                {showOldTeamRenegs ? <><ChevronUp className="w-4 h-4"/> Ocultar renegociaciones antiguas</> : <><ChevronDown className="w-4 h-4"/> Ver renegociaciones antiguas</>}
              </button>
              {showOldTeamRenegs && (
                <div className="space-y-4 animate-fade-in opacity-75">
                  {oldTeamRenegs.map(c => renderContractItem(c, true))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {isPro && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-white mb-4 border-l-4 border-hltv-accent pl-3">Tu Renegociación</h2>

          {pendingTeamRenegs.length === 0 ? (
            <p className="text-gray-500 bg-[#1c2026] p-6 rounded-xl border border-gray-800 text-center mb-4">No tienes renegociaciones pendientes.</p>
          ) : (
            <div className="space-y-4 mb-4">
              {pendingTeamRenegs.map(c => renderContractItem(c, true))}
            </div>
          )}

          {oldTeamRenegs.length > 0 && (
            <div className="mt-4 border-t border-gray-800 pt-4">
              <button onClick={() => setShowOldProRenegs(!showOldProRenegs)} className="text-gray-400 hover:text-white text-sm font-bold flex items-center gap-2 mb-4 mx-auto bg-[#1c2026] px-4 py-2 rounded-full border border-gray-800 transition-colors">
                {showOldProRenegs ? <><ChevronUp className="w-4 h-4"/> Ocultar renegociaciones antiguas</> : <><ChevronDown className="w-4 h-4"/> Ver renegociaciones antiguas</>}
              </button>
              {showOldProRenegs && (
                <div className="space-y-4 animate-fade-in opacity-75">
                  {oldTeamRenegs.map(c => renderContractItem(c, true))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
