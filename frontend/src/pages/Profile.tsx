import { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Camera, Save, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [profileData, setProfileData] = useState<any>(null);
  const [nickname, setNickname] = useState('');
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
      }
      if (selectedFile) {
        formData.append('photo', selectedFile);
      }
      
      const res = await api.put('/users/me/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setProfileData(res.data);
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
  const isAdmin = !isPro && !isOwner && role === 'Admin';

  const currentProfile = isPro ? profileData.pro_profile : isOwner ? profileData.owner_profile : null;

  return (
    <div className="max-w-3xl mx-auto p-4 py-8">
      <div className="bg-[#1c2026] border border-gray-800 rounded-xl overflow-hidden shadow-lg animate-fade-in">
        <div className="bg-gradient-to-r from-hltv-accent to-orange-600 h-32 relative">
          <div className="absolute -bottom-16 left-8">
            <div 
              className="w-32 h-32 rounded-full border-4 border-[#1c2026] bg-[#0d1015] flex items-center justify-center overflow-hidden cursor-pointer group relative"
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserCircle className="w-16 h-16 text-gray-500" />
              )}
              <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center transition-all">
                <Camera className="w-8 h-8 text-white" />
              </div>
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
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white">
              {currentProfile?.full_name || 'Administrador'}
            </h1>
            <p className="text-hltv-accent font-bold uppercase tracking-wider text-sm mt-1">
              {role}
            </p>
            <p className="text-gray-400 mt-1">{profileData.email}</p>
          </div>

          {!isAdmin && (
            <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
              <div className="space-y-4">
                
                {isPro && (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Apodo / In-Game Name
                    </label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={e => setNickname(e.target.value)}
                      className="w-full bg-[#121519] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-hltv-accent focus:ring-1 focus:ring-hltv-accent transition-colors"
                      placeholder="e.g. s1mple"
                    />
                  </div>
                )}

                {isPro && currentProfile.roles_in_game && (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Roles en el juego
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {currentProfile.roles_in_game.map((r: string) => (
                        <span key={r} className="bg-gray-800 text-gray-300 px-3 py-1 rounded text-xs font-bold">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto bg-hltv-accent hover:bg-hltv-accentHover text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
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
