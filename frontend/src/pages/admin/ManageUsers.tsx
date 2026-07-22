import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Trash2, Shield, UserCog } from 'lucide-react';

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
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRoleUserId, setEditingRoleUserId] = useState<number | null>(null);

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

  if (loading) return <div className="text-gray-400 p-8">Cargando usuarios...</div>;
  if (error) return <div className="text-red-400 p-8">{error}</div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
        <UserCog className="w-8 h-8 text-hltv-accent" />
        <h2 className="text-2xl font-black text-white">Gestión de Usuarios</h2>
      </div>

      <div className="bg-[#1c2026] border border-gray-800 rounded-xl overflow-hidden shadow-lg">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#232830] border-b border-gray-800 text-gray-300">
            <tr>
              <th className="px-6 py-4 font-bold">ID</th>
              <th className="px-6 py-4 font-bold">Email</th>
              <th className="px-6 py-4 font-bold">Rol Actual</th>
              <th className="px-6 py-4 font-bold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-[#20252c] transition-colors">
                <td className="px-6 py-4 text-gray-400">#{user.id}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${user.is_deleted ? 'text-gray-500 line-through' : 'text-white'}`}>
                      {user.email}
                    </span>
                    {user.is_deleted && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                        Inactivo
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded text-xs font-bold ${
                    user.role?.name === 'Admin' 
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'bg-hltv-accent/10 text-hltv-accent border border-hltv-accent/20'
                  }`}>
                    {user.role?.name || 'Sin Rol'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    {!user.is_deleted ? (
                      <>
                        <button 
                          onClick={() => setEditingRoleUserId(user.id)}
                          className="px-3 py-1.5 text-xs font-bold bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors"
                        >
                          Cambiar Rol
                        </button>
                        
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1.5 text-gray-400 hover:text-orange-400 hover:bg-orange-500/10 rounded transition-colors"
                          title="Dar de baja"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleRecoverUser(user.id)}
                          className="px-3 py-1.5 text-xs font-bold bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded transition-colors"
                        >
                          Restaurar
                        </button>
                        
                        <button 
                          onClick={() => handlePermanentDeleteUser(user.id)}
                          className="px-3 py-1.5 text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded transition-colors"
                          title="Eliminar Definitivamente"
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="p-8 text-center text-gray-500">
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
                    className="w-full text-left px-4 py-3 bg-[#121519] hover:bg-gray-800 border border-gray-700 rounded-lg text-white font-medium transition-colors"
                  >
                    {r.name}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setEditingRoleUserId(null)}
                className="w-full mt-4 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-bold uppercase transition-colors"
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
