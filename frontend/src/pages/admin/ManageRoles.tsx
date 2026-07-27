import { useEffect, useState } from 'react';
import api from '../../services/api';
import { ShieldAlert, Check, Edit2, Trash2, RotateCcw, X, Plus, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';

interface Permission {
  id: number;
  name: string;
  description: string;
}

interface Role {
  id: number;
  name: string;
  permissions: Permission[];
  is_deleted: boolean;
}

export default function ManageRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formName, setFormName] = useState('');
  const [formPermissions, setFormPermissions] = useState<number[]>([]);

  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        api.get('/admin/roles'),
        api.get('/admin/permissions')
      ]);
      setRoles(rolesRes.data);
      setAllPermissions(permsRes.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error cargando roles');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (list: Role[]) => {
    return [...list].sort((a, b) => {
      if (!sortConfig) return 0;
      const { key, direction } = sortConfig;
      let aValue: any = key === 'permissions' ? a.permissions.length : a[key as keyof Role];
      let bValue: any = key === 'permissions' ? b.permissions.length : b[key as keyof Role];

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

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

  const activeRoles = handleSort(roles.filter(r => !r.is_deleted));
  const deletedRoles = handleSort(roles.filter(r => r.is_deleted));

  const openModal = (role: Role | null = null) => {
    if (role) {
      setEditingRole(role);
      setFormName(role.name);
      setFormPermissions(role.permissions.map(p => p.id));
    } else {
      setEditingRole(null);
      setFormName('');
      setFormPermissions([]);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRole(null);
    setFormName('');
    setFormPermissions([]);
  };

  const toggleFormPermission = (permId: number) => {
    if (formPermissions.includes(permId)) {
      setFormPermissions(formPermissions.filter(id => id !== permId));
    } else {
      setFormPermissions([...formPermissions, permId]);
    }
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    try {
      if (editingRole) {
        const res = await api.put(`/admin/roles/${editingRole.id}`, { 
          name: formName, 
          permission_ids: formPermissions 
        });
        setRoles(roles.map(r => r.id === editingRole.id ? res.data : r));
      } else {
        const res = await api.post('/admin/roles', { 
          name: formName, 
          permission_ids: formPermissions 
        });
        setRoles([...roles, res.data]);
      }
      closeModal();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error guardando rol');
    }
  };

  const handleSoftDelete = async (roleId: number) => {
    if (!window.confirm('¿Seguro que quieres borrar este rol? Podrás recuperarlo luego.')) return;
    try {
      await api.delete(`/admin/roles/${roleId}`);
      setRoles(roles.map(r => r.id === roleId ? { ...r, is_deleted: true } : r));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error borrando rol');
    }
  };

  const handleRecover = async (roleId: number) => {
    try {
      const res = await api.post(`/admin/roles/${roleId}/recover`);
      setRoles(roles.map(r => r.id === roleId ? res.data : r));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error recuperando rol');
    }
  };

  const handlePermanentDelete = async (roleId: number) => {
    if (!window.confirm('¿Estás COMPLETAMENTE seguro? Esta acción no se puede deshacer.')) return;
    try {
      await api.delete(`/admin/roles/${roleId}/permanent`);
      setRoles(roles.filter(r => r.id !== roleId));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error borrando permanentemente el rol');
    }
  };

  if (loading) return <div className="text-gray-400 p-8 text-sm">Cargando roles...</div>;

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-hltv-accent" />
          <h2 className="text-2xl font-black text-white">Roles y Permisos</h2>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-hltv-accent hover:bg-hltv-accentHover text-white px-3 py-2 rounded text-sm font-bold uppercase tracking-wider transition-colors shadow-md"
        >
          <Plus className="w-4 h-4" />
          Nuevo Rol
        </button>
      </div>

      <div className="bg-[#1c2026] border border-gray-800 rounded-lg overflow-hidden shadow-lg">
        <div className="p-3 bg-[#232830] border-b border-gray-800">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Roles Activos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1c2026] border-b border-gray-800 text-gray-400">
              <tr>
                <th onClick={() => requestSort('name')} className="px-4 py-3 font-bold cursor-pointer hover:bg-gray-700 transition-colors select-none">
                  <div className="flex items-center gap-2">
                    Nombre del Rol
                    <SortIcon columnKey="name" />
                  </div>
                </th>
                <th onClick={() => requestSort('permissions')} className="px-4 py-3 font-bold cursor-pointer hover:bg-gray-700 transition-colors select-none">
                  <div className="flex items-center gap-2">
                    Permisos Asignados
                    <SortIcon columnKey="permissions" />
                  </div>
                </th>
                <th className="px-4 py-3 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {activeRoles.map(role => (
                <tr key={role.id} className="hover:bg-[#20252c] transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-300 font-bold">{role.name}</span>
                      {role.name === 'Admin' && (
                        <span className="text-[9px] uppercase tracking-wider bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20">
                          Superuser
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">
                    <span className="font-mono text-gray-400">{role.permissions.length}</span> permiso(s)
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openModal(role)}
                        className="p-1 text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                        title="Editar Permisos"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {role.name !== 'Admin' && (
                        <button 
                          onClick={() => handleSoftDelete(role.id)}
                          className="p-1 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                          title="Borrar (Logico)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {activeRoles.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-500 text-sm">
                    No hay roles activos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {deletedRoles.length > 0 && (
        <div className="bg-[#1c2026] border border-red-900/30 rounded-lg overflow-hidden shadow-lg opacity-80 hover:opacity-100 transition-opacity">
          <div className="p-3 bg-red-950/20 border-b border-red-900/30">
            <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider">Roles Borrados (Papelera)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1c2026] border-b border-red-900/30 text-gray-400">
                <tr>
                  <th onClick={() => requestSort('name')} className="px-4 py-3 font-bold cursor-pointer hover:bg-gray-700 transition-colors select-none">
                    <div className="flex items-center gap-2">
                      Nombre del Rol
                      <SortIcon columnKey="name" />
                    </div>
                  </th>
                  <th className="px-4 py-3 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-900/30">
                {deletedRoles.map(role => (
                  <tr key={role.id} className="hover:bg-[#20252c] transition-colors">
                    <td className="px-4 py-2.5 text-gray-600 line-through">
                      {role.name}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleRecover(role.id)}
                          className="flex items-center gap-1 px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold text-green-400 hover:bg-green-500/10 rounded transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Recuperar
                        </button>
                        <button 
                          onClick={() => handlePermanentDelete(role.id)}
                          className="flex items-center gap-1 px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold text-red-500 hover:bg-red-500/10 rounded transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c2026] border border-gray-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 bg-gradient-to-r from-gray-900 to-[#121519] border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">
                {editingRole ? 'Editar Permisos' : 'Crear Nuevo Rol'}
              </h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 overflow-y-auto space-y-6 flex-1">
                <div>
                  <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Nombre del Rol</label>
                  <input 
                    type="text" 
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    disabled={editingRole?.name === 'Admin'}
                    className="w-full bg-[#121519] border border-gray-700 text-white px-3 py-2 text-sm rounded focus:border-hltv-accent focus:ring-1 focus:ring-hltv-accent outline-none disabled:opacity-50"
                    placeholder="Ej. Entrenador"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-xs font-bold uppercase mb-3">Permisos Asignados</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {allPermissions.map(perm => {
                      const hasPerm = formPermissions.includes(perm.id);
                      return (
                        <div 
                          key={perm.id} 
                          onClick={() => {
                            if (editingRole?.name !== 'Admin') toggleFormPermission(perm.id);
                          }}
                          className={`flex items-start gap-2 p-2.5 rounded-lg border ${
                            hasPerm 
                              ? 'bg-hltv-accent/10 border-hltv-accent/50 cursor-pointer' 
                              : 'bg-[#121519] border-gray-800 hover:border-gray-600 cursor-pointer'
                          } ${editingRole?.name === 'Admin' ? 'opacity-70 cursor-not-allowed' : ''} transition-colors`}
                        >
                          <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border ${
                            hasPerm 
                              ? 'bg-hltv-accent border-hltv-accent text-white flex items-center justify-center' 
                              : 'border-gray-600 bg-[#0d1015]'
                          }`}>
                            {hasPerm && <Check className="w-3 h-3" />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-200">{perm.name}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{perm.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-800 bg-[#121519] flex justify-end gap-2">
                <button 
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs rounded font-bold uppercase transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={!formName.trim()}
                  className="px-5 py-2 bg-hltv-accent hover:bg-hltv-accentHover text-white text-xs rounded font-bold uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
