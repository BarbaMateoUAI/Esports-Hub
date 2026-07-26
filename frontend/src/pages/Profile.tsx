import { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Camera, Save, UserCircle, Edit2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CS2_ROLES = ['Entry', 'AWP', 'Support', 'Lurker', 'IGL', 'Coach', 'Analyst'];

export default function Profile() {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [profileData, setProfileData] = useState<any>(null);
  const [nickname, setNickname] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchProfile();
  }, [isAuthenticated, navigate]);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/me');
      setProfileData(res.data);
      
      if (res.data.pro_profile) {
        setNickname(res.data.pro_profile.nickname || '');
        setSelectedRoles(res.data.pro_profile.roles_in_game || []);
        setPreviewUrl(res.data.pro_profile.photo_url || null);
      } else if (res.data.owner_profile) {
        setPreviewUrl(res.data.owner_profile.photo_url || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const formData = new FormData();
      if (profileData?.pro_profile) {
        formData.append('nickname', nickname);
        if (selectedRoles.length > 0) {
          formData.append('roles', selectedRoles.join(','));
        }
      }
      if (selectedFile) {
        formData.append('photo', selectedFile);
      }
      
      const res = await api.put('/users/me/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setProfileData(res.data);
      setIsEditing(false);
      alert('Perfil actualizado correctamente');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error actualizando perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Cargando perfil...</div>;
  if (!profileData) return null;

  const isPro = !!profileData.pro_profile;
  const isOwner = !!profileData.owner_profile;
  const isAdmin = !isPro && !isOwner && role && !['ProPlayer', 'TeamOwner', 'Unknown'].includes(role);

  const currentProfile = isPro ? profileData.pro_profile : isOwner ? profileData.owner_profile : null;

  return (
    <div className="max-w-3xl mx-auto p-4 py-8">
      <div className="bg-[#1c2026] border border-gray-800 rounded-xl overflow-hidden shadow-lg animate-fade-in">
        <div className="bg-gradient-to-r from-hltv-accent to-orange-600 h-32 relative">
          <div className="absolute -bottom-16 left-8">
            <div 
              className={`w-32 h-32 rounded-full border-4 border-[#1c2026] bg-[#0d1015] flex items-center justify-center overflow-hidden relative ${isEditing ? 'cursor-pointer group' : ''}`}
              onClick={() => isEditing && fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserCircle className="w-16 h-16 text-gray-500" />
              )}
              {isEditing && (
                <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center transition-all">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
        </div>
        
        <div className="pt-20 px-8 pb-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-black text-white">
                {currentProfile?.full_name || 'Administrador'}
              </h1>
              <p className="text-hltv-accent font-bold uppercase tracking-wider text-sm mt-1">
                {role}
              </p>
              <p className="text-gray-400 mt-1">{profileData.email}</p>
            </div>
            
            {!isAdmin && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded font-bold flex items-center gap-2 transition-colors text-sm"
              >
                <Edit2 className="w-4 h-4" />
                Modificar Datos
              </button>
            )}
          </div>

          {!isAdmin && (
            <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
              <div className="space-y-4">
                
                {currentProfile?.full_name && (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      value={currentProfile.full_name}
                      disabled
                      className="w-full bg-[#121519] border border-gray-700 rounded-xl px-4 py-3 text-gray-500 opacity-80 cursor-not-allowed"
                    />
                  </div>
                )}

                {isPro && (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Apodo / In-Game Name
                    </label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={e => setNickname(e.target.value)}
                      disabled={!isEditing}
                      className={`w-full bg-[#121519] border rounded-xl px-4 py-3 transition-colors focus:outline-none ${
                        isEditing 
                          ? 'border-gray-700 text-white focus:border-hltv-accent focus:ring-1 focus:ring-hltv-accent' 
                          : 'border-transparent text-gray-300 opacity-80'
                      }`}
                    />
                  </div>
                )}

                {isPro && (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Roles en el juego
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {isEditing ? (
                        CS2_ROLES.map(r => (
                          <button
                            type="button"
                            key={r}
                            onClick={() => {
                              if (selectedRoles.includes(r)) {
                                setSelectedRoles(selectedRoles.filter(role => role !== r));
                              } else {
                                setSelectedRoles([...selectedRoles, r]);
                              }
                            }}
                            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                              selectedRoles.includes(r)
                                ? 'bg-hltv-accent text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                          >
                            {r}
                          </button>
                        ))
                      ) : (
                        selectedRoles.length > 0 ? (
                          selectedRoles.map((r: string) => (
                            <span key={r} className="bg-gray-800 text-gray-300 px-3 py-1 rounded text-xs font-bold">
                              {r}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500 italic">No roles seleccionados</span>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>

              {isEditing && (
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-hltv-accent hover:bg-hltv-accentHover text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Guardar Cambios
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      setIsEditing(false);
                      fetchProfile(); // Reset fields
                    }}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <X className="w-5 h-5" />
                    Cancelar
                  </button>
                </div>
              )}
            </form>
          )}
          
          {isAdmin && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-sm">
              Tu cuenta tiene privilegios administrativos. No requieres un perfil público.
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
