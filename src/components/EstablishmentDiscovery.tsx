import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Salon, Service } from '../types';
import { Search, MapPin, Star, Scissors, Store, ArrowRight, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EstablishmentDiscoveryProps {
  onSelectSalon: (salonId: string) => void;
  onSelectService: (service: Service) => void;
}

export default function EstablishmentDiscovery({ onSelectSalon, onSelectService }: EstablishmentDiscoveryProps) {
  const [viewMode, setViewMode] = useState<'salons' | 'services'>('salons');
  const [salons, setSalons] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: salonsData } = await supabase
        .from('salons')
        .select('*, reviews(rating)')
        .eq('is_active', true);
      
      const { data: servicesData } = await supabase
        .from('services')
        .select('*, salons(name, address, is_active)')
        .eq('is_active', true);

      if (salonsData) {
        const processedSalons = salonsData.map(salon => {
          const ratings = salon.reviews?.map((r: any) => r.rating) || [];
          const avgRating = ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;
          return { ...salon, avgRating, reviewCount: ratings.length };
        });
        setSalons(processedSalons);
      }
      
      if (servicesData) {
        // Filter services whose salons are also active
        const activeServices = servicesData.filter((s: any) => s.salons?.is_active);
        setServices(activeServices);
      }
    } catch (error) {
      console.error('Error fetching discovery data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSalons = salons.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.salons?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 transition-colors duration-300">
      <header className="mb-12 text-center">
        <h1 className="text-5xl serif mb-4 text-stone-900 dark:text-stone-100">Descubra o seu <span className="italic text-brand-primary">Glow</span></h1>
        <p className="text-stone-500 dark:text-stone-400 max-w-2xl mx-auto">
          Encontre os melhores profissionais e serviços de beleza da sua região.
        </p>
      </header>

      <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400 dark:text-stone-500" />
          <input 
            type="text"
            placeholder={viewMode === 'salons' ? "Buscar estabelecimentos..." : "Buscar serviços..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary shadow-sm transition-all dark:text-stone-100"
          />
        </div>

        <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-2xl border border-stone-200 dark:border-stone-700">
          <button
            onClick={() => setViewMode('salons')}
            className={`flex items-center px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              viewMode === 'salons' ? 'bg-white dark:bg-stone-900 shadow-md text-brand-primary' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
            }`}
          >
            <Store className="h-4 w-4 mr-2" /> Estabelecimentos
          </button>
          <button
            onClick={() => setViewMode('services')}
            className={`flex items-center px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              viewMode === 'services' ? 'bg-white dark:bg-stone-900 shadow-md text-brand-primary' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
            }`}
          >
            <Scissors className="h-4 w-4 mr-2" /> Serviços
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-stone-100 dark:bg-stone-800 animate-pulse rounded-[32px] aspect-[4/5]" />
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {viewMode === 'salons' ? (
            <motion.div 
              key="salons"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredSalons.map((salon) => (
                <div 
                  key={salon.id} 
                  onClick={() => onSelectSalon(salon.id)}
                  className="bg-white dark:bg-stone-900 rounded-[32px] overflow-hidden shadow-sm border border-stone-100 dark:border-stone-800 hover:shadow-xl transition-all group cursor-pointer"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img 
                      src={salon.image_url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=800'} 
                      alt={salon.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center shadow-lg">
                      <Star className="h-4 w-4 text-amber-400 fill-amber-400 mr-1" />
                      <span className="text-sm font-bold text-stone-800 dark:text-stone-100">{salon.avgRating.toFixed(1)}</span>
                      <span className="text-[10px] text-stone-400 dark:text-stone-500 ml-1">({salon.reviewCount})</span>
                    </div>
                  </div>
                  <div className="p-8">
                    <h3 className="text-2xl serif text-stone-800 dark:text-stone-100 mb-2 group-hover:text-brand-primary transition-colors">{salon.name}</h3>
                    <div className="flex items-center text-stone-500 dark:text-stone-400 text-sm mb-4">
                      <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span className="truncate">{salon.address || 'Endereço não informado'}</span>
                    </div>
                    <p className="text-stone-400 dark:text-stone-500 text-sm line-clamp-2 mb-6 italic">
                      "{salon.description || 'Um espaço dedicado à sua beleza e bem-estar.'}"
                    </p>
                    <div className="flex items-center justify-between pt-6 border-t border-stone-50 dark:border-stone-800">
                      <span className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500">Ver detalhes</span>
                      <div className="w-10 h-10 rounded-full bg-stone-50 dark:bg-stone-800 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all">
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="services"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredServices.map((service) => (
                <div 
                  key={service.id}
                  onClick={() => onSelectService(service)}
                  className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800 hover:shadow-md transition-all group cursor-pointer flex flex-col"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-2xl group-hover:bg-brand-primary/10 transition-colors">
                      <Scissors className="h-6 w-6 text-brand-primary" />
                    </div>
                    <span className="text-xl font-bold text-brand-primary">R$ {service.price.toFixed(2)}</span>
                  </div>
                  <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-1">{service.name}</h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400 mb-4 flex items-center">
                    <Store className="h-3 w-3 mr-1" /> {service.salons?.name}
                  </p>
                  <p className="text-sm text-stone-400 dark:text-stone-500 line-clamp-2 mb-6 flex-grow">
                    {service.description || 'Serviço profissional de alta qualidade.'}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-stone-50 dark:border-stone-800">
                    <span className="text-xs text-stone-400 dark:text-stone-500 font-medium">{service.duration} min</span>
                    <button className="text-sm font-bold text-brand-primary hover:underline">Agendar agora</button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
