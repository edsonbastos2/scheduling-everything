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
            : "bg-white text-stone-800 border border-stone-200 px-8 py-4 rounded-full hover:bg-stone-50 transition-all font-semibold"
        }
      >
        {mode === 'signup' ? 'Começar Agora' : 'Entrar na Conta'}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-8 relative">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 text-stone-400 hover:text-stone-600"
            >
              ✕
            </button>
            
            <div className="text-center mb-8">
              <h2 className="text-3xl serif mb-2">{mode === 'signup' ? 'Criar Conta' : 'Bem-vindo de volta'}</h2>
              <p className="text-stone-500">{mode === 'signup' ? 'Junte-se a milhares de profissionais' : 'Acesse seu painel de controle'}</p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Nome Completo"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                    />
                  </div>
                  <div className="flex bg-stone-50 p-1 rounded-xl border border-stone-200">
                    <button
                      type="button"
                      onClick={() => setRole('client')}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${role === 'client' ? 'bg-white shadow-sm text-brand-primary' : 'text-stone-500'}`}
                    >
                      Sou Cliente
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('admin')}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${role === 'admin' ? 'bg-white shadow-sm text-brand-primary' : 'text-stone-500'}`}
                    >
                      Sou Profissional
                    </button>
                  </div>
                </>
              )}
              
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                <input
                  type="email"
                  placeholder="Seu melhor e-mail"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                <input
                  type="password"
                  placeholder="Sua senha"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
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
