import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { Lock, Eye, EyeOff } from 'lucide-react';

export default function ResetPassword({ onComplete }: { onComplete: () => void }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Senha atualizada com sucesso!');
      onComplete();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-white dark:bg-stone-900 rounded-[32px] shadow-xl border border-stone-100 dark:border-stone-800">
      <div className="text-center mb-8">
        <h2 className="text-3xl serif mb-2 text-stone-900 dark:text-stone-100">Nova Senha</h2>
        <p className="text-stone-500 dark:text-stone-400">Escolha uma nova senha segura para sua conta.</p>
      </div>

      <form onSubmit={handleReset} className="space-y-4">
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400 dark:text-stone-500" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Nova senha"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-12 pr-12 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all dark:text-stone-100"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400 dark:text-stone-500" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Confirme a nova senha"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full pl-12 pr-12 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all dark:text-stone-100"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-primary text-white py-4 rounded-xl font-semibold hover:bg-opacity-90 transition-all disabled:opacity-50 mt-4"
        >
          {loading ? 'Atualizando...' : 'Redefinir Senha'}
        </button>
      </form>
    </div>
  );
}
