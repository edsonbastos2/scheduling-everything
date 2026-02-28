import React, { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Appointment, Service } from '../types';
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';

interface AnalyticsViewProps {
  appointments: Appointment[];
  services: Service[];
  theme?: 'light' | 'dark';
}

const COLORS = ['#D4AF37', '#1c1917', '#78716c', '#a8a29e', '#d6d3d1'];

export default function AnalyticsView({ appointments, services, theme }: AnalyticsViewProps) {
  const isDarkMode = theme === 'dark';
  const chartGridColor = isDarkMode ? '#292524' : '#f5f5f4';
  const chartTextColor = isDarkMode ? '#a8a29e' : '#78716c';

  // 1. Appointments over the last 7 days
  const last7DaysData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date: format(date, 'dd/MM'),
        fullDate: date,
        count: 0
      };
    });

    appointments.forEach(apt => {
      const aptDate = new Date(apt.start_time);
      const dayMatch = days.find(d => 
        format(aptDate, 'dd/MM') === d.date
      );
      if (dayMatch) {
        dayMatch.count += 1;
      }
    });

    return days;
  }, [appointments]);

  // 2. Revenue by Service
  const revenueByServiceData = useMemo(() => {
    const serviceMap = new Map<string, number>();
    
    appointments.forEach(apt => {
      if (apt.status === 'cancelled') return;
      
      const service = services.find(s => s.id === apt.service_id);
      if (service) {
        const current = serviceMap.get(service.name) || 0;
        serviceMap.set(service.name, current + service.price);
      }
    });

    return Array.from(serviceMap.entries()).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value);
  }, [appointments, services]);

  // 3. Appointment Status Distribution
  const statusData = useMemo(() => {
    const statusMap = {
      pending: { name: 'Pendente', value: 0 },
      confirmed: { name: 'Confirmado', value: 0 },
      cancelled: { name: 'Cancelado', value: 0 },
      completed: { name: 'Concluído', value: 0 }
    };

    appointments.forEach(apt => {
      if (statusMap[apt.status]) {
        statusMap[apt.status].value += 1;
      }
    });

    return Object.values(statusMap).filter(s => s.value > 0);
  }, [appointments]);

  const totalRevenue = useMemo(() => {
    return appointments
      .filter(apt => apt.status !== 'cancelled')
      .reduce((acc, apt) => {
        const service = services.find(s => s.id === apt.service_id);
        return acc + (service?.price || 0);
      }, 0);
  }, [appointments, services]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 transition-colors duration-300">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard 
          icon={<TrendingUp className="text-emerald-500" />} 
          label="Crescimento" 
          value="+12%" 
          subValue="vs. última semana"
        />
        <MetricCard 
          icon={<DollarSign className="text-brand-primary" />} 
          label="Ticket Médio" 
          value={`R$ ${appointments.length > 0 ? (totalRevenue / appointments.length).toFixed(2) : '0'}`} 
          subValue="por atendimento"
        />
        <MetricCard 
          icon={<Users className="text-blue-500" />} 
          label="Novos Clientes" 
          value="24" 
          subValue="este mês"
        />
        <MetricCard 
          icon={<Calendar className="text-purple-500" />} 
          label="Taxa de Ocupação" 
          value="78%" 
          subValue="capacidade total"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Appointments Chart */}
        <div className="bg-white dark:bg-stone-900 p-8 rounded-[32px] border border-stone-100 dark:border-stone-800 shadow-sm">
          <h3 className="text-xl serif mb-6 text-stone-900 dark:text-stone-100">Agendamentos (Últimos 7 dias)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={last7DaysData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: chartTextColor, fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: chartTextColor, fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: isDarkMode ? '#1c1917' : '#fff',
                    color: isDarkMode ? '#fff' : '#1c1917'
                  }}
                  itemStyle={{ color: isDarkMode ? '#d4af37' : '#D4AF37' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#D4AF37" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#D4AF37', strokeWidth: 2, stroke: isDarkMode ? '#1c1917' : '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Service Chart */}
        <div className="bg-white dark:bg-stone-900 p-8 rounded-[32px] border border-stone-100 dark:border-stone-800 shadow-sm">
          <h3 className="text-xl serif mb-6 text-stone-900 dark:text-stone-100">Receita por Serviço</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByServiceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartGridColor} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: chartTextColor, fontSize: 12 }}
                  width={100}
                />
                <Tooltip 
                  formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: isDarkMode ? '#1c1917' : '#fff',
                    color: isDarkMode ? '#fff' : '#1c1917'
                  }}
                />
                <Bar dataKey="value" fill={isDarkMode ? '#D4AF37' : '#1c1917'} radius={[0, 8, 8, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white dark:bg-stone-900 p-8 rounded-[32px] border border-stone-100 dark:border-stone-800 shadow-sm">
          <h3 className="text-xl serif mb-6 text-stone-900 dark:text-stone-100">Status dos Agendamentos</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: isDarkMode ? '#1c1917' : '#fff',
                    color: isDarkMode ? '#fff' : '#1c1917'
                  }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary List */}
        <div className="bg-white dark:bg-stone-900 p-8 rounded-[32px] border border-stone-100 dark:border-stone-800 shadow-sm">
          <h3 className="text-xl serif mb-6 text-stone-900 dark:text-stone-100">Serviços Mais Rentáveis</h3>
          <div className="space-y-4">
            {revenueByServiceData.slice(0, 5).map((item, index) => (
              <div key={item.name} className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl">
                <div className="flex items-center">
                  <span className="w-8 h-8 flex items-center justify-center bg-white dark:bg-stone-900 rounded-full text-xs font-bold text-stone-400 dark:text-stone-500 mr-3 shadow-sm">
                    {index + 1}
                  </span>
                  <span className="font-medium text-stone-700 dark:text-stone-200">{item.name}</span>
                </div>
                <span className="font-bold text-brand-primary">R$ {item.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, subValue }: { icon: React.ReactNode, label: string, value: string, subValue: string }) {
  return (
    <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm transition-colors duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-stone-50 dark:bg-stone-800 rounded-xl">
          {icon}
        </div>
        <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-1">{value}</p>
      <p className="text-xs text-stone-500 dark:text-stone-400">{subValue}</p>
    </div>
  );
}
