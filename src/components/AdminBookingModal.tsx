import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Service, Profile } from '../types';
import { X, Calendar as CalendarIcon, Clock, User, Scissors, Search } from 'lucide-react';
import { format, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

interface AdminBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  profile: Profile | null;
  salonId?: string;
}

export default function AdminBookingModal({ isOpen, onClose, onSuccess, profile, salonId }: AdminBookingModalProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState('09:00');

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    if (!salonId) return;
    try {
      // Fetch Services for this salon
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('salon_id', salonId)
        .eq('is_active', true);
      if (servicesData) setServices(servicesData);

      // Fetch Clients
      const { data: clientsData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'client');
      if (clientsData) setClients(clientsData);
    } catch (error) {
      console.error('Error fetching data for admin booking:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !selectedServiceId || !date || !time) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (!salonId) {
      toast.error('Cadastre seu salão primeiro nas configurações');
      return;
    }

    setLoading(true);
    try {
      const [hours, minutes] = time.split(':');
      const startTime = setMinutes(setHours(new Date(date + 'T00:00:00'), parseInt(hours)), parseInt(minutes));

      const { error } = await supabase.from('appointments').insert({
        client_id: selectedClientId,
        service_id: selectedServiceId,
        start_time: startTime.toISOString(),
        status: 'confirmed', // Admins usually confirm immediately
        salon_id: salonId
      });

      if (error) throw error;

      toast.success('Agendamento realizado com sucesso!');
      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedClientId('');
    setSelectedServiceId('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setTime('09:00');
  };

  const filteredClients = clients.filter(c => 
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-colors duration-300">
      <div className="bg-white dark:bg-stone-900 rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-stone-100 dark:border-stone-800">
        <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-stone-50/50 dark:bg-stone-800/50">
          <h2 className="text-xl serif flex items-center text-stone-900 dark:text-stone-100">
            <CalendarIcon className="mr-2 h-5 w-5 text-brand-primary" />
            Novo Agendamento (Admin)
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-full transition-colors">
            <X className="h-5 w-5 text-stone-500 dark:text-stone-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Client Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-600 dark:text-stone-400 flex items-center">
              <User className="h-4 w-4 mr-2" /> Selecionar Cliente
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 dark:text-stone-500" />
              <input
                type="text"
                placeholder="Buscar cliente por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all dark:text-stone-100"
              />
            </div>
            <select
              required
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all dark:text-stone-100"
            >
              <option value="">Selecione um cliente da lista...</option>
              {filteredClients.map(client => (
                <option key={client.id} value={client.id} className="dark:bg-stone-900">
                  {client.full_name} ({client.email})
                </option>
              ))}
            </select>
          </div>

          {/* Service Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-600 dark:text-stone-400 flex items-center">
              <Scissors className="h-4 w-4 mr-2" /> Serviço
            </label>
            <select
              required
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all dark:text-stone-100"
            >
              <option value="">Selecione o serviço...</option>
              {services.map(service => (
                <option key={service.id} value={service.id} className="dark:bg-stone-900">
                  {service.name} - R$ {service.price.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-600 dark:text-stone-400 flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2" /> Data
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all dark:text-stone-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-600 dark:text-stone-400 flex items-center">
                <Clock className="h-4 w-4 mr-2" /> Horário
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all dark:text-stone-100"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-semibold rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-brand-primary text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-brand-primary/20 hover:bg-opacity-90 transition-all disabled:opacity-50"
            >
              {loading ? 'Agendando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
