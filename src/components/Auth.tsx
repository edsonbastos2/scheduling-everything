import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { LogIn, UserPlus, Mail, Lock, User } from 'lucide-react';

interface AuthProps {
  mode: 'login' | 'signup';
  onAuthSuccess: () => void;
}

export default function Auth({ mode, onAuthSuccess }: AuthProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'client'>('client');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role,
            },
          },
        });
        if (error) throw error;
        
        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: email,
              full_name: fullName,
              role: role,
            });
          
          if (profileError) {
            console.error('Error creating profile:', profileError);
          }
        }
        
        toast.success('Conta criada! Você já pode entrar.');
        setIsOpen(false); // Close modal after signup
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Login realizado!');
        onAuthSuccess();
      }
      setIsOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={
          mode === 'signup'
            ? "bg-brand-primary text-white px-8 py-4 rounded-full hover:bg-opacity-90 transition-all font-semibold shadow-lg shadow-brand-primary/20"
            : "bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 px-8 py-4 rounded-full hover:bg-stone-50 dark:hover:bg-stone-800 transition-all font-semibold"
        }
      >
        {mode === 'signup' ? 'Começar Agora' : 'Entrar na Conta'}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 dark:bg-black/80 backdrop-blur-sm transition-colors duration-300">
          <div className="bg-white dark:bg-stone-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-8 relative border border-stone-100 dark:border-stone-800">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
            >
              ✕
            </button>
            
            <div className="text-center mb-8">
              <h2 className="text-3xl serif mb-2 text-stone-900 dark:text-stone-100">{mode === 'signup' ? 'Criar Conta' : 'Bem-vindo de volta'}</h2>
              <p className="text-stone-500 dark:text-stone-400">{mode === 'signup' ? 'Junte-se a milhares de profissionais' : 'Acesse seu painel de controle'}</p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400 dark:text-stone-500" />
                    <input
                      type="text"
                      placeholder="Nome Completo"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all dark:text-stone-100"
                    />
                  </div>
                  <div className="flex bg-stone-50 dark:bg-stone-800 p-1 rounded-xl border border-stone-200 dark:border-stone-700">
                    <button
                      type="button"
                      onClick={() => setRole('client')}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${role === 'client' ? 'bg-white dark:bg-stone-700 shadow-sm text-brand-primary' : 'text-stone-500 dark:text-stone-400'}`}
                    >
                      Sou Cliente
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('admin')}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${role === 'admin' ? 'bg-white dark:bg-stone-700 shadow-sm text-brand-primary' : 'text-stone-500 dark:text-stone-400'}`}
                    >
                      Sou Profissional
                    </button>
                  </div>
                </>
              )}
              
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400 dark:text-stone-500" />
                <input
                  type="email"
                  placeholder="Seu melhor e-mail"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all dark:text-stone-100"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400 dark:text-stone-500" />
                <input
                  type="password"
                  placeholder="Sua senha"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all dark:text-stone-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-primary text-white py-4 rounded-xl font-semibold hover:bg-opacity-90 transition-all disabled:opacity-50 mt-4"
              >
                {loading ? 'Processando...' : mode === 'signup' ? 'Criar Conta' : 'Entrar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
