import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Toaster, toast } from 'react-hot-toast';
import { LogIn, UserPlus, Calendar, Settings, LogOut, Scissors, Clock, MapPin, Menu, X, User, Sun, Moon, LayoutDashboard, ListChecks, BarChart3, Star, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Profile, Salon, Service, Appointment } from './types';

// Components
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Booking from './components/Booking';
import ClientAppointments from './components/ClientAppointments';
import UserProfileSettings from './components/UserProfileSettings';
import EstablishmentDiscovery from './components/EstablishmentDiscovery';
import EstablishmentDetail from './components/EstablishmentDetail';
import ResetPassword from './components/ResetPassword';

import SuperAdminDashboard from './components/SuperAdminDashboard';
import NotificationManager from './components/NotificationManager';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [view, setView] = useState<'home' | 'dashboard' | 'booking' | 'client_appointments' | 'profile_settings' | 'discovery' | 'salon_detail' | 'super_admin_dashboard' | 'reset_password'>('home');
  const [selectedSalonId, setSelectedSalonId] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [dashboardTab, setDashboardTab] = useState<'overview' | 'services' | 'settings' | 'analytics' | 'reviews'>('overview');
  const [discoveryTab, setDiscoveryTab] = useState<'salons' | 'services'>('salons');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') {
        setView('reset_password');
      } else if (session) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
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
      if (view === 'home' || view === 'dashboard' || view === 'booking' || view === 'super_admin_dashboard') {
        if (data.role === 'super_admin') {
          setView('super_admin_dashboard');
        } else if (data.role === 'admin') {
          setView('dashboard');
        } else {
          setView('discovery');
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
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'dark bg-brand-bg-dark text-stone-100' : 'bg-brand-bg text-stone-900'}`}>
      <Toaster position="top-right" />
      <NotificationManager userId={profile?.id} role={profile?.role} />
      
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center cursor-pointer" onClick={() => { setView('home'); setSelectedSalonId(null); setSelectedService(null); }}>
              <Scissors className="h-8 w-8 text-brand-primary mr-2" />
              <span className="text-2xl serif font-bold tracking-tight text-stone-800 dark:text-stone-100">GlowSchedule</span>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Theme Toggle - Outside the menu */}
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="p-3 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 rounded-2xl hover:bg-stone-200 dark:hover:bg-stone-700 transition-all shadow-sm"
                title={theme === 'light' ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}
              >
                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </button>

              {/* Mobile Menu Button - Now the only menu */}
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-3 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-2xl hover:bg-brand-primary hover:text-white transition-all shadow-sm"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Unified Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-stone-900/60 dark:bg-black/80 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[300px] bg-white dark:bg-stone-900 z-[110] shadow-2xl flex flex-col border-l border-stone-100 dark:border-stone-800"
            >
              <div className="p-6 flex justify-between items-center border-b border-stone-100 dark:border-stone-800">
                <span className="text-xl serif font-bold text-brand-primary">Menu</span>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-stone-400" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-6 space-y-8">
                {/* User Profile Info */}
                {session && (
                  <div className="flex items-center space-x-4 p-4 bg-stone-50 dark:bg-stone-800/50 rounded-3xl border border-stone-100 dark:border-stone-800">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white dark:border-stone-700 shadow-sm flex-shrink-0">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-400 bg-stone-100 dark:bg-stone-800">
                          <User className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-stone-800 dark:text-stone-100 truncate">{profile?.full_name || session.user.email}</p>
                      <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{session.user.email}</p>
                    </div>
                  </div>
                )}

                {/* Navigation Links */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest px-4 mb-2">Navegação</p>
                  
                  <MenuLink 
                    icon={<Scissors className="h-5 w-5" />} 
                    label="Início" 
                    onClick={() => { setView('home'); setIsMenuOpen(false); }} 
                    active={view === 'home'}
                  />

                  {session ? (
                    <>
                      {profile?.role === 'super_admin' ? (
                        <MenuLink 
                          icon={<LayoutDashboard className="h-5 w-5" />} 
                          label="SaaS Admin" 
                          onClick={() => { setView('super_admin_dashboard'); setIsMenuOpen(false); }} 
                          active={view === 'super_admin_dashboard'}
                        />
                      ) : profile?.role === 'admin' ? (
                        <>
                          <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest px-4 mt-6 mb-2">Meu Salão</p>
                          <MenuLink 
                            icon={<LayoutDashboard className="h-5 w-5" />} 
                            label="Visão Geral" 
                            onClick={() => { setView('dashboard'); setDashboardTab('overview'); setIsMenuOpen(false); }} 
                            active={view === 'dashboard' && dashboardTab === 'overview'}
                          />
                          <MenuLink 
                            icon={<ListChecks className="h-5 w-5" />} 
                            label="Serviços" 
                            onClick={() => { setView('dashboard'); setDashboardTab('services'); setIsMenuOpen(false); }} 
                            active={view === 'dashboard' && dashboardTab === 'services'}
                          />
                          <MenuLink 
                            icon={<Users className="h-5 w-5" />} 
                            label="Profissionais" 
                            onClick={() => { setView('dashboard'); setDashboardTab('professionals'); setIsMenuOpen(false); }} 
                            active={view === 'dashboard' && dashboardTab === 'professionals'}
                          />
                          <MenuLink 
                            icon={<BarChart3 className="h-5 w-5" />} 
                            label="Análises" 
                            onClick={() => { setView('dashboard'); setDashboardTab('analytics'); setIsMenuOpen(false); }} 
                            active={view === 'dashboard' && dashboardTab === 'analytics'}
                          />
                          <MenuLink 
                            icon={<Star className="h-5 w-5" />} 
                            label="Avaliações" 
                            onClick={() => { setView('dashboard'); setDashboardTab('reviews'); setIsMenuOpen(false); }} 
                            active={view === 'dashboard' && dashboardTab === 'reviews'}
                          />
                          <MenuLink 
                            icon={<Settings className="h-5 w-5" />} 
                            label="Configurações" 
                            onClick={() => { setView('dashboard'); setDashboardTab('settings'); setIsMenuOpen(false); }} 
                            active={view === 'dashboard' && dashboardTab === 'settings'}
                          />
                        </>
                      ) : (
                        <>
                          <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest px-4 mt-6 mb-2">Explorar</p>
                          <MenuLink 
                            icon={<MapPin className="h-5 w-5" />} 
                            label="Estabelecimentos" 
                            onClick={() => { setView('discovery'); setDiscoveryTab('salons'); setIsMenuOpen(false); }} 
                            active={view === 'discovery' && discoveryTab === 'salons'}
                          />
                          <MenuLink 
                            icon={<Scissors className="h-5 w-5" />} 
                            label="Serviços" 
                            onClick={() => { setView('discovery'); setDiscoveryTab('services'); setIsMenuOpen(false); }} 
                            active={view === 'discovery' && discoveryTab === 'services'}
                          />
                          <MenuLink 
                            icon={<Calendar className="h-5 w-5" />} 
                            label="Meus Agendamentos" 
                            onClick={() => { setView('client_appointments'); setIsMenuOpen(false); }} 
                            active={view === 'client_appointments'}
                          />
                        </>
                      )}
                      
                      <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest px-4 mt-6 mb-2">Conta</p>
                      <MenuLink 
                        icon={<User className="h-5 w-5" />} 
                        label="Meu Perfil" 
                        onClick={() => { setView('profile_settings'); setIsMenuOpen(false); }} 
                        active={view === 'profile_settings'}
                      />
                    </>
                  ) : (
                    <div className="pt-4">
                      <button 
                        onClick={() => { setView('home'); setIsMenuOpen(false); }}
                        className="w-full bg-brand-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-brand-primary/20"
                      >
                        Entrar / Criar Conta
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-stone-100 dark:border-stone-800">
                {session && (
                  <button 
                    onClick={() => { handleLogout(); setIsMenuOpen(false); }} 
                    className="flex items-center w-full p-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl font-bold transition-colors"
                  >
                    <LogOut className="h-5 w-5 mr-3" /> Sair
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
                  <h1 className="text-6xl sm:text-7xl serif leading-tight mb-6 dark:text-stone-100">
                    Beleza e Estilo, <br />
                    <span className="italic text-brand-primary">Agendados.</span>
                  </h1>
                  <p className="text-xl text-stone-600 dark:text-stone-400 mb-8 max-w-lg">
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
                  <div className="absolute -bottom-6 -left-6 bg-white dark:bg-stone-800 p-6 rounded-2xl shadow-xl max-w-xs hidden sm:block border border-stone-100 dark:border-stone-700">
                    <div className="flex items-center mb-2">
                      <div className="flex -space-x-2">
                        {[1,2,3].map(i => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-stone-800 bg-stone-200 dark:bg-stone-700 overflow-hidden">
                            <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                          </div>
                        ))}
                      </div>
                      <span className="ml-4 text-sm font-medium dark:text-stone-300">+500 agendamentos hoje</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {session && view === 'super_admin_dashboard' && (
            <motion.div 
              key="super_admin_dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SuperAdminDashboard profile={profile} theme={theme} />
            </motion.div>
          )}

          {session && view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Dashboard profile={profile} initialTab={dashboardTab} theme={theme} />
            </motion.div>
          )}

          {session && view === 'discovery' && (
            <motion.div 
              key="discovery"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <EstablishmentDiscovery 
                initialViewMode={discoveryTab}
                onSelectSalon={(id) => { setSelectedSalonId(id); setView('salon_detail'); }}
                onSelectService={(service) => { setSelectedService(service); setView('booking'); }}
              />
            </motion.div>
          )}

          {session && view === 'salon_detail' && (
            <motion.div 
              key="salon_detail"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <EstablishmentDetail 
                salonId={selectedSalonId!} 
                onBack={() => { setSelectedSalonId(null); setView('discovery'); }}
                onSelectService={(service) => { setSelectedService(service); setView('booking'); }}
              />
            </motion.div>
          )}

          {session && view === 'booking' && (
            <motion.div 
              key="booking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Booking 
                initialService={selectedService} 
                onSuccess={() => { setSelectedService(null); }}
                onBack={() => { 
                  setSelectedService(null); 
                  if (selectedSalonId) {
                    setView('salon_detail');
                  } else {
                    setView('discovery');
                  }
                }}
              />
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
                onBack={() => {
                  if (profile?.role === 'super_admin') setView('super_admin_dashboard');
                  else if (profile?.role === 'admin') setView('dashboard');
                  else setView('booking');
                }} 
              />
            </motion.div>
          )}

          {view === 'reset_password' && (
            <motion.div 
              key="reset_password"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12"
            >
              <ResetPassword onComplete={() => setView('home')} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-stone-100 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 py-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center items-center mb-6">
            <Scissors className="h-6 w-6 text-brand-primary mr-2" />
            <span className="text-xl serif font-bold tracking-tight text-stone-800 dark:text-stone-100">GlowSchedule</span>
          </div>
          <p className="text-stone-500 dark:text-stone-400 text-sm">© 2024 GlowSchedule. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

function MenuLink({ icon, label, onClick, active }: { icon: React.ReactNode, label: string, onClick: () => void, active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full px-4 py-3 rounded-2xl font-medium transition-all ${
        active 
          ? 'bg-brand-primary/10 text-brand-primary' 
          : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
      }`}
    >
      <span className={`mr-3 ${active ? 'text-brand-primary' : 'text-stone-400'}`}>{icon}</span>
      {label}
    </button>
  );
}
