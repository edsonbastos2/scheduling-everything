import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Salon, Service } from '../types';
import { MapPin, Phone, Star, Scissors, Clock, ArrowLeft, MessageSquare, ChevronRight, CheckCircle, Info, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

interface EstablishmentDetailProps {
  salonId: string;
  onBack: () => void;
  onSelectService: (service: Service) => void;
}

export default function EstablishmentDetail({ salonId, onBack, onSelectService }: EstablishmentDetailProps) {
  const [salon, setSalon] = useState<any>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'services' | 'reviews' | 'about'>('services');
  const [user, setUser] = useState<any>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchSalonData();
    checkUser();
  }, [salonId]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setUser(profile);
    }
  };

  const fetchSalonData = async () => {
    setLoading(true);
    try {
      const { data: salonData } = await supabase
        .from('salons')
        .select('*')
        .eq('id', salonId)
        .single();
      
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('salon_id', salonId)
        .eq('is_active', true);

      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*, profiles(full_name, avatar_url)')
        .eq('salon_id', salonId)
        .order('created_at', { ascending: false });

      if (salonData) setSalon(salonData);
      if (servicesData) setServices(servicesData);
      if (reviewsData) setReviews(reviewsData);
    } catch (error) {
      console.error('Error fetching salon detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Você precisa estar logado para avaliar.');
      return;
    }

    if (user.role !== 'client') {
      toast.error('Apenas clientes podem fazer avaliações.');
      return;
    }

    if (!newComment.trim()) {
      toast.error('Por favor, escreva um comentário.');
      return;
    }

    setSubmittingReview(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          salon_id: salonId,
          client_id: user.id,
          rating: newRating,
          comment: newComment.trim()
        });

      if (error) throw error;

      toast.success('Avaliação enviada com sucesso!');
      setNewComment('');
      setNewRating(5);
      fetchSalonData();
    } catch (error: any) {
      toast.error('Erro ao enviar avaliação: ' + error.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <div className="p-12 text-center">Carregando detalhes do estabelecimento...</div>;
  if (!salon) return <div className="p-12 text-center">Estabelecimento não encontrado.</div>;

  const avgRating = reviews.length > 0 ? reviews.reduce((a, b) => a + b.rating, 0) / reviews.length : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 transition-colors duration-300">
      <button 
        onClick={onBack}
        className="flex items-center text-stone-500 dark:text-stone-400 hover:text-brand-primary transition-colors mb-8 font-bold text-sm uppercase tracking-wider"
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para busca
      </button>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Left Column: Salon Info */}
        <div className="lg:col-span-2 space-y-12">
          <header className="relative h-[400px] rounded-[40px] overflow-hidden shadow-2xl group">
            <img 
              src={salon.image_url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1200'} 
              alt={salon.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-12">
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-brand-primary text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest">Aberto agora</div>
                <div className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center">
                  <Star className="h-3 w-3 text-amber-400 fill-amber-400 mr-1" /> {avgRating.toFixed(1)} ({reviews.length} avaliações)
                </div>
              </div>
              <h1 className="text-5xl serif text-white mb-4">{salon.name}</h1>
              <div className="flex flex-wrap gap-6 text-white/80 text-sm">
                <div className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-brand-primary" /> {salon.address || 'Endereço não informado'}</div>
                <div className="flex items-center"><Phone className="h-4 w-4 mr-2 text-brand-primary" /> {salon.phone || 'Telefone não informado'}</div>
              </div>
            </div>
          </header>

          <div className="flex border-b border-stone-100 dark:border-stone-800 overflow-x-auto no-scrollbar whitespace-nowrap">
            <button 
              onClick={() => setActiveTab('services')}
              className={`px-8 py-4 text-sm font-bold uppercase tracking-wider transition-all relative flex-shrink-0 ${
                activeTab === 'services' ? 'text-brand-primary' : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
              }`}
            >
              Serviços
              {activeTab === 'services' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand-primary rounded-full" />}
            </button>
            <button 
              onClick={() => setActiveTab('reviews')}
              className={`px-8 py-4 text-sm font-bold uppercase tracking-wider transition-all relative flex-shrink-0 ${
                activeTab === 'reviews' ? 'text-brand-primary' : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
              }`}
            >
              Avaliações ({reviews.length})
              {activeTab === 'reviews' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand-primary rounded-full" />}
            </button>
            <button 
              onClick={() => setActiveTab('about')}
              className={`px-8 py-4 text-sm font-bold uppercase tracking-wider transition-all relative flex-shrink-0 ${
                activeTab === 'about' ? 'text-brand-primary' : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
              }`}
            >
              Sobre
              {activeTab === 'about' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand-primary rounded-full" />}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'services' && (
              <motion.div 
                key="services"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {services.length === 0 ? (
                  <p className="text-stone-400 dark:text-stone-500 italic py-8">Nenhum serviço disponível no momento.</p>
                ) : (
                  services.map((service) => (
                    <div 
                      key={service.id} 
                      className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-100 dark:border-stone-800 flex items-center justify-between hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center space-x-6">
                        <div className="p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl group-hover:bg-brand-primary/10 transition-colors">
                          <Scissors className="h-6 w-6 text-brand-primary" />
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-stone-800 dark:text-stone-100">{service.name}</h4>
                          <div className="flex items-center text-sm text-stone-500 dark:text-stone-400 mt-1">
                            <Clock className="h-4 w-4 mr-1" /> {service.duration} min
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-8">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-brand-primary">R$ {service.price.toFixed(2)}</p>
                        </div>
                        <button 
                          onClick={() => onSelectService(service)}
                          className="bg-stone-900 dark:bg-stone-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-primary transition-all shadow-lg shadow-stone-900/10"
                        >
                          Agendar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div 
                key="reviews"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-12"
              >
                {/* Review Form */}
                {user?.role === 'client' && (
                  <div className="bg-stone-50 dark:bg-stone-900/50 p-8 rounded-[32px] border border-stone-100 dark:border-stone-800">
                    <h4 className="text-xl serif text-stone-800 dark:text-stone-100 mb-6">Deixe sua avaliação</h4>
                    <form onSubmit={handleSubmitReview} className="space-y-6">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mr-4">Sua nota:</span>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewRating(star)}
                            className="focus:outline-none transition-transform hover:scale-110"
                          >
                            <Star
                              className={`h-8 w-8 ${
                                star <= newRating ? 'text-amber-400 fill-amber-400' : 'text-stone-300 dark:text-stone-700'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <div className="relative">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Como foi sua experiência? (Máx. 200 caracteres)"
                          maxLength={200}
                          rows={3}
                          className="w-full px-6 py-4 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all resize-none text-stone-700 dark:text-stone-100"
                        />
                        <div className="absolute bottom-4 right-4 text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
                          {newComment.length}/200
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="w-full sm:w-auto bg-brand-primary text-white px-8 py-4 rounded-xl font-bold hover:bg-opacity-90 transition-all disabled:opacity-50 flex items-center justify-center shadow-lg shadow-brand-primary/20"
                      >
                        {submittingReview ? (
                          'Enviando...'
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" /> Enviar Avaliação
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}

                <div className="space-y-8">
                  {reviews.length === 0 ? (
                  <div className="text-center py-12 bg-stone-50 dark:bg-stone-900/50 rounded-[32px] border border-dashed border-stone-200 dark:border-stone-800">
                    <MessageSquare className="h-12 w-12 text-stone-200 dark:text-stone-700 mx-auto mb-4" />
                    <p className="text-stone-400 dark:text-stone-500 italic">Ainda não há avaliações para este local.</p>
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="flex space-x-6">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-stone-100 dark:bg-stone-800 flex-shrink-0">
                        {review.profiles?.avatar_url ? (
                          <img src={review.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-400 dark:text-stone-500">
                            <Star className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h5 className="font-bold text-stone-800 dark:text-stone-100">{review.profiles?.full_name || 'Cliente'}</h5>
                            <div className="flex items-center mt-1">
                              {[1,2,3,4,5].map(i => (
                                <Star key={i} className={`h-3 w-3 ${i <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-stone-200 dark:text-stone-700'}`} />
                              ))}
                            </div>
                          </div>
                          <span className="text-xs text-stone-400 dark:text-stone-500">{format(parseISO(review.created_at), "dd 'de' MMM", { locale: ptBR })}</span>
                        </div>
                        <p className="text-stone-600 dark:text-stone-400 italic">"{review.comment}"</p>
                      </div>
                    </div>
                  ))
                )}
                </div>
              </motion.div>
            )}

            {activeTab === 'about' && (
              <motion.div 
                key="about"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="bg-stone-50 dark:bg-stone-900/50 p-8 rounded-[32px] border border-stone-100 dark:border-stone-800">
                  <h4 className="text-xl serif text-stone-800 dark:text-stone-100 mb-4 flex items-center">
                    <span className="p-2 bg-brand-primary/10 rounded-lg mr-3">
                      <Info className="h-5 w-5 text-brand-primary" />
                    </span>
                    Nossa História
                  </h4>
                  <p className="text-stone-600 dark:text-stone-400 leading-relaxed italic">
                    {salon.detailed_history || salon.description || 'Um espaço dedicado à sua beleza e bem-estar, focado em oferecer a melhor experiência possível para nossos clientes.'}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="p-8 bg-white dark:bg-stone-900 rounded-[32px] border border-stone-100 dark:border-stone-800 shadow-sm">
                    <h4 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-4">Horário de Funcionamento</h4>
                    <ul className="space-y-3">
                      {salon.opening_hours ? (
                        Object.entries(salon.opening_hours).map(([day, hours]) => (
                          <li key={day} className="flex justify-between text-sm">
                            <span className="text-stone-500 dark:text-stone-400">{day}</span>
                            <span className={`font-bold ${(hours as string).toLowerCase().includes('fechado') ? 'text-red-400' : 'text-stone-800 dark:text-stone-100'}`}>
                              {hours as string}
                            </span>
                          </li>
                        ))
                      ) : (
                        ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(day => (
                          <li key={day} className="flex justify-between text-sm">
                            <span className="text-stone-500 dark:text-stone-400">{day}</span>
                            <span className="font-bold text-stone-800 dark:text-stone-100">09:00 - 19:00</span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                  <div className="p-8 bg-white dark:bg-stone-900 rounded-[32px] border border-stone-100 dark:border-stone-800 shadow-sm">
                    <h4 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-4">Diferenciais</h4>
                    <ul className="space-y-3">
                      {salon.differentiators && salon.differentiators.length > 0 ? (
                        salon.differentiators.map(item => (
                          <li key={item} className="flex items-center text-sm text-stone-600 dark:text-stone-400">
                            <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" /> {item}
                          </li>
                        ))
                      ) : (
                        ['Ambiente Climatizado', 'Wi-Fi Gratuito', 'Café e Bebidas', 'Estacionamento'].map(item => (
                          <li key={item} className="flex items-center text-sm text-stone-600 dark:text-stone-400">
                            <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" /> {item}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </div>

                {salon.address && (
                  <div className="p-8 bg-stone-50 dark:bg-stone-900/50 rounded-[32px] border border-stone-100 dark:border-stone-800">
                    <h4 className="text-xl serif text-stone-800 dark:text-stone-100 mb-6 flex items-center">
                      <span className="p-2 bg-brand-primary/10 rounded-lg mr-3">
                        <MapPin className="h-5 w-5 text-brand-primary" />
                      </span>
                      Localização
                    </h4>
                    <div className="aspect-video rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-700 shadow-inner bg-stone-200 dark:bg-stone-800">
                      <iframe 
                        width="100%" 
                        height="100%" 
                        frameBorder="0" 
                        scrolling="no" 
                        marginHeight={0} 
                        marginWidth={0} 
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(salon.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                        title="Localização do Salão"
                        className="dark:invert dark:hue-rotate-180 dark:brightness-90"
                      />
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm text-stone-500 dark:text-stone-400">{salon.address}</p>
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(salon.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-primary text-sm font-bold hover:underline flex items-center"
                      >
                        Abrir no Google Maps <ChevronRight className="h-4 w-4 ml-1" />
                      </a>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Sticky Sidebar */}
        <div className="space-y-8">
          <div className="bg-stone-900 dark:bg-stone-950 text-white p-8 rounded-[40px] shadow-2xl sticky top-24 border border-white/5 dark:border-white/10">
            <h3 className="text-2xl serif mb-6">Agende agora</h3>
            <p className="text-stone-400 text-sm mb-8">
              Escolha um serviço ao lado para iniciar seu agendamento de forma rápida e segura.
            </p>
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center mr-4">
                  <CheckCircle className="h-5 w-5 text-brand-primary" />
                </div>
                <span className="text-sm font-medium">Confirmação Instantânea</span>
              </div>
              <div className="flex items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center mr-4">
                  <Clock className="h-5 w-5 text-brand-primary" />
                </div>
                <span className="text-sm font-medium">Escolha seu Horário</span>
              </div>
            </div>
            
            <div className="mt-12 pt-8 border-t border-white/10">
              <p className="text-xs text-stone-500 dark:text-stone-400 uppercase font-bold tracking-widest mb-4">Localização</p>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(salon.address || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square bg-white/5 rounded-3xl overflow-hidden border border-white/10 flex items-center justify-center group/map hover:bg-white/10 transition-all"
              >
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-stone-700 dark:text-stone-600 mx-auto mb-2 group-hover/map:text-brand-primary transition-colors" />
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 font-bold uppercase tracking-widest opacity-0 group-hover/map:opacity-100 transition-opacity">Ver Mapa</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
