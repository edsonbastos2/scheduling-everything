import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Appointment, Profile } from '../types';
import { Calendar, Clock, Scissors, CheckCircle, XCircle, AlertCircle, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

interface ClientAppointmentsProps {
  profile: Profile | null;
}

export default function ClientAppointments({ profile }: ClientAppointmentsProps) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchAppointments();
    }
  }, [profile]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, services(name, price, duration)')
        .eq('client_id', profile?.id)
        .order('start_time', { ascending: false });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching client appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    const toastId = toast.loading('Cancelando agendamento...');
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .eq('client_id', profile?.id);

      if (error) throw error;

      toast.success('Agendamento cancelado com sucesso', { id: toastId });
      setCancellingId(null);
      await fetchAppointments();
    } catch (error: any) {
      console.error('Error cancelling:', error);
      toast.error(error.message || 'Erro ao cancelar agendamento', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="p-12 text-center">Carregando seus agendamentos...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-12">
        <h1 className="text-4xl serif mb-2">Meus Agendamentos</h1>
        <p className="text-stone-500">Acompanhe o status dos seus pedidos de reserva.</p>
      </header>

      <div className="space-y-6">
        {appointments.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-stone-200">
            <Calendar className="h-12 w-12 text-stone-200 mx-auto mb-4" />
            <p className="text-stone-400 italic">Você ainda não realizou nenhum agendamento.</p>
          </div>
        ) : (
          appointments.map((apt) => (
            <div key={apt.id} className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all">
              <div className="flex items-center space-x-6">
                <div className="p-4 bg-stone-50 rounded-2xl">
                  <Scissors className="h-6 w-6 text-brand-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-stone-800">{apt.services?.name}</h3>
                  <div className="flex flex-wrap gap-4 mt-1">
                    <div className="flex items-center text-sm text-stone-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      {format(parseISO(apt.start_time), "dd 'de' MMMM", { locale: ptBR })}
                    </div>
                    <div className="flex items-center text-sm text-stone-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {format(parseISO(apt.start_time), "HH:mm")} ({apt.services?.duration} min)
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end md:space-x-8 border-t md:border-t-0 pt-4 md:pt-0">
                {(apt.status === 'pending' || apt.status === 'confirmed') && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCancellingId(apt.id);
                    }}
                    className="flex items-center text-xs font-bold text-red-500 hover:text-red-700 transition-colors uppercase tracking-wider"
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Cancelar
                  </button>
                )}
                
                <div className="text-right">
                  <p className="text-xs text-stone-400 uppercase font-bold tracking-wider">Valor</p>
                  <p className="text-lg font-bold text-brand-primary">R$ {apt.services?.price.toFixed(2)}</p>
                </div>
                
                <div className={`flex items-center px-4 py-2 rounded-full text-sm font-bold ${
                  apt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 
                  apt.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {apt.status === 'confirmed' ? (
                    <><CheckCircle className="h-4 w-4 mr-2" /> Confirmado</>
                  ) : apt.status === 'cancelled' ? (
                    <><XCircle className="h-4 w-4 mr-2" /> Cancelado</>
                  ) : (
                    <><AlertCircle className="h-4 w-4 mr-2" /> Pendente</>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <AnimatePresence>
        {cancellingId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden p-8 text-center"
            >
              <div className="bg-red-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              
              <h3 className="text-2xl serif text-stone-800 mb-2">Cancelar Agendamento?</h3>
              <p className="text-stone-500 mb-8">
                Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  disabled={isProcessing}
                  onClick={() => setCancellingId(null)}
                  className="flex-1 px-6 py-3 bg-stone-100 text-stone-600 rounded-xl font-bold hover:bg-stone-200 transition-all disabled:opacity-50"
                >
                  Não, manter
                </button>
                <button
                  disabled={isProcessing}
                  onClick={() => handleCancel(cancellingId)}
                  className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
                >
                  {isProcessing ? 'Cancelando...' : 'Sim, cancelar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
