import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Trash2, UserCog, ArrowUpDown, ChevronUp, ChevronDown, Eye, ShieldCheck } from 'lucide-react';

interface Permission {
  id: number;
  name: string;
  description: string | null;
}

interface Role {
  id: number;
  name: string;
  permissions: Permission[];
}

interface User {
  id: number;
  email: string;
  is_deleted: boolean;
  roles: Role[];
  specific_permissions: Permission[];
}

export default function ManageUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [selectedSpecificPermIds, setSelectedSpecificPermIds] = useState<number[]>([]);
  const [showAllPerms, setShowAllPerms] = useState(false);

  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes, permsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/roles'),
        api.get('/admin/permissions')
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
      setAllPermissions(permsRes.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const openRoleEditor = (user: User) => {
    setEditingUserId(user.id);
    setSelectedRoleIds(user.roles?.map(r => r.id) || []);
    setSelectedSpecificPermIds(user.specific_permissions?.map(p => p.id) || []);
    setShowAllPerms(false);
  };

  const handleSave = async () => {
    if (!editingUserId) return;
    try {
      // Guardar roles y permisos específicos secuencialmente
      await api.put(`/admin/users/${editingUserId}/roles`, selectedRoleIds);
      await api.put(`/admin/users/${editingUserId}/permissions`, { permission_ids: selectedSpecificPermIds });
      
      setUsers(users.map(u => 
        u.id === editingUserId 
          ? { 
              ...u, 
              roles: roles.filter(r => selectedRoleIds.includes(r.id)),
              specific_permissions: allPermissions.filter(p => selectedSpecificPermIds.includes(p.id))
            } 
          : u
      ));
      setEditingUserId(null);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al guardar');
    }
  };

  const toggleRole = (roleId: number) => {
    if (selectedRoleIds.includes(roleId)) {
      setSelectedRoleIds(selectedRoleIds.filter(id => id !== roleId));
    } else {
      setSelectedRoleIds([...selectedRoleIds, roleId]);
    }
  };

  const toggleSpecificPerm = (permId: number) => {
    if (selectedSpecificPermIds.includes(permId)) {
      setSelectedSpecificPermIds(selectedSpecificPermIds.filter(id => id !== permId));
    } else {
      setSelectedSpecificPermIds([...selectedSpecificPermIds, permId]);
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
      aValue = a.roles?.map(r => r.name).join(', ') || '';
      bValue = b.roles?.map(r => r.name).join(', ') || '';
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

  // Compute all inherited permissions from currently checked roles
  const inheritedPermIds = new Set<number>();
  selectedRoleIds.forEach(rid => {
    const r = roles.find(ro => ro.id === rid);
    r?.permissions?.forEach(p => inheritedPermIds.add(p.id));
  });

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
                    Roles Actuales
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
                    <div className="flex gap-1 flex-wrap">
                      {user.roles && user.roles.length > 0 ? user.roles.map(r => (
                        <span key={r.id} className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          r.name === 'Admin' 
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-hltv-accent/10 text-hltv-accent border border-hltv-accent/20'
                        }`}>
                          {r.name}
                        </span>
                      )) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-800 text-gray-400">Sin Rol</span>
                      )}
                    </div>
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
                      {!user.roles?.some(r => r.name === 'Admin') && (
                        !user.is_deleted ? (
                          <>
                            <button 
                              onClick={() => openRoleEditor(user)}
                              className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors flex items-center gap-1"
                            >
                              <ShieldCheck className="w-3 h-3"/> Permisos
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

      {editingUserId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c2026] border border-gray-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 bg-gradient-to-r from-gray-900 to-[#121519] border-b border-gray-800 shrink-0">
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Permisos y Roles</h3>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
              
              {/* Roles Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Roles</h4>
                <div className="flex flex-col gap-2">
                  {roles.map(r => {
                    const isSelected = selectedRoleIds.includes(r.id);
                    return (
                      <div key={r.id} className={`border rounded-lg transition-colors ${isSelected ? 'bg-[#121519] border-gray-600' : 'bg-transparent border-gray-800'}`}>
                        <label className="flex items-center gap-3 px-4 py-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => toggleRole(r.id)}
                            className="w-4 h-4 text-hltv-accent bg-gray-800 border-gray-600 rounded focus:ring-hltv-accent focus:ring-2"
                          />
                          <span className="text-white font-medium text-sm">{r.name}</span>
                        </label>
                        
                        {/* Render Role Permissions if checked */}
                        {isSelected && r.permissions?.length > 0 && (
                          <div className="px-4 pb-3 pl-11">
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Permisos del Rol:</div>
                            <div className="flex flex-col gap-1.5">
                              {r.permissions.map(p => (
                                <div key={p.id} className="flex items-center gap-2 text-xs text-gray-300">
                                  <CheckIcon />
                                  <span>{p.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Specific Permissions Section */}
              <div className="border-t border-gray-800 pt-6">
                <button 
                  onClick={() => setShowAllPerms(!showAllPerms)}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider group-hover:text-gray-300 transition-colors">Todos los Permisos (Específicos)</h4>
                  {showAllPerms ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </button>
                
                {showAllPerms && (
                  <div className="mt-4 flex flex-col gap-2">
                    {allPermissions.map(p => {
                      const isInherited = inheritedPermIds.has(p.id);
                      const isSpecific = selectedSpecificPermIds.includes(p.id);
                      const isChecked = isInherited || isSpecific;

                      return (
                        <label 
                          key={p.id} 
                          className={`flex items-start gap-3 px-3 py-2 rounded-lg transition-colors ${
                            isInherited ? 'bg-gray-800/30 opacity-70 cursor-not-allowed' : 'hover:bg-gray-800 cursor-pointer'
                          }`}
                          title={isInherited ? "Heredado de un rol" : ""}
                        >
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            disabled={isInherited}
                            onChange={() => toggleSpecificPerm(p.id)}
                            className="w-4 h-4 mt-0.5 text-hltv-accent bg-gray-800 border-gray-600 rounded focus:ring-hltv-accent focus:ring-2 disabled:bg-gray-700 disabled:border-gray-600 disabled:text-gray-500"
                          />
                          <div className="flex flex-col">
                            <span className={`font-medium text-sm ${isInherited ? 'text-gray-400' : 'text-gray-200'}`}>{p.name}</span>
                            {p.description && <span className="text-xs text-gray-500">{p.description}</span>}
                            {isInherited && <span className="text-[10px] text-hltv-accent mt-1 uppercase font-bold tracking-wider">Heredado</span>}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            <div className="p-6 bg-gradient-to-r from-gray-900 to-[#121519] border-t border-gray-800 shrink-0 flex gap-3">
              <button 
                onClick={handleSave}
                className="flex-1 px-4 py-3 bg-hltv-accent hover:bg-hltv-accentHover text-white rounded-lg font-bold uppercase text-sm transition-colors"
              >
                Guardar Cambios
              </button>
              <button 
                onClick={() => setEditingUserId(null)}
                className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-bold uppercase text-sm transition-colors"
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

function CheckIcon() {
  return (
    <div className="w-3.5 h-3.5 rounded bg-gray-700 flex items-center justify-center shrink-0">
      <svg className="w-2.5 h-2.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
      </svg>
    </div>
  );
}
