import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Trash2, UserCog, ArrowUpDown, ChevronUp, ChevronDown, Eye } from 'lucide-react';

interface Role {
  id: number;
  name: string;
}

interface User {
  id: number;
  email: string;
  is_deleted: boolean;
  role: Role | null;
}

export default function ManageUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRoleUserId, setEditingRoleUserId] = useState<number | null>(null);

  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/roles')
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, roleId: number) => {
    try {
      await api.put(`/admin/users/${userId}/role?role_id=${roleId}`);
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: roles.find(r => r.id === roleId) || null } : u
      ));
      setEditingRoleUserId(null);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al cambiar rol');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('¿Estás seguro de que quieres dar de baja a este usuario?')) return;

    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(users.map(u => u.id === userId ? { ...u, is_deleted: true } : u));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al dar de baja al usuario');
    }
  };

  const handleRecoverUser = async (userId: number) => {
    try {
      await api.post(`/admin/users/${userId}/recover`);
      setUsers(users.map(u => u.id === userId ? { ...u, is_deleted: false } : u));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al restaurar usuario');
    }
  };

  const handlePermanentDeleteUser = async (userId: number) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar a este usuario permanentemente? Esta acción no se puede deshacer.')) return;
    try {
      await api.delete(`/admin/users/${userId}/permanent`);
      setUsers(users.filter(u => u.id !== userId));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al eliminar usuario permanentemente');
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    let aValue: any = a[key as keyof User];
    let bValue: any = b[key as keyof User];

    if (key === 'role') {
      aValue = a.role?.name || '';
      bValue = b.role?.name || '';
    }

    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown className="w-3 h-3 text-gray-600" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-hltv-accent" /> : <ChevronDown className="w-3 h-3 text-hltv-accent" />;
  };

  if (loading) return <div className="text-gray-400 p-8">Cargando usuarios...</div>;
  if (error) return <div className="text-red-400 p-8">{error}</div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
        <UserCog className="w-8 h-8 text-hltv-accent" />
        <h2 className="text-2xl font-black text-white">Gestión de Usuarios</h2>
      </div>

      <div className="bg-[#1c2026] border border-gray-800 rounded-lg overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#232830] border-b border-gray-800 text-gray-300">
              <tr>
                <th onClick={() => requestSort('id')} className="px-4 py-3 font-bold cursor-pointer hover:bg-gray-700 transition-colors select-none group w-20">
                  <div className="flex items-center gap-2">
                    ID
                    <SortIcon columnKey="id" />
                  </div>
                </th>
                <th onClick={() => requestSort('email')} className="px-4 py-3 font-bold cursor-pointer hover:bg-gray-700 transition-colors select-none group">
                  <div className="flex items-center gap-2">
                    Email
                    <SortIcon columnKey="email" />
                  </div>
                </th>
                <th onClick={() => requestSort('role')} className="px-4 py-3 font-bold cursor-pointer hover:bg-gray-700 transition-colors select-none group">
                  <div className="flex items-center gap-2">
                    Rol Actual
                    <SortIcon columnKey="role" />
                  </div>
                </th>
                <th className="px-4 py-3 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {sortedUsers.map(user => (
                <tr key={user.id} className="hover:bg-[#20252c] transition-colors">
                  <td className="px-4 py-2.5 text-gray-500 font-mono">#{user.id}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${user.is_deleted ? 'text-gray-600 line-through' : 'text-gray-300'}`}>
                        {user.email}
                      </span>
                      {user.is_deleted && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wider">
                          Inactivo
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      user.role?.name === 'Admin' 
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-hltv-accent/10 text-hltv-accent border border-hltv-accent/20'
                    }`}>
                      {user.role?.name || 'Sin Rol'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => navigate(`/admin/users/${user.id}`)}
                        className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded transition-colors flex items-center gap-1"
                        title="Ver Perfil Completo"
                      >
                        <Eye className="w-3 h-3" />
                        Ver
                      </button>
                      {user.role?.name !== 'Admin' && (
                        !user.is_deleted ? (
                          <>
                            <button 
                              onClick={() => setEditingRoleUserId(user.id)}
                              className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors"
                            >
                              Rol
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-1 text-gray-500 hover:text-orange-400 hover:bg-orange-500/10 rounded transition-colors"
                              title="Dar de baja"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleRecoverUser(user.id)}
                              className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded transition-colors"
                            >
                              Restaurar
                            </button>
                            <button 
                              onClick={() => handlePermanentDeleteUser(user.id)}
                              className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded transition-colors"
                              title="Eliminar Definitivamente"
                            >
                              Eliminar
                            </button>
                          </>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <div className="p-8 text-center text-gray-500 text-sm">
            No hay usuarios registrados.
          </div>
        )}
      </div>
      {editingRoleUserId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c2026] border border-gray-800 rounded-xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-6 bg-gradient-to-r from-gray-900 to-[#121519] border-b border-gray-800">
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Seleccionar Nuevo Rol</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-col gap-2">
                {roles.map(r => (
                  <button 
                    key={r.id} 
                    onClick={() => handleRoleChange(editingRoleUserId, r.id)}
                    className="w-full text-left px-4 py-3 bg-[#121519] hover:bg-gray-800 border border-gray-700 rounded-lg text-white font-medium transition-colors text-sm"
                  >
                    {r.name}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setEditingRoleUserId(null)}
                className="w-full mt-4 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-bold uppercase text-sm transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
