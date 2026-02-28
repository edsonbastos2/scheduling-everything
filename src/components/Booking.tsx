import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Service, Salon } from '../types';
import { Calendar as CalendarIcon, Clock, Scissors, Check, ChevronRight, MapPin } from 'lucide-react';
import { format, addDays, startOfToday, setHours, setMinutes, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

interface BookingProps {
  initialService?: any;
  onSuccess?: () => void;
  onBack?: () => void;
}

export default function Booking({ initialService, onSuccess, onBack }: BookingProps) {
  const [step, setStep] = useState(initialService ? 2 : 1);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedService, setSelectedService] = useState<Service | null>(initialService || null);
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customTime, setCustomTime] = useState('');
  const [customDuration, setCustomDuration] = useState<number>(initialService?.duration || 0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!initialService) {
      fetchServices();
    }
  }, [initialService]);

  useEffect(() => {
    if (selectedService) {
      setCustomDuration(selectedService.duration);
    }
  }, [selectedService]);

  const fetchServices = async () => {
    const { data } = await supabase
      .from('services')
      .select('*, salons(name, address)')
      .eq('is_active', true);
    if (data) setServices(data as any);
  };

  const timeSlots = [
    '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  const handleBooking = async () => {
    const finalTime = customTime || selectedTime;
    if (!selectedService || !finalTime) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const [hours, minutes] = finalTime.split(':');
      const startTime = setMinutes(setHours(selectedDate, parseInt(hours)), parseInt(minutes));

      const { error } = await supabase.from('appointments').insert({
        client_id: user.id,
        service_id: selectedService.id,
        start_time: startTime.toISOString(),
        status: 'pending',
        salon_id: selectedService.salon_id || 'default',
        notes: customDuration !== selectedService.duration ? `Duração personalizada: ${customDuration} min` : ''
      });

      if (error) throw error;
      
      toast.success('Agendamento solicitado com sucesso!');
      setStep(4);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = selectedCategory === 'Todos' 
    ? services 
    : services.filter(s => s.category === selectedCategory);

  const categories = ['Todos', ...Array.from(new Set(services.map(s => s.category).filter(Boolean) as string[]))];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="text-center mb-12">
        <h1 className="text-4xl serif mb-4 text-stone-900 dark:text-stone-100">Novo Agendamento</h1>
        <div className="flex justify-center items-center space-x-4">
          <StepIndicator current={step} step={1} label="Serviço" />
          <ChevronRight className="h-4 w-4 text-stone-300 dark:text-stone-600" />
          <StepIndicator current={step} step={2} label="Data e Hora" />
          <ChevronRight className="h-4 w-4 text-stone-300 dark:text-stone-600" />
          <StepIndicator current={step} step={3} label="Confirmar" />
        </div>
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-[40px] shadow-xl shadow-stone-200/50 dark:shadow-stone-950/50 border border-stone-100 dark:border-stone-800 overflow-hidden transition-colors duration-300">
        {step === 1 && (
          <div className="p-8 sm:p-12">
            <h2 className="text-2xl serif mb-8 text-stone-900 dark:text-stone-100">Escolha o serviço desejado</h2>
            
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-8">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === cat 
                      ? 'bg-brand-primary text-white shadow-md' 
                      : 'bg-stone-50 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {filteredServices.map(service => (
                <button
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service);
                    setStep(2);
                  }}
                  className={`flex items-center justify-between p-6 rounded-3xl border-2 transition-all text-left group ${
                    selectedService?.id === service.id 
                      ? 'border-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10' 
                      : 'border-stone-100 dark:border-stone-800 hover:border-brand-primary/30'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0">
                      <img 
                        src={service.image_url || 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=80&w=200'} 
                        alt={service.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-stone-800 dark:text-stone-100">{service.name}</p>
                      <p className="text-xs text-brand-primary font-medium">{(service as any).salons?.name || 'Salão'}</p>
                      <p className="text-[10px] text-stone-400 dark:text-stone-500">{service.duration} min</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-brand-primary">R$ {service.price}</p>
                </button>
              ))}
            </div>

            <div className="flex justify-start">
              <button 
                onClick={onBack}
                className="text-stone-400 dark:text-stone-500 font-medium hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
              >
                Voltar para a busca
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-8 sm:p-12">
            <h2 className="text-2xl serif mb-8 text-stone-900 dark:text-stone-100">Quando você quer vir?</h2>
            
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <p className="text-sm font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-4">Escolha a data</p>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
                    const date = addDays(startOfToday(), i);
                    const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedDate(date)}
                        className={`p-3 rounded-2xl flex flex-col items-center transition-all ${
                          isSelected ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30' : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                        }`}
                      >
                        <span className="text-[10px] uppercase font-bold opacity-60">{format(date, 'EEE', { locale: ptBR })}</span>
                        <span className="text-lg font-bold">{format(date, 'dd')}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-4">Horários disponíveis</p>
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {timeSlots.map(time => (
                    <button
                      key={time}
                      onClick={() => {
                        setSelectedTime(time);
                        setCustomTime('');
                      }}
                      className={`py-3 rounded-xl text-sm font-bold transition-all ${
                        selectedTime === time && !customTime ? 'bg-brand-primary text-white' : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>

                <p className="text-sm font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-4">Ou escolha um horário personalizado</p>
                <input
                  type="time"
                  value={customTime}
                  onChange={(e) => {
                    setCustomTime(e.target.value);
                    setSelectedTime(null);
                  }}
                  className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all mb-6 dark:text-stone-100"
                />

                <p className="text-sm font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-4">Duração preferida (minutos)</p>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 45, 60, 90, 120].map(dur => (
                    <button
                      key={dur}
                      onClick={() => setCustomDuration(dur)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        customDuration === dur ? 'bg-brand-primary text-white' : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                      }`}
                    >
                      {dur}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-12 flex justify-between">
              <button 
                onClick={() => initialService ? onBack?.() : setStep(1)} 
                className="text-stone-400 dark:text-stone-500 font-medium hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
              >
                Voltar
              </button>
              <button 
                disabled={!selectedTime && !customTime}
                onClick={() => setStep(3)}
                className="bg-brand-primary text-white px-10 py-4 rounded-full font-bold shadow-lg shadow-brand-primary/20 disabled:opacity-50"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="p-8 sm:p-12">
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="h-10 w-10 text-brand-primary" />
              </div>
              <h2 className="text-3xl serif mb-2 text-stone-900 dark:text-stone-100">Revisão Final</h2>
              <p className="text-stone-500 dark:text-stone-400">Confirme se todos os dados estão corretos antes de finalizar.</p>
            </div>

            <div className="max-w-md mx-auto">
              <div className="bg-stone-50 dark:bg-stone-800/50 rounded-[32px] border border-stone-200 dark:border-stone-700 overflow-hidden shadow-sm mb-8">
                <div className="bg-brand-primary/5 dark:bg-brand-primary/10 p-6 border-b border-stone-200 dark:border-stone-700 flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-white dark:border-stone-800 shadow-sm">
                    <img 
                      src={selectedService?.image_url || 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=80&w=200'} 
                      alt={selectedService?.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-brand-primary uppercase tracking-widest mb-1">Serviço Selecionado</p>
                    <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100">{selectedService?.name}</h3>
                    <p className="text-sm text-stone-500 dark:text-stone-400">{(selectedService as any).salons?.name}</p>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-1">Data</p>
                      <div className="flex items-center text-stone-800 dark:text-stone-100 font-medium">
                        <CalendarIcon className="h-4 w-4 mr-2 text-stone-400 dark:text-stone-500" />
                        {format(selectedDate, "dd 'de' MMM", { locale: ptBR })}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-1">Horário</p>
                      <div className="flex items-center text-stone-800 dark:text-stone-100 font-medium">
                        <Clock className="h-4 w-4 mr-2 text-stone-400 dark:text-stone-500" />
                        {customTime || selectedTime}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-1">Duração</p>
                      <div className="text-stone-800 dark:text-stone-100 font-medium">
                        {customDuration} minutos
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-1">Valor</p>
                      <div className="text-xl font-bold text-brand-primary">
                        R$ {selectedService?.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-stone-100/50 dark:bg-stone-800/50 p-4 text-center border-t border-stone-200 dark:border-stone-700">
                  <p className="text-[10px] text-stone-400 dark:text-stone-500 italic">
                    O pagamento será realizado diretamente no estabelecimento.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  onClick={handleBooking}
                  disabled={loading}
                  className="w-full bg-brand-primary text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-brand-primary/20 hover:bg-opacity-95 transition-all disabled:opacity-50"
                >
                  {loading ? 'Processando...' : 'Finalizar Agendamento'}
                </button>
                <button 
                  onClick={() => setStep(2)} 
                  className="w-full py-4 text-stone-400 dark:text-stone-500 font-medium hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                >
                  Voltar e Editar
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="p-12 text-center">
            <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-8">
              <Check className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-4xl serif mb-4 text-stone-900 dark:text-stone-100">Agendado!</h2>
            <p className="text-stone-500 dark:text-stone-400 mb-12 max-w-md mx-auto">
              Seu agendamento foi enviado para o profissional. Você receberá uma notificação assim que for confirmado.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-stone-900 dark:bg-stone-800 text-white px-10 py-4 rounded-full font-bold hover:bg-stone-800 dark:hover:bg-stone-700 transition-colors"
            >
              Voltar ao Início
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StepIndicator({ current, step, label }: { current: number, step: number, label: string }) {
  const isActive = current === step;
  const isCompleted = current > step;

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
        isActive ? 'bg-brand-primary text-white scale-110' : 
        isCompleted ? 'bg-emerald-500 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500'
      }`}>
        {isCompleted ? <Check className="h-4 w-4" /> : step}
      </div>
      <span className={`text-sm font-medium ${isActive ? 'text-stone-800 dark:text-stone-100' : 'text-stone-400 dark:text-stone-500'}`}>{label}</span>
    </div>
  );
}
