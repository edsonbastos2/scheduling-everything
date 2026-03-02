import React, { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Appointment } from '../types';

interface CalendarViewProps {
  appointments: any[];
}

export default function CalendarView({ appointments }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter(apt => isSameDay(parseISO(apt.start_time), day));
  };

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800 overflow-hidden transition-colors duration-300">
      {/* Calendar Header */}
      <div className="p-4 sm:p-6 border-b border-stone-50 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-stone-50/50 dark:bg-stone-800/50">
        <h2 className="text-xl sm:text-2xl serif capitalize text-stone-900 dark:text-stone-100">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
          <button 
            onClick={prevMonth}
            className="p-2 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-full transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-stone-600 dark:text-stone-400" />
          </button>
          <button 
            onClick={() => setCurrentMonth(new Date())}
            className="px-4 py-2 text-sm font-medium text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-colors"
          >
            Hoje
          </button>
          <button 
            onClick={nextMonth}
            className="p-2 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-full transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-stone-600 dark:text-stone-400" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="min-w-[600px] sm:min-w-0">
          <div className="grid grid-cols-7 border-b border-stone-100 dark:border-stone-800">
            {dayNames.map(day => (
              <div key={day} className="py-3 text-center text-[10px] sm:text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const dayAppointments = getAppointmentsForDay(day);
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isToday = isSameDay(day, new Date());

              return (
                <div 
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={`min-h-[80px] sm:min-h-[120px] p-1 sm:p-2 border-r border-b border-stone-50 dark:border-stone-800 transition-all cursor-pointer group ${
                    !isCurrentMonth ? 'bg-stone-50/30 dark:bg-stone-800/30' : 'bg-white dark:bg-stone-900'
                  } ${isSelected ? 'ring-2 ring-inset ring-brand-primary/20 bg-brand-primary/5 dark:bg-brand-primary/10' : 'hover:bg-stone-50 dark:hover:bg-stone-800'}`}
                >
                  <div className="flex justify-between items-start mb-1 sm:mb-2">
                    <span className={`text-xs sm:text-sm font-medium w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full transition-colors ${
                      isToday ? 'bg-brand-primary text-white' : 
                      isSelected ? 'text-brand-primary' :
                      !isCurrentMonth ? 'text-stone-300 dark:text-stone-600' : 'text-stone-600 dark:text-stone-300'
                    }`}>
                      {format(day, 'd')}
                    </span>
                    {dayAppointments.length > 0 && (
                      <span className="text-[8px] sm:text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-1 sm:px-1.5 py-0.5 rounded-md">
                        {dayAppointments.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 overflow-hidden">
                    {dayAppointments.slice(0, 2).map((apt, aIdx) => (
                      <div 
                        key={aIdx} 
                        className={`text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 sm:py-1 rounded-md truncate border ${
                          apt.status === 'confirmed' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' :
                          apt.status === 'cancelled' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800' :
                          apt.status === 'completed' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-800' :
                          'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800'
                        }`}
                      >
                        <span className="font-bold hidden sm:inline">{format(parseISO(apt.start_time), 'HH:mm')}</span> {apt.profiles?.full_name || 'Cliente'}
                      </div>
                    ))}
                    {dayAppointments.length > 2 && (
                      <div className="text-[7px] sm:text-[9px] text-stone-400 dark:text-stone-500 text-center font-medium">
                        + {dayAppointments.length - 2}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day Details (Optional footer or sidebar) */}
      {selectedDate && (
        <div className="p-6 bg-stone-50 dark:bg-stone-800 border-t border-stone-100 dark:border-stone-700">
          <h3 className="text-lg serif mb-4 flex items-center text-stone-900 dark:text-stone-100">
            <Clock className="h-5 w-5 mr-2 text-brand-primary" />
            Agenda para {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {getAppointmentsForDay(selectedDate).length === 0 ? (
              <p className="text-stone-400 dark:text-stone-500 italic text-sm">Nenhum agendamento para este dia.</p>
            ) : (
              getAppointmentsForDay(selectedDate).map((apt, idx) => (
                <div key={idx} className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-sm flex justify-between items-center">
                  <div>
                    <p className="font-bold text-stone-800 dark:text-stone-100">{format(parseISO(apt.start_time), 'HH:mm')}</p>
                    <p className="text-sm text-stone-600 dark:text-stone-300">{apt.profiles?.full_name || 'Cliente'}</p>
                    <p className="text-xs text-stone-400 dark:text-stone-500">
                      {apt.services?.name} {apt.professionals?.name ? `• ${apt.professionals.name}` : ''}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    apt.status === 'confirmed' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 
                    apt.status === 'cancelled' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' : 
                    apt.status === 'completed' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
                  }`}>
                    {apt.status === 'confirmed' ? 'Conf.' : 
                     apt.status === 'cancelled' ? 'Canc.' : 
                     apt.status === 'completed' ? 'Concl.' : 'Pend.'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
