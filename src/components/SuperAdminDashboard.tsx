import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Salon, Appointment, Profile } from '../types';
import { 
  Users, 
  Store, 
  Calendar, 
  DollarSign, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  ChevronRight, 
  BarChart3,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Mail
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, subDays, isAfter, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface SuperAdminDashboardProps {
  profile: Profile | null;
  theme?: 'light' | 'dark';
}

export default function SuperAdminDashboard({ profile, theme }: SuperAdminDashboardProps) {
  const isDarkMode = theme === 'dark';
  const chartGridColor = isDarkMode ? '#292524' : '#f0f0f0';
  const chartTextColor = isDarkMode ? '#a8a29e' : '#78716c';

  const [salons, setSalons] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeTenants: 0,
    totalRevenue: 0,
    totalAppointments: 0,
    revenueGrowth: 0,
    appointmentGrowth: 0,
    newTenantsLast7Days: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSalon, setSelectedSalon] = useState<any | null>(null);
  const [salonStats, setSalonStats] = useState<any>(null);

  useEffect(() => {
    fetchGlobalData();
  }, []);

  const fetchGlobalData = async () => {
    setLoading(true);
    try {
      // Fetch all salons
      const { data: salonsData, error: salonsError } = await supabase
        .from('salons')
        .select('*, profiles(full_name, email)')
        .order('created_at', { ascending: false });

      if (salonsError) throw salonsError;

      // Fetch all completed appointments for revenue calculation
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*, services(price)')
        .eq('status', 'completed');

      if (appointmentsError) throw appointmentsError;

      const totalRevenue = appointmentsData?.reduce((acc, curr) => acc + (curr.services?.price || 0), 0) || 0;
      const activeTenants = salonsData?.filter(s => s.is_active).length || 0;

      // Calculate new tenants in last 7 days
      const sevenDaysAgo = subDays(new Date(), 7);
      const newTenantsLast7Days = salonsData?.filter(s => isAfter(parseISO(s.created_at), sevenDaysAgo)).length || 0;

      // Calculate monthly data for the last 6 months
      const last6Months = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        const start = startOfMonth(monthDate);
        const end = endOfMonth(monthDate);
        
        const monthAppointments = appointmentsData?.filter(appt => {
          const date = parseISO(appt.start_time);
          return isAfter(date, start) && isAfter(end, date);
        }) || [];

        const monthRevenue = monthAppointments.reduce((acc, curr) => acc + (curr.services?.price || 0), 0);
        
        last6Months.push({
          name: format(monthDate, 'MMM', { locale: ptBR }),
          revenue: monthRevenue,
          appointments: monthAppointments.length
        });
      }

      setChartData(last6Months);

      // Calculate growth (current month vs previous month)
      const currentMonth = last6Months[5];
      const prevMonth = last6Months[4];
      
      const revenueGrowth = prevMonth.revenue > 0 
        ? ((currentMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100 
        : currentMonth.revenue > 0 ? 100 : 0;
        
      const appointmentGrowth = prevMonth.appointments > 0 
        ? ((currentMonth.appointments - prevMonth.appointments) / prevMonth.appointments) * 100 
        : currentMonth.appointments > 0 ? 100 : 0;

      setSalons(salonsData || []);
      setStats({
        totalTenants: salonsData?.length || 0,
        activeTenants,
        totalRevenue,
        totalAppointments: appointmentsData?.length || 0,
        revenueGrowth: parseFloat(revenueGrowth.toFixed(1)),
        appointmentGrowth: parseFloat(appointmentGrowth.toFixed(1)),
        newTenantsLast7Days
      });
    } catch (error: any) {
      toast.error('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSalonStatus = async (salonId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('salons')
        .update({ is_active: !currentStatus })
        .eq('id', salonId);

      if (error) throw error;

      toast.success(`Estabelecimento ${!currentStatus ? 'ativado' : 'desativado'} com sucesso`);
      fetchGlobalData();
      if (selectedSalon?.id === salonId) {
        setSelectedSalon({ ...selectedSalon, is_active: !currentStatus });
      }
    } catch (error: any) {
      toast.error('Erro ao alterar status: ' + error.message);
    }
  };

  const fetchSalonDetails = async (salon: any) => {
    setSelectedSalon(salon);
    try {
      const { data: appts } = await supabase
        .from('appointments')
        .select('*, services(price, name), profiles(full_name)')
        .eq('salon_id', salon.id)
        .order('start_time', { ascending: false });

      const revenue = appts?.filter(a => a.status === 'completed')
        .reduce((acc, curr) => acc + (curr.services?.price || 0), 0) || 0;

      setSalonStats({
        appointments: appts || [],
        revenue
      });
    } catch (error) {
      console.error(error);
    }
  };

  const filteredSalons = salons.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.profiles?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-12 text-center">Carregando painel administrativo...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 transition-colors duration-300">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl serif text-stone-900 dark:text-stone-100">Painel do Administrador SaaS</h1>
          <p className="text-stone-500 dark:text-stone-400">Gerencie seus tenants e acompanhe o crescimento da plataforma.</p>
        </div>
        <div className="flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-full text-sm font-bold">
          <Activity className="h-4 w-4" />
          Sistema Operacional
        </div>
      </header>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total de Tenants" 
          value={stats.totalTenants} 
          icon={<Store className="h-6 w-6" />} 
          trend={stats.totalTenants > 0 ? "+2 este mês" : "0"}
          color="stone"
        />
        <StatCard 
          title="Tenants Ativos" 
          value={stats.activeTenants} 
          icon={<CheckCircle className="h-6 w-6" />} 
          trend={`${((stats.activeTenants / stats.totalTenants) * 100).toFixed(1)}% do total`}
          color="emerald"
        />
        <StatCard 
          title="Receita Global" 
          value={`R$ ${stats.totalRevenue.toLocaleString()}`} 
          icon={<DollarSign className="h-6 w-6" />} 
          trend={`+${stats.revenueGrowth}%`}
          isPositive={true}
          color="brand"
        />
        <StatCard 
          title="Agendamentos" 
          value={stats.totalAppointments} 
          icon={<Calendar className="h-6 w-6" />} 
          trend={`+${stats.appointmentGrowth}%`}
          isPositive={true}
          color="amber"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Tenants List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-stone-900 rounded-[32px] border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden transition-colors duration-300">
            <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 flex items-center">
                <Users className="h-5 w-5 mr-2 text-brand-primary" /> Gerenciar Tenants
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input 
                  type="text" 
                  placeholder="Buscar salão ou proprietário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 dark:text-stone-200"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50/50 dark:bg-stone-800/50">
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">Estabelecimento</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">Proprietário</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {filteredSalons.map((salon) => (
                    <tr 
                      key={salon.id} 
                      className={`hover:bg-stone-50/50 dark:hover:bg-stone-800/50 transition-colors cursor-pointer ${selectedSalon?.id === salon.id ? 'bg-brand-primary/5 dark:bg-brand-primary/10' : ''}`}
                      onClick={() => fetchSalonDetails(salon)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-stone-800 overflow-hidden">
                            <img src={salon.image_url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=100'} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-bold text-stone-800 dark:text-stone-200">{salon.name}</p>
                            <p className="text-xs text-stone-400 dark:text-stone-500">{salon.address?.split(',')[0]}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-stone-700 dark:text-stone-300">{salon.profiles?.full_name}</p>
                        <p className="text-xs text-stone-400 dark:text-stone-500">{salon.profiles?.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          salon.is_active ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                          {salon.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSalonStatus(salon.id, salon.is_active);
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            salon.is_active ? 'text-red-500 hover:bg-red-50' : 'text-emerald-500 hover:bg-emerald-50'
                          }`}
                          title={salon.is_active ? 'Desativar' : 'Ativar'}
                        >
                          {salon.is_active ? <XCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="bg-white dark:bg-stone-900 rounded-[32px] border border-stone-200 dark:border-stone-800 shadow-sm p-8 transition-colors duration-300">
            <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-8 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-brand-primary" /> Crescimento da Plataforma
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} className="dark:opacity-10" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: chartTextColor}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: chartTextColor}} />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', 
                      backgroundColor: isDarkMode ? '#1c1917' : '#fff', 
                      color: isDarkMode ? '#fff' : '#1c1917' 
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Details Sidebar */}
        <div className="space-y-6">
          <div className="bg-stone-900 text-white rounded-[32px] p-8 shadow-xl">
            {selectedSalon ? (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl serif">Detalhes do Tenant</h3>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    selectedSalon.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {selectedSalon.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/10 mx-auto">
                    <img src={selectedSalon.image_url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=200'} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold">{selectedSalon.name}</p>
                    <p className="text-sm text-stone-400">{selectedSalon.profiles?.full_name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Receita</p>
                    <p className="text-lg font-bold text-brand-primary">R$ {salonStats?.revenue.toLocaleString() || 0}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Agendamentos</p>
                    <p className="text-lg font-bold">{salonStats?.appointments.length || 0}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">Últimos Agendamentos</p>
                  <div className="space-y-3">
                    {salonStats?.appointments.slice(0, 3).map((appt: any) => (
                      <div key={appt.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 text-xs">
                        <div>
                          <p className="font-bold">{appt.profiles?.full_name}</p>
                          <p className="text-stone-500">{appt.services?.name}</p>
                        </div>
                        <span className="text-stone-400">{format(new Date(appt.start_time), 'dd/MM')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => {
                    const email = selectedSalon.profiles?.email;
                    if (email) {
                      window.location.href = `mailto:${email}?subject=Contato GlowSchedule Admin&body=Olá ${selectedSalon.profiles?.full_name},`;
                    }
                  }}
                  className="w-full py-4 rounded-2xl font-bold bg-white/10 text-white hover:bg-white/20 transition-all flex items-center justify-center space-x-2"
                >
                  <Mail className="h-5 w-5" />
                  <span>Enviar E-mail</span>
                </button>

                <button 
                  onClick={() => toggleSalonStatus(selectedSalon.id, selectedSalon.is_active)}
                  className={`w-full py-4 rounded-2xl font-bold transition-all ${
                    selectedSalon.is_active ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                  }`}
                >
                  {selectedSalon.is_active ? 'Desativar Tenant' : 'Ativar Tenant'}
                </button>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <Activity className="h-12 w-12 text-stone-700 mb-4" />
                <p className="text-stone-400">Selecione um tenant para ver detalhes e estatísticas.</p>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-[32px] border border-stone-200 dark:border-stone-800 p-8 shadow-sm transition-colors duration-300">
            <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-6 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-emerald-500" /> Insights SaaS
            </h3>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
                  <ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-stone-800 dark:text-stone-200">Crescimento de Receita</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {stats.revenueGrowth >= 0 
                      ? `A receita global cresceu ${stats.revenueGrowth}% em relação ao mês passado.`
                      : `A receita global diminuiu ${Math.abs(stats.revenueGrowth)}% em relação ao mês passado.`}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 rounded-lg bg-brand-primary/10 dark:bg-brand-primary/20 flex items-center justify-center flex-shrink-0">
                  <Store className="h-4 w-4 text-brand-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-stone-800 dark:text-stone-200">Novos Tenants</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {stats.newTenantsLast7Days} {stats.newTenantsLast7Days === 1 ? 'novo salão se cadastrou' : 'novos salões se cadastraram'} nos últimos 7 dias.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, isPositive, color }: any) {
  const colors: any = {
    stone: 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    brand: 'bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
  };

  return (
    <div className="bg-white dark:bg-stone-900 p-6 rounded-[32px] border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl transition-colors ${colors[color]}`}>
          {icon}
        </div>
        <div className={`flex items-center text-xs font-bold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : isPositive === false ? 'text-red-600 dark:text-red-400' : 'text-stone-400 dark:text-stone-500'}`}>
          {isPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : isPositive === false ? <ArrowDownRight className="h-3 w-3 mr-1" /> : null}
          {trend}
        </div>
      </div>
      <p className="text-sm font-medium text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-1">{title}</p>
      <p className="text-3xl font-bold text-stone-900 dark:text-stone-100">{value}</p>
    </div>
  );
}
