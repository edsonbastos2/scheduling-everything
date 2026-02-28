import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Appointment, Profile } from '../types';
import { Calendar, Clock, Scissors, CheckCircle, XCircle, AlertCircle, Trash2, X, Star } from 'lucide-react';
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
  const [reviewingApt, setReviewingApt] = useState<any | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (profile) {
      fetchAppointments();

      // Subscribe to real-time changes for this client's appointments
      const channel = supabase
        .channel(`client-${profile.id}-appointments`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'appointments',
            filter: `client_id=eq.${profile.id}`
          },
          (payload) => {
            const newApt = payload.new as any;
            const oldApt = payload.old as any;

            if (newApt.status !== oldApt.status) {
              const statusMap: Record<string, string> = {
                confirmed: 'confirmado',
                cancelled: 'cancelado',
                completed: 'concluído'
              };
              
              toast(`Seu agendamento foi ${statusMap[newApt.status] || newApt.status}!`, {
                icon: '🔔',
                style: {
                  borderRadius: '16px',
                  background: '#1c1917',
                  color: '#fff',
                },
              });
              fetchAppointments();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
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

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingApt) return;

    const toastId = toast.loading('Enviando avaliação...');
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          salon_id: reviewingApt.salon_id,
          client_id: profile?.id,
          rating,
          comment
        });

      if (error) throw error;

      toast.success('Avaliação enviada com sucesso!', { id: toastId });
      setReviewingApt(null);
      setComment('');
      setRating(5);
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error('Erro ao enviar avaliação', { id: toastId });
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
    <div className="max-w-4xl mx-auto px-4 py-8 transition-colors duration-300">
      <header className="mb-12">
        <h1 className="text-4xl serif mb-2 text-stone-900 dark:text-stone-100">Meus Agendamentos</h1>
        <p className="text-stone-500 dark:text-stone-400">Acompanhe o status dos seus pedidos de reserva.</p>
      </header>

      <div className="space-y-6">
        {appointments.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-12 text-center border border-dashed border-stone-200 dark:border-stone-700">
            <Calendar className="h-12 w-12 text-stone-200 dark:text-stone-700 mx-auto mb-4" />
            <p className="text-stone-400 dark:text-stone-500 italic">Você ainda não realizou nenhum agendamento.</p>
          </div>
        ) : (
          appointments.map((apt) => (
            <div key={apt.id} className="bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-sm border border-stone-100 dark:border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all">
              <div className="flex items-center space-x-6">
                <div className="p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl">
                  <Scissors className="h-6 w-6 text-brand-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100">{apt.services?.name}</h3>
                  <div className="flex flex-wrap gap-4 mt-1">
                    <div className="flex items-center text-sm text-stone-500 dark:text-stone-400">
                      <Calendar className="h-4 w-4 mr-1" />
                      {format(parseISO(apt.start_time), "dd 'de' MMMM", { locale: ptBR })}
                    </div>
                    <div className="flex items-center text-sm text-stone-500 dark:text-stone-400">
                      <Clock className="h-4 w-4 mr-1" />
                      {format(parseISO(apt.start_time), "HH:mm")} ({apt.services?.duration} min)
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end md:space-x-8 border-t md:border-t-0 pt-4 md:pt-0 border-stone-100 dark:border-stone-800">
                {apt.status === 'completed' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setReviewingApt(apt);
                    }}
                    className="flex items-center text-xs font-bold text-brand-primary hover:text-brand-primary/80 transition-colors uppercase tracking-wider"
                  >
                    <Star className="h-4 w-4 mr-1" /> Avaliar
                  </button>
                )}
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
                  <p className="text-xs text-stone-400 dark:text-stone-500 uppercase font-bold tracking-wider">Valor</p>
                  <p className="text-lg font-bold text-brand-primary">R$ {apt.services?.price.toFixed(2)}</p>
                </div>
                
                <div className={`flex items-center px-4 py-2 rounded-full text-sm font-bold ${
                  apt.status === 'confirmed' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 
                  apt.status === 'cancelled' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 
                  apt.status === 'completed' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                }`}>
                  {apt.status === 'confirmed' ? (
                    <><CheckCircle className="h-4 w-4 mr-2" /> Confirmado</>
                  ) : apt.status === 'cancelled' ? (
                    <><XCircle className="h-4 w-4 mr-2" /> Cancelado</>
                  ) : apt.status === 'completed' ? (
                    <><CheckCircle className="h-4 w-4 mr-2" /> Concluído</>
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
        {reviewingApt && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 dark:bg-black/80 backdrop-blur-sm transition-colors duration-300">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-stone-900 w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden p-8 border border-stone-100 dark:border-stone-800"
            >
              <div className="text-center mb-8">
                <div className="bg-brand-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-brand-primary fill-brand-primary" />
                </div>
                <h3 className="text-2xl serif text-stone-800 dark:text-stone-100">Avaliar Atendimento</h3>
                <p className="text-stone-500 dark:text-stone-400 text-sm">Como foi sua experiência no {reviewingApt.services?.name}?</p>
              </div>

              <form onSubmit={handleReview} className="space-y-6">
                <div className="flex justify-center space-x-2">
                  {[1,2,3,4,5].map(i => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRating(i)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star className={`h-8 w-8 ${i <= rating ? 'text-amber-400 fill-amber-400' : 'text-stone-200 dark:text-stone-700'}`} />
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">Comentário</label>
                    <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">{comment.length}/200</span>
                  </div>
                  <textarea
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Conte-nos o que achou..."
                    maxLength={200}
                    rows={3}
                    className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all resize-none dark:text-stone-100"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewingApt(null)}
                    className="flex-1 px-6 py-3 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-xl font-bold hover:bg-stone-200 dark:hover:bg-stone-700 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-brand-primary/20"
                  >
                    Enviar Avaliação
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cancellingId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 dark:bg-black/80 backdrop-blur-sm transition-colors duration-300">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-stone-900 w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden p-8 text-center border border-stone-100 dark:border-stone-800"
            >
              <div className="bg-red-50 dark:bg-red-900/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              
              <h3 className="text-2xl serif text-stone-800 dark:text-stone-100 mb-2">Cancelar Agendamento?</h3>
              <p className="text-stone-500 dark:text-stone-400 mb-8">
                Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  disabled={isProcessing}
                  onClick={() => setCancellingId(null)}
                  className="flex-1 px-6 py-3 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-xl font-bold hover:bg-stone-200 dark:hover:bg-stone-700 transition-all disabled:opacity-50"
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
