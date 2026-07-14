import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Users, Gamepad2, Briefcase, TrendingUp } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  AreaChart, Area
} from 'recharts';

const COLORS = ['#3b82f6', '#f97316', '#22c55e', '#a855f7', '#ef4444', '#eab308'];

interface ReportOverview {
  total_players: number;
  total_teams: number;
  active_contracts: number;
}

interface RoleDistribution {
  name: string;
  value: number;
}

interface AgeDistribution {
  age: number;
  count: number;
}

interface TeamFinance {
  team_name: string;
  avg_salary: number;
  total_market_value: number;
}

interface ReportData {
  overview: ReportOverview;
  roles_distribution: RoleDistribution[];
  age_distribution: AgeDistribution[];
  team_finances: TeamFinance[];
}

export default function AdminReports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/reports');
      setData(response.data);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-gray-400 p-8">Generando reportes...</div>;
  if (!data) return <div className="text-red-400 p-8">No se pudieron cargar los reportes.</div>;

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
        <TrendingUp className="w-8 h-8 text-hltv-accent" />
        <h2 className="text-2xl font-black text-white">Reportes y Estadísticas</h2>
      </div>

      {/* Tarjetas de Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1c2026] border border-gray-800 rounded-xl p-6 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-lg">
            <Users className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-bold uppercase">Jugadores Profesionales</p>
            <h3 className="text-3xl font-black text-white">{data.overview.total_players}</h3>
          </div>
        </div>

        <div className="bg-[#1c2026] border border-gray-800 rounded-xl p-6 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-orange-500/10 rounded-lg">
            <Gamepad2 className="w-8 h-8 text-orange-500" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-bold uppercase">Equipos Registrados</p>
            <h3 className="text-3xl font-black text-white">{data.overview.total_teams}</h3>
          </div>
        </div>

        <div className="bg-[#1c2026] border border-gray-800 rounded-xl p-6 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-green-500/10 rounded-lg">
            <Briefcase className="w-8 h-8 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-bold uppercase">Contratos Activos</p>
            <h3 className="text-3xl font-black text-white">{data.overview.active_contracts}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Distribución de Roles */}
        <div className="bg-[#1c2026] border border-gray-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4">Jugadores por Rol (In-Game)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.roles_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.roles_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#121519', border: '1px solid #1f2937' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Edades */}
        <div className="bg-[#1c2026] border border-gray-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4">Distribución por Edades</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.age_distribution}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="age" stroke="#9ca3af" tick={{fill: '#9ca3af'}} />
                <YAxis stroke="#9ca3af" tick={{fill: '#9ca3af'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#121519', border: '1px solid #1f2937' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="count" name="Jugadores" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Gráfico de Finanzas de Equipos */}
      <div className="bg-[#1c2026] border border-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-4">Finanzas por Equipo (Contratos Activos)</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.team_finances}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis dataKey="team_name" stroke="#9ca3af" tick={{fill: '#9ca3af'}} />
              <YAxis yAxisId="left" orientation="left" stroke="#10b981" tick={{fill: '#10b981'}} />
              <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" tick={{fill: '#8b5cf6'}} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#121519', border: '1px solid #1f2937' }}
                cursor={{ fill: '#232830' }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="avg_salary" name="Salario Promedio ($)" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="total_market_value" name="Valor Mercado ($)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-500 mt-4 text-center">
          * El valor de mercado se calcula sumando las cláusulas de rescisión de todos los jugadores activos en el equipo.
        </p>
      </div>

    </div>
  );
}
