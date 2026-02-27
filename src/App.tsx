import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Toaster, toast } from 'react-hot-toast';
import { LogIn, UserPlus, Calendar, Settings, LogOut, Scissors, Clock, MapPin, Menu, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Profile, Salon, Service, Appointment } from './types';

// Components
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Booking from './components/Booking';
import ClientAppointments from './components/ClientAppointments';
import UserProfileSettings from './components/UserProfileSettings';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [view, setView] = useState<'home' | 'dashboard' | 'booking' | 'client_appointments' | 'profile_settings'>('home');
  const [dashboardTab, setDashboardTab] = useState<'overview' | 'services' | 'settings' | 'analytics'>('overview');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
    } else {
      setProfile(data);
      // Redirect based on role if we are at home or just logged in
      if (view === 'home' || view === 'dashboard') {
        if (data.role === 'admin') {
          setView('dashboard');
        } else {
          setView('booking');
        }
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView('home');
    toast.success('Deslogado com sucesso');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster position="top-right" />
      
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center cursor-pointer" onClick={() => setView('home')}>
              <Scissors className="h-8 w-8 text-brand-primary mr-2" />
              <span className="text-2xl serif font-bold tracking-tight text-stone-800">GlowSchedule</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              {session && (
                <>
                  {profile?.role === 'admin' ? (
                    <>
                      <button onClick={() => { setView('dashboard'); setDashboardTab('overview'); }} className="text-stone-600 hover:text-brand-primary transition-colors">Painel</button>
                      <button onClick={() => { setView('dashboard'); setDashboardTab('services'); }} className="text-stone-600 hover:text-brand-primary transition-colors">Serviços</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setView('booking')} className="text-stone-600 hover:text-brand-primary transition-colors">Agendar</button>
                      <button onClick={() => setView('client_appointments')} className="text-stone-600 hover:text-brand-primary transition-colors">Meus Agendamentos</button>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {session ? (
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => setView('profile_settings')}
                    className="flex items-center space-x-3 group"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-stone-200 bg-stone-100 flex-shrink-0">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-400">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-stone-500 group-hover:text-brand-primary transition-colors hidden sm:inline">
                      {profile?.full_name || session.user.email}
                    </span>
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-stone-500 hover:text-red-500 transition-colors hidden md:block"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="hidden md:block">
                  <button 
                    onClick={() => setView('home')}
                    className="bg-brand-primary text-white px-6 py-2 rounded-full hover:bg-opacity-90 transition-all font-medium text-sm"
                  >
                    Entrar
                  </button>
                </div>
              )}

              {/* Mobile Menu Button */}
              <div className="md:hidden flex items-center">
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 text-stone-500 hover:text-brand-primary transition-colors"
                >
                  {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-stone-100 overflow-hidden"
            >
              <div className="px-4 pt-2 pb-6 space-y-1">
                {session ? (
                  <>
                    {profile?.role === 'admin' ? (
                      <>
                        <button 
                          onClick={() => { setView('dashboard'); setDashboardTab('overview'); setIsMenuOpen(false); }} 
                          className="block w-full text-left px-4 py-3 text-stone-600 hover:bg-stone-50 rounded-xl font-medium"
                        >
                          Painel
                        </button>
                        <button 
                          onClick={() => { setView('dashboard'); setDashboardTab('services'); setIsMenuOpen(false); }} 
                          className="block w-full text-left px-4 py-3 text-stone-600 hover:bg-stone-50 rounded-xl font-medium"
                        >
                          Serviços
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => { setView('booking'); setIsMenuOpen(false); }} 
                          className="block w-full text-left px-4 py-3 text-stone-600 hover:bg-stone-50 rounded-xl font-medium"
                        >
                          Agendar
                        </button>
                        <button 
                          onClick={() => { setView('client_appointments'); setIsMenuOpen(false); }} 
                          className="block w-full text-left px-4 py-3 text-stone-600 hover:bg-stone-50 rounded-xl font-medium"
                        >
                          Meus Agendamentos
                        </button>
                      </>
                    )}
                    <div className="pt-4 mt-4 border-t border-stone-100">
                      <button 
                        onClick={() => { setView('profile_settings'); setIsMenuOpen(false); }} 
                        className="flex items-center w-full text-left px-4 py-3 text-stone-600 hover:bg-stone-50 rounded-xl font-medium"
                      >
                        <User className="h-4 w-4 mr-2" /> Minha Conta
                      </button>
                      <button 
                        onClick={() => { handleLogout(); setIsMenuOpen(false); }} 
                        className="flex items-center w-full text-left px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-medium"
                      >
                        <LogOut className="h-4 w-4 mr-2" /> Sair
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="pt-4">
                    <button 
                      onClick={() => { setView('home'); setIsMenuOpen(false); }}
                      className="w-full bg-brand-primary text-white px-6 py-3 rounded-xl font-bold text-center"
                    >
                      Entrar
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {view === 'home' && !session && (
            <motion.div 
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8"
            >
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h1 className="text-6xl sm:text-7xl serif leading-tight mb-6">
                    Beleza e Estilo, <br />
                    <span className="italic text-brand-primary">Agendados.</span>
                  </h1>
                  <p className="text-xl text-stone-600 mb-8 max-w-lg">
                    A plataforma definitiva para gerenciar seu salão ou barbearia. 
                    Agendamentos simples, gestão eficiente e clientes satisfeitos.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Auth mode="signup" onAuthSuccess={() => setView('dashboard')} />
                    <Auth mode="login" onAuthSuccess={() => setView('dashboard')} />
                  </div>
                </div>
                <div className="relative">
                  <div className="aspect-[3/4] rounded-[32px] overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
                    <img 
                      src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=800" 
                      alt="Salon" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl max-w-xs hidden sm:block">
                    <div className="flex items-center mb-2">
                      <div className="flex -space-x-2">
                        {[1,2,3].map(i => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-stone-200 overflow-hidden">
                            <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                          </div>
                        ))}
                      </div>
                      <span className="ml-4 text-sm font-medium">+500 agendamentos hoje</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {session && view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Dashboard profile={profile} initialTab={dashboardTab} />
            </motion.div>
          )}

          {session && view === 'booking' && (
            <motion.div 
              key="booking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Booking />
            </motion.div>
          )}
          {session && view === 'client_appointments' && (
            <motion.div 
              key="client_appointments"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ClientAppointments profile={profile} />
            </motion.div>
          )}
          {session && view === 'profile_settings' && (
            <motion.div 
              key="profile_settings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <UserProfileSettings 
                profile={profile} 
                onUpdate={(updated) => setProfile(updated)} 
                onBack={() => setView(profile?.role === 'admin' ? 'dashboard' : 'booking')} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-stone-100 border-t border-stone-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center items-center mb-6">
            <Scissors className="h-6 w-6 text-brand-primary mr-2" />
            <span className="text-xl serif font-bold tracking-tight text-stone-800">GlowSchedule</span>
          </div>
          <p className="text-stone-500 text-sm">© 2024 GlowSchedule. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
