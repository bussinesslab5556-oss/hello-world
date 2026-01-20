
import React, { useState, useEffect } from 'react';
import { profileService } from '../../../../packages/services/profile-service.ts';
import { storageService } from '../../../../packages/services/storage-service.ts';
import { Profile } from '../../../../packages/types/profile.ts';
import { Camera, Check, User } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
];

export const ProfileSection: React.FC<{ userId: string }> = ({ userId }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  useEffect(() => {
    const fetchProfile = async () => {
      const data = await profileService.getProfile(userId);
      if (data) setProfile(data);
      setLoading(false);
    };
    fetchProfile();
  }, [userId]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploading(true);
    try {
      const { url, key, error } = await storageService.getUploadUrl(userId, file.name, file.size, file.type);
      if (error) throw new Error(error);
      
      await storageService.uploadFile(url!, file, () => {});
      await storageService.confirmUpload(userId, key!, file.size);
      
      const publicUrl = await storageService.getDownloadUrl(key!);
      await handleUpdate({ avatar_url: publicUrl });
    } catch (err) {
      console.error('Avatar upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (updates: Partial<Profile>) => {
    setSaveStatus('saving');
    const result = await profileService.updateProfile(userId, updates);
    if (result.success) {
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } else {
      setSaveStatus('idle');
    }
  };

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-20 w-20 bg-white/5 rounded-full mx-auto" /><div className="h-10 bg-white/5 rounded-xl w-full" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Avatar Section */}
      <div className="flex flex-col items-center">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full bg-[#2B2F36] border-4 border-[#39FF14] overflow-hidden flex items-center justify-center shadow-[0_0_30px_rgba(57,255,20,0.15)]">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Profile" />
            ) : (
              <User size={40} className="text-[#3A3F47]" />
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-[#39FF14] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#007BFF] rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-blue-600 transition-all border-2 border-[#1F2329]">
            <Camera size={16} className="text-white" />
            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} disabled={uploading} />
          </label>
        </div>
        <h4 className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest mt-4">Profile Identity</h4>
      </div>

      {/* Input Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest px-1">Display Name</label>
          <input 
            type="text"
            defaultValue={profile?.full_name || ''}
            onBlur={(e) => handleUpdate({ full_name: e.target.value })}
            className="w-full bg-[#2B2F36] border border-[#3A3F47] rounded-xl px-4 py-3 text-sm text-white focus:border-[#007BFF] outline-none transition-all"
            placeholder="John Doe"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest px-1">Username</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 font-bold">@</span>
            <input 
              type="text"
              defaultValue={profile?.username || ''}
              onBlur={(e) => handleUpdate({ username: e.target.value.toLowerCase() })}
              className="w-full bg-[#2B2F36] border border-[#3A3F47] rounded-xl pl-9 pr-4 py-3 text-sm text-white focus:border-[#007BFF] outline-none transition-all"
              placeholder="username"
            />
          </div>
        </div>
      </div>

      {/* Language Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest px-1">Native Language</label>
          <select 
            value={profile?.primary_language || 'en'}
            onChange={(e) => handleUpdate({ primary_language: e.target.value })}
            className="w-full bg-[#2B2F36] border border-[#3A3F47] rounded-xl px-4 py-3 text-sm text-white focus:border-[#007BFF] outline-none transition-all appearance-none cursor-pointer"
          >
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest px-1">Translation Target</label>
          <select 
            value={profile?.secondary_language || ''}
            onChange={(e) => handleUpdate({ secondary_language: e.target.value })}
            className="w-full bg-[#2B2F36] border border-[#3A3F47] rounded-xl px-4 py-3 text-sm text-white focus:border-[#007BFF] outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="">None (Native Mode)</option>
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        {saveStatus === 'saving' && <span className="text-[10px] font-black text-[#007BFF] uppercase tracking-widest animate-pulse">Syncing...</span>}
        {saveStatus === 'success' && <span className="text-[10px] font-black text-[#39FF14] uppercase tracking-widest flex items-center gap-2"><Check size={12}/> Profile Updated</span>}
      </div>
    </div>
  );
};
