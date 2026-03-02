import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { User, Mail, Camera, Save, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface UserProfileSettingsProps {
  profile: Profile | null;
  onUpdate: (updatedProfile: Profile) => void;
  onBack: () => void;
}

export default function UserProfileSettings({ profile, onUpdate, onBack }: UserProfileSettingsProps) {
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [loading, setLoading] = useState(false);

  // Update local state when profile prop changes (e.g. after fetch completes)
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          avatar_url: avatarUrl,
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;

      toast.success('Perfil atualizado com sucesso!');
      if (data) onUpdate(data);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 animate-in fade-in slide-in-from-bottom-4 duration-500 transition-colors duration-300">
      <button 
        onClick={onBack}
        className="flex items-center text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 mb-6 sm:mb-8 transition-colors group text-sm sm:text-base"
      >
        <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        Voltar
      </button>

      <div className="bg-white dark:bg-stone-900 rounded-[32px] sm:rounded-[40px] shadow-xl shadow-stone-200/50 dark:shadow-black/50 border border-stone-100 dark:border-stone-800 overflow-hidden">
        <div className="bg-brand-primary/5 dark:bg-brand-primary/10 p-6 sm:p-8 border-b border-stone-100 dark:border-stone-800 text-center">
          <div className="relative inline-block mb-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-white dark:border-stone-800 shadow-md bg-stone-100 dark:bg-stone-800 mx-auto">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-300 dark:text-stone-600">
                  <User className="h-10 w-10 sm:h-12 sm:w-12" />
                </div>
              )}
            </div>
            <div className="absolute bottom-0 right-0 bg-white dark:bg-stone-800 p-1.5 sm:p-2 rounded-full shadow-lg border border-stone-100 dark:border-stone-700 text-brand-primary">
              <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl serif text-stone-800 dark:text-stone-100">Minha Conta</h2>
          <p className="text-stone-500 dark:text-stone-400 text-xs sm:text-sm">Gerencie suas informações pessoais</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-600 dark:text-stone-400 flex items-center">
              <User className="h-4 w-4 mr-2" /> Nome Completo
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Seu nome completo"
              className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all dark:text-stone-100"
            />
          </div>

          <div className="space-y-2 opacity-60">
            <label className="text-sm font-semibold text-stone-600 dark:text-stone-400 flex items-center">
              <Mail className="h-4 w-4 mr-2" /> E-mail (Não pode ser alterado)
            </label>
            <input
              type="email"
              disabled
              value={profile?.email || ''}
              className="w-full px-4 py-3 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl cursor-not-allowed dark:text-stone-400"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-600 dark:text-stone-400 flex items-center">
              <Camera className="h-4 w-4 mr-2" /> URL da Foto de Perfil
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://exemplo.com/sua-foto.jpg"
              className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all dark:text-stone-100"
            />
            <p className="text-[10px] text-stone-400 dark:text-stone-500 italic">Cole o link de uma imagem pública (ex: do seu Instagram ou LinkedIn).</p>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-brand-primary/20 hover:bg-opacity-90 transition-all flex items-center justify-center disabled:opacity-50"
            >
              {loading ? (
                'Salvando...'
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" /> Salvar Alterações
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
