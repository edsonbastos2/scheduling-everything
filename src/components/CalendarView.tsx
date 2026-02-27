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
    <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
      {/* Calendar Header */}
      <div className="p-6 border-b border-stone-50 flex items-center justify-between bg-stone-50/50">
        <h2 className="text-2xl serif capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <div className="flex space-x-2">
          <button 
            onClick={prevMonth}
            className="p-2 hover:bg-stone-200 rounded-full transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-stone-600" />
          </button>
          <button 
            onClick={() => setCurrentMonth(new Date())}
            className="px-4 py-2 text-sm font-medium text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-colors"
          >
            Hoje
          </button>
          <button 
            onClick={nextMonth}
            className="p-2 hover:bg-stone-200 rounded-full transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-stone-600" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 border-b border-stone-100">
        {dayNames.map(day => (
          <div key={day} className="py-3 text-center text-xs font-bold text-stone-400 uppercase tracking-widest">
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
              className={`min-h-[120px] p-2 border-r border-b border-stone-50 transition-all cursor-pointer group ${
                !isCurrentMonth ? 'bg-stone-50/30' : 'bg-white'
              } ${isSelected ? 'ring-2 ring-inset ring-brand-primary/20 bg-brand-primary/5' : 'hover:bg-stone-50'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                  isToday ? 'bg-brand-primary text-white' : 
                  isSelected ? 'text-brand-primary' :
                  !isCurrentMonth ? 'text-stone-300' : 'text-stone-600'
                }`}>
                  {format(day, 'd')}
                </span>
                {dayAppointments.length > 0 && (
                  <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded-md">
                    {dayAppointments.length}
                  </span>
                )}
              </div>

              <div className="space-y-1 overflow-hidden">
                {dayAppointments.slice(0, 3).map((apt, aIdx) => (
                  <div 
                    key={aIdx} 
                    className={`text-[10px] px-1.5 py-1 rounded-md truncate border ${
                      apt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      apt.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-100' :
                      'bg-amber-50 text-amber-700 border-amber-100'
                    }`}
                  >
                    <span className="font-bold">{format(parseISO(apt.start_time), 'HH:mm')}</span> {apt.profiles?.full_name || 'Cliente'}
                  </div>
                ))}
                {dayAppointments.length > 3 && (
                  <div className="text-[9px] text-stone-400 text-center font-medium">
                    + {dayAppointments.length - 3} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Day Details (Optional footer or sidebar) */}
      {selectedDate && (
        <div className="p-6 bg-stone-50 border-t border-stone-100">
          <h3 className="text-lg serif mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-brand-primary" />
            Agenda para {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {getAppointmentsForDay(selectedDate).length === 0 ? (
              <p className="text-stone-400 italic text-sm">Nenhum agendamento para este dia.</p>
            ) : (
              getAppointmentsForDay(selectedDate).map((apt, idx) => (
                <div key={idx} className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex justify-between items-center">
                  <div>
                    <p className="font-bold text-stone-800">{format(parseISO(apt.start_time), 'HH:mm')}</p>
                    <p className="text-sm text-stone-600">{apt.profiles?.full_name || 'Cliente'}</p>
                    <p className="text-xs text-stone-400">{apt.services?.name}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    apt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 
                    apt.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {apt.status === 'confirmed' ? 'Conf.' : apt.status === 'cancelled' ? 'Canc.' : 'Pend.'}
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
