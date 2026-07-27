import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Calendar, DollarSign, PieChart as PieChartIcon, Shield, Loader } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB'];

export default function TeamReports() {
  const navigate = useNavigate();
  const { isAuthenticated, roles } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [team, setTeam] = useState<any>(null);
  const [contracts, setContracts] = useState<any[]>([]);

  // Filters
  const [timelineYear, setTimelineYear] = useState<number>(new Date().getFullYear());
  const [calcStart, setCalcStart] = useState<string>('');
  const [calcEnd, setCalcEnd] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated || !roles?.includes('TeamOwner')) {
      navigate('/');
      return;
    }
    fetchData();
  }, [isAuthenticated, roles, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const teamRes = await api.get('/teams/mine');
      setTeam(teamRes.data);
      
      const contractsRes = await api.get(`/teams/${teamRes.data.id}/reports/contracts`);
      setContracts(contractsRes.data);
      
      // Default dates for calculator
      const today = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 6);
      
      setCalcStart(today.toISOString().split('T')[0]);
      setCalcEnd(nextMonth.toISOString().split('T')[0]);
      
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Error al cargar los reportes');
    } finally {
      setLoading(false);
    }
  };

  // 1. Demographics Data
  const activeContracts = useMemo(() => contracts.filter(c => c.status === 'ACTIVE'), [contracts]);
  
  // Deduplicate by pro.id to count each player only once
  const uniqueActivePros = useMemo(() => {
    const prosMap = new Map();
    activeContracts.forEach(c => {
      if (c.pro && !prosMap.has(c.pro.id)) {
        prosMap.set(c.pro.id, c.pro);
      }
    });
    return Array.from(prosMap.values());
  }, [activeContracts]);

  const nationalityData = useMemo(() => {
    const counts: Record<string, number> = {};
    uniqueActivePros.forEach(pro => {
      const country = pro.country || 'Desconocido';
      counts[country] = (counts[country] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [uniqueActivePros]);

  const roleData = useMemo(() => {
    const counts: Record<string, number> = {};
    uniqueActivePros.forEach(pro => {
      if (Array.isArray(pro.roles_in_game)) {
        pro.roles_in_game.forEach((r: string) => {
          counts[r] = (counts[r] || 0) + 1;
        });
      } else if (typeof pro.roles_in_game === 'string') {
        const r = pro.roles_in_game as string;
        counts[r] = (counts[r] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [uniqueActivePros]);

  // 2. Salary Calculator
  const { totalEstimatedExpense, expenseBreakdown } = useMemo(() => {
    if (!calcStart || !calcEnd) return { totalEstimatedExpense: 0, expenseBreakdown: [] };
    const start = new Date(calcStart);
    const end = new Date(calcEnd);
    if (start >= end) return { totalEstimatedExpense: 0, expenseBreakdown: [] };

    let total = 0;
    const breakdownMap: Record<string, number> = {};

    contracts.forEach(c => {
      if (c.status !== 'ACTIVE' && c.status !== 'FINISHED') return;
      const cStart = c.start_date ? new Date(c.start_date) : new Date(0); // If no start date, assume forever past
      const cEnd = c.end_date ? new Date(c.end_date) : new Date(8640000000000000); // If no end date, assume forever future

      // Check overlap
      if (cStart <= end && cEnd >= start) {
        // Calculate overlapping months exactly
        const overlapStart = cStart > start ? cStart : start;
        const overlapEnd = cEnd < end ? cEnd : end;
        
        // Month difference as a float
        const msPerMonth = 1000 * 60 * 60 * 24 * 30.44; // average month length
        const overlapMs = overlapEnd.getTime() - overlapStart.getTime();
        const overlapMonths = overlapMs / msPerMonth;
        
        const expense = overlapMonths * (c.salary || 0);
        total += expense;

        if (c.pro) {
          const name = c.pro.nickname || 'Desconocido';
          breakdownMap[name] = (breakdownMap[name] || 0) + expense;
        }
      }
    });

    const breakdown = Object.entries(breakdownMap)
      .map(([name, gasto]) => ({ name, gasto }))
      .sort((a, b) => b.gasto - a.gasto);

    return { totalEstimatedExpense: total, expenseBreakdown: breakdown };
  }, [calcStart, calcEnd, contracts]);

  // 3. Timeline Rendering
  const renderTimeline = () => {
    const yearStart = new Date(timelineYear, 0, 1);
    const yearEnd = new Date(timelineYear, 11, 31, 23, 59, 59);
    
    // Get unique players who were active in this year
    const yearContracts = contracts.filter(c => {
      if (c.status !== 'ACTIVE' && c.status !== 'FINISHED') return false;
      const start = c.start_date ? new Date(c.start_date) : new Date(0);
      const end = c.end_date ? new Date(c.end_date) : new Date(8640000000000000);
      return start <= yearEnd && end >= yearStart;
    });

    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    return (
      <div className="bg-[#121519] border border-gray-800 rounded-xl p-6 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-hltv-accent" />
            Longevidad del Roster
          </h3>
          <div className="flex gap-2">
            {[timelineYear - 1, timelineYear, timelineYear + 1].map(y => (
              <button
                key={y}
                onClick={() => setTimelineYear(y)}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                  y === timelineYear ? 'bg-hltv-accent text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          {/* Months Header */}
          <div className="flex text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 ml-[120px]">
            {months.map(m => (
              <div key={m} className="flex-1 text-center">{m}</div>
            ))}
          </div>

          {/* Grid lines */}
          <div className="absolute top-8 bottom-0 left-[120px] right-0 flex pointer-events-none">
            {months.map((m, i) => (
              <div key={i} className="flex-1 border-l border-gray-800/50"></div>
            ))}
            <div className="border-r border-gray-800/50"></div>
          </div>

          {/* Players */}
          <div className="space-y-4">
            {yearContracts.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No hay registros para este año.</div>
            ) : (
              (() => {
                const playerGroups: Record<number, any[]> = {};
                yearContracts.forEach(c => {
                  if (!c.pro) return;
                  if (!playerGroups[c.pro.id]) playerGroups[c.pro.id] = [];
                  playerGroups[c.pro.id].push(c);
                });

                return Object.values(playerGroups).map(group => {
                  const pro = group[0].pro;
                  return (
                    <div key={pro.id} className="flex items-center relative z-10 group/row">
                      <div className="w-[120px] shrink-0 flex items-center gap-2 pr-4">
                        <div className="w-5 h-3.5 bg-gray-700 rounded overflow-hidden shadow">
                          <img src={`https://flagcdn.com/w20/${pro.country?.toLowerCase() || 'xx'}.png`} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                        </div>
                        <span className="text-white font-bold text-sm truncate group-hover/row:text-hltv-accent transition-colors">
                          {pro.nickname}
                        </span>
                      </div>
                      
                      <div className="flex-1 h-6 relative bg-gray-900/50 rounded overflow-hidden">
                        {group.map(c => {
                          const cStartDate = c.start_date ? new Date(c.start_date) : new Date(0);
                          const cEndDate = c.end_date ? new Date(c.end_date) : new Date(); // If ongoing, up to today
                          
                          // Clamp to year
                          const start = cStartDate < yearStart ? yearStart : cStartDate;
                          const end = cEndDate > yearEnd ? yearEnd : cEndDate;
                          
                          // Calculate percentages
                          const totalYearMs = yearEnd.getTime() - yearStart.getTime();
                          const startMs = start.getTime() - yearStart.getTime();
                          const widthMs = end.getTime() - start.getTime();
                          
                          const leftPercent = (startMs / totalYearMs) * 100;
                          const widthPercent = (widthMs / totalYearMs) * 100;
                          const isActive = c.status === 'ACTIVE';

                          return (
                            <div 
                              key={c.id}
                              className={`absolute top-1 bottom-1 rounded-sm transition-all duration-500 ${isActive ? 'bg-hltv-accent' : 'bg-red-500/80'}`}
                              style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                              title={`${cStartDate.toLocaleDateString()} - ${c.end_date ? cEndDate.toLocaleDateString() : 'Presente'}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 text-hltv-accent animate-spin" />
      </div>
    );
  }

  if (error || !team) {
    return <div className="text-red-400 p-8 text-center font-bold">{error || "Equipo no encontrado"}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 bg-[#1c2026] p-6 rounded-xl border border-gray-800 shadow-lg">
        <button 
          onClick={() => navigate('/my-team')}
          className="p-2 bg-[#121519] hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors border border-gray-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-6">
          {team.logo_url ? (
            <img src={team.logo_url} alt="Logo" className="w-16 h-16 object-contain" />
          ) : (
            <div className="w-16 h-16 bg-[#121519] rounded-lg border border-gray-700 flex items-center justify-center">
              <Shield className="w-8 h-8 text-gray-600" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-hltv-accent" />
              Reportes del Equipo
            </h1>
            <p className="text-gray-500">Métricas, gastos y estadísticas de {team.name}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Timeline */}
        <div className="xl:col-span-2 space-y-6">
          {renderTimeline()}

          {/* Salary Calculator */}
          <div className="bg-[#1c2026] border border-gray-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-white font-bold text-lg flex items-center gap-2 mb-6 border-b border-gray-800 pb-4">
              <DollarSign className="w-5 h-5 text-green-500" />
              Calculadora de Gastos Salariales
            </h3>
            
            <div className="flex flex-wrap md:flex-nowrap gap-6 items-end">
              <div className="flex-1">
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Fecha Inicio</label>
                <input 
                  type="date" 
                  value={calcStart}
                  onChange={e => setCalcStart(e.target.value)}
                  className="w-full bg-[#121519] border border-gray-700 text-white px-4 py-2.5 rounded focus:border-hltv-accent focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Fecha Fin</label>
                <input 
                  type="date" 
                  value={calcEnd}
                  onChange={e => setCalcEnd(e.target.value)}
                  className="w-full bg-[#121519] border border-gray-700 text-white px-4 py-2.5 rounded focus:border-hltv-accent focus:outline-none"
                />
              </div>
              <div className="flex-1 bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                <div className="text-green-500 text-xs font-bold uppercase mb-1">Gasto Estimado</div>
                <div className="text-2xl font-black text-white">
                  ${totalEstimatedExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
            
            {expenseBreakdown.length > 0 && (
              <div className="mt-8 h-[250px] bg-[#121519] border border-gray-800 rounded-lg p-4 pt-8">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expenseBreakdown} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2e33" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#6b7280" 
                      tick={{ fill: '#9ca3af', fontSize: 12 }} 
                      tickLine={false}
                      axisLine={{ stroke: '#374151' }}
                    />
                    <YAxis 
                      stroke="#6b7280" 
                      tick={{ fill: '#9ca3af', fontSize: 12 }} 
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      tickLine={false}
                      axisLine={{ stroke: '#374151' }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1c2026', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
                      itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                      formatter={(value: any) => [`$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Gasto']}
                      cursor={{ fill: '#2a2e33', opacity: 0.4 }}
                    />
                    <Bar dataKey="gasto" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            
            <p className="text-xs text-gray-500 mt-4 text-center">
              * El cálculo se realiza en base a los salarios mensuales y prorrateando los días de contratos activos en el rango seleccionado.
            </p>
          </div>
        </div>

        {/* Right Column: Demographics */}
        <div className="space-y-6">
          {/* Nationality Chart */}
          <div className="bg-[#1c2026] border border-gray-800 rounded-xl p-6 shadow-lg flex flex-col h-[350px]">
            <h3 className="text-white font-bold text-lg flex items-center gap-2 mb-2">
              <PieChartIcon className="w-5 h-5 text-blue-400" />
              Nacionalidad (Roster Activo)
            </h3>
            <div className="flex-1 min-h-0">
              {nationalityData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={nationalityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {nationalityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1c2026', borderColor: '#374151', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">Sin datos</div>
              )}
            </div>
          </div>

          {/* Roles Chart */}
          <div className="bg-[#1c2026] border border-gray-800 rounded-xl p-6 shadow-lg flex flex-col h-[350px]">
            <h3 className="text-white font-bold text-lg flex items-center gap-2 mb-2">
              <PieChartIcon className="w-5 h-5 text-purple-400" />
              Roles en Juego (Roster Activo)
            </h3>
            <div className="flex-1 min-h-0">
              {roleData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {roleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1c2026', borderColor: '#374151', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">Sin datos</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
