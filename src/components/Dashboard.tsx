import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Profile, Service, Appointment, Salon } from '../types';
import { Plus, Calendar as CalendarIcon, Users, Scissors, DollarSign, Clock, CheckCircle, XCircle, Settings, LayoutDashboard, ListChecks, CalendarDays, List, UserPlus, BarChart3, Star } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import SalonSettings from './SalonSettings';
import ServiceManagement from './ServiceManagement';
import CalendarView from './CalendarView';
import AdminBookingModal from './AdminBookingModal';
import AnalyticsView from './AnalyticsView';
import ReviewsView from './ReviewsView';
import ProfessionalManagement from './ProfessionalManagement';

interface DashboardProps {
  profile: Profile | null;
  initialTab?: 'overview' | 'services' | 'settings' | 'analytics' | 'professionals';
  theme?: 'light' | 'dark';
}

export default function Dashboard({ profile, initialTab = 'overview', theme }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'settings' | 'analytics' | 'reviews' | 'professionals'>(initialTab as any);

  useEffect(() => {
    setActiveTab(initialTab as any);
  }, [initialTab]);
  const [displayMode, setDisplayMode] = useState<'list' | 'calendar'>('calendar');
  const [showAdminBooking, setShowAdminBooking] = useState(false);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddService, setShowAddService] = useState(false);
  const [revenueFilter, setRevenueFilter] = useState<'day' | 'month' | 'year'>('day');

  // New Service Form
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('30');

  useEffect(() => {
    if (profile) {
      fetchData();
    }
  }, [profile]);

  useEffect(() => {
    if (!salon) return;

    // Subscribe to real-time changes for appointments
    const channel = supabase
      .channel(`salon-${salon.id}-appointments`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments',
          filter: `salon_id=eq.${salon.id}`
        },
        (payload) => {
          const newApt = payload.new as any;
          if (newApt.status === 'pending') {
            toast('Novo agendamento pendente!', {
              icon: '🔔',
              duration: 6000,
              style: {
                borderRadius: '16px',
                background: '#1c1917',
                color: '#fff',
              },
            });
            fetchData();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments',
          filter: `salon_id=eq.${salon.id}`
        },
        (payload) => {
          const oldApt = payload.old as any;
          const newApt = payload.new as any;
          
          // If status changed to cancelled
          if (newApt.status === 'cancelled' && oldApt?.status !== 'cancelled') {
            toast('Um agendamento foi cancelado pelo cliente.', {
              icon: '⚠️',
              duration: 6000,
              style: {
                borderRadius: '16px',
                background: '#ef4444',
                color: '#fff',
              },
            });
            fetchData();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [salon?.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Salon
      const { data: salonData } = await supabase
        .from('salons')
        .select('*')
        .eq('owner_id', profile?.id)
        .single();
      
      if (salonData) {
        setSalon(salonData);
        
        // Fetch Services for this salon
        const { data: servicesData } = await supabase
          .from('services')
          .select('*')
          .eq('salon_id', salonData.id);
        
        if (servicesData) setServices(servicesData);

        // Fetch Appointments for this salon
        const { data: appointmentsData } = await supabase
          .from('appointments')
          .select('*, profiles(full_name), services(name, price), professionals(name)')
          .eq('salon_id', salonData.id)
          .order('start_time', { ascending: true });

        if (appointmentsData) setAppointments(appointmentsData as any);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salon) {
      toast.error('Cadastre seu salão primeiro nas configurações');
      return;
    }
    try {
      const { error } = await supabase.from('services').insert({
        name: newServiceName,
        price: parseFloat(newServicePrice),
        duration: parseInt(newServiceDuration),
        salon_id: salon.id
      });

      if (error) throw error;
      toast.success('Serviço adicionado!');
      setShowAddService(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      toast.success('Status atualizado!');
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const calculateRevenue = () => {
    const now = new Date();
    return appointments
      .filter(apt => {
        if (apt.status !== 'completed') return false;
        const aptDate = new Date(apt.start_time);
        
        if (revenueFilter === 'day') {
          return format(aptDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
        } else if (revenueFilter === 'month') {
          return format(aptDate, 'yyyy-MM') === format(now, 'yyyy-MM');
        } else {
          return format(aptDate, 'yyyy') === format(now, 'yyyy');
        }
      })
      .reduce((acc, curr: any) => acc + (curr.services?.price || 0), 0);
  };

  if (loading) return <div className="p-12 text-center">Carregando painel...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 transition-colors duration-300">
      {!salon && !loading && (
        <div className="mb-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-xl mr-4">
              <Settings className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-amber-900 dark:text-amber-100 font-bold">Configure seu Salão</h3>
              <p className="text-amber-700 dark:text-amber-300 text-sm">Você precisa configurar as informações do seu salão antes de cadastrar serviços ou agendamentos.</p>
            </div>
          </div>
          <button 
            onClick={() => setActiveTab('settings')}
            className="bg-amber-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-amber-700 transition-all"
          >
            Ir para Configurações
          </button>
        </div>
      )}

      <header className="mb-8 sm:mb-12">
        <div>
          <h1 className="text-2xl sm:text-4xl serif mb-2 text-stone-900 dark:text-stone-100">Olá, {profile?.full_name || 'Profissional'}</h1>
          <p className="text-stone-500 dark:text-stone-400 text-xs sm:text-base">Aqui está o que está acontecendo no seu salão hoje.</p>
        </div>
      </header>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <StatCard icon={<CalendarIcon className="text-blue-500" />} label="Agendamentos" value={appointments.length.toString()} />
            <StatCard icon={<Scissors className="text-brand-primary" />} label="Serviços Ativos" value={services.length.toString()} />
            <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800 flex items-center justify-between transition-colors duration-300">
              <div className="flex items-center space-x-4">
                <div className="p-3 sm:p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl shrink-0">
                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-medium truncate">Receita {revenueFilter === 'day' ? 'do Dia' : revenueFilter === 'month' ? 'do Mês' : 'do Ano'}</p>
                  <p className="text-xl sm:text-2xl font-bold text-stone-800 dark:text-stone-100 truncate">R$ {calculateRevenue().toFixed(2)}</p>
                </div>
              </div>
              <select 
                value={revenueFilter} 
                onChange={(e) => setRevenueFilter(e.target.value as any)}
                className="text-[10px] sm:text-xs bg-stone-50 dark:bg-stone-800 border-none rounded-lg focus:ring-0 cursor-pointer text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider"
              >
                <option value="day">Dia</option>
                <option value="month">Mês</option>
                <option value="year">Ano</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-xl sm:text-2xl serif flex items-center text-stone-900 dark:text-stone-100">
              <CalendarIcon className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-stone-400 dark:text-stone-500" />
              Agenda de Atendimentos
            </h2>
            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
              <button
                onClick={() => setShowAdminBooking(true)}
                className="flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-brand-primary text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-brand-primary/20 hover:bg-opacity-90 transition-all whitespace-nowrap"
              >
                <UserPlus className="h-4 w-4 mr-2" /> Novo Agendamento
              </button>
              <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-xl border border-stone-200 dark:border-stone-700 shrink-0">
                <button 
                  onClick={() => setDisplayMode('calendar')}
                  className={`p-1.5 sm:p-2 rounded-lg transition-all ${displayMode === 'calendar' ? 'bg-white dark:bg-stone-700 shadow-sm text-brand-primary' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-200'}`}
                  title="Visualização em Calendário"
                >
                  <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
                <button 
                  onClick={() => setDisplayMode('list')}
                  className={`p-1.5 sm:p-2 rounded-lg transition-all ${displayMode === 'list' ? 'bg-white dark:bg-stone-700 shadow-sm text-brand-primary' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-200'}`}
                  title="Visualização em Lista"
                >
                  <List className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </div>
          </div>

          {displayMode === 'calendar' ? (
            <CalendarView appointments={appointments} />
          ) : (
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white dark:bg-stone-900 rounded-3xl p-8 shadow-sm border border-stone-100 dark:border-stone-800 transition-colors duration-300">
                <div className="space-y-4">
                  {appointments.length === 0 ? (
                    <p className="text-stone-400 dark:text-stone-500 text-center py-8 italic">Nenhum agendamento encontrado.</p>
                  ) : (
                    appointments.map((apt: any) => (
                      <div key={apt.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-800 hover:border-brand-primary/30 transition-all gap-4">
                        <div className="flex items-center space-x-4">
                          <div className="bg-white dark:bg-stone-800 p-3 rounded-xl shadow-sm shrink-0">
                            <CalendarIcon className="h-5 w-5 text-brand-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-stone-800 dark:text-stone-100 truncate">{apt.profiles?.full_name || 'Cliente'}</p>
                            <p className="text-sm text-stone-500 dark:text-stone-400 truncate">{apt.services?.name} • {format(new Date(apt.start_time), "dd 'de' MMM, HH:mm", { locale: ptBR })}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end space-x-2">
                          <div className="flex space-x-1">
                            {apt.status === 'pending' && (
                              <>
                                <button onClick={() => updateAppointmentStatus(apt.id, 'confirmed')} className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors" title="Confirmar">
                                  <CheckCircle className="h-5 w-5" />
                                </button>
                                <button onClick={() => updateAppointmentStatus(apt.id, 'cancelled')} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Cancelar">
                                  <XCircle className="h-5 w-5" />
                                </button>
                              </>
                            )}
                            {apt.status === 'confirmed' && (
                              <button onClick={() => updateAppointmentStatus(apt.id, 'completed')} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Concluir Atendimento">
                                <CheckCircle className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap ${
                            apt.status === 'confirmed' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 
                            apt.status === 'cancelled' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 
                            apt.status === 'completed' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                          }`}>
                            {apt.status === 'confirmed' ? 'Confirmado' : 
                             apt.status === 'cancelled' ? 'Cancelado' : 
                             apt.status === 'completed' ? 'Concluído' : 'Pendente'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'services' && <ServiceManagement profile={profile} salonId={salon?.id} />}
      {activeTab === 'analytics' && <AnalyticsView appointments={appointments} services={services} theme={theme} />}
      {activeTab === 'reviews' && <ReviewsView salonId={salon?.id} />}
      {activeTab === 'professionals' && <ProfessionalManagement profile={profile} salonId={salon?.id} />}
      {activeTab === 'settings' && <SalonSettings profile={profile} />}

      <AdminBookingModal 
        isOpen={showAdminBooking}
        onClose={() => setShowAdminBooking(false)}
        onSuccess={fetchData}
        profile={profile}
        salonId={salon?.id}
      />
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="bg-white dark:bg-stone-900 p-4 sm:p-6 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800 flex items-center space-x-4 transition-colors duration-300">
      <div className="p-3 sm:p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl shrink-0">
        {React.cloneElement(icon as React.ReactElement, { className: 'h-5 w-5 sm:h-6 sm:w-6' })}
      </div>
      <div className="min-w-0">
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-medium truncate">{label}</p>
        <p className="text-xl sm:text-2xl font-bold text-stone-800 dark:text-stone-100 truncate">{value}</p>
      </div>
    </div>
  );
}
