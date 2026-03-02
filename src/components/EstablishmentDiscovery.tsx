import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Salon, Service } from '../types';
import { Search, MapPin, Star, Scissors, Store, ArrowRight, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EstablishmentDiscoveryProps {
  onSelectSalon: (salonId: string) => void;
  onSelectService: (service: Service) => void;
  initialViewMode?: 'salons' | 'services';
}

export default function EstablishmentDiscovery({ onSelectSalon, onSelectService, initialViewMode = 'salons' }: EstablishmentDiscoveryProps) {
  const [viewMode, setViewMode] = useState<'salons' | 'services'>(initialViewMode);

  useEffect(() => {
    setViewMode(initialViewMode);
  }, [initialViewMode]);
  const [salons, setSalons] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [userCity, setUserCity] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'nearby' | 'city' | 'all'>('all');

  useEffect(() => {
    fetchData();
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          
          // Try to get city name from coordinates
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await response.json();
            const city = data.address.city || data.address.town || data.address.village || data.address.suburb;
            if (city) setUserCity(city);
          } catch (error) {
            console.error('Error getting city from coordinates:', error);
          }
        },
        (error) => {
          console.error('Error getting user location:', error);
        }
      );
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
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
      if (showLoading) setLoading(false);
    }
  };

  const getFilteredSalons = () => {
    let baseSalons = salons;

    // Apply location filtering if location is available
    if (userLocation) {
      const nearbySalons = salons.filter(s => {
        if (s.latitude && s.longitude) {
          const dist = calculateDistance(userLocation.lat, userLocation.lng, s.latitude, s.longitude);
          return dist <= 20; // 20km radius
        }
        return false;
      });

      if (nearbySalons.length > 0) {
        baseSalons = nearbySalons;
      } else if (userCity) {
        const citySalons = salons.filter(s => s.city?.toLowerCase() === userCity.toLowerCase());
        if (citySalons.length > 0) {
          baseSalons = citySalons;
        }
      }
    }

    return baseSalons.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getFilteredServices = () => {
    const filteredSalonIds = new Set(getFilteredSalons().map(s => s.id));
    return services.filter(s => 
      filteredSalonIds.has(s.salon_id) && (
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.salons?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  const filteredSalons = getFilteredSalons();
  const filteredServices = getFilteredServices();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 transition-colors duration-300">
      <header className="mb-8 sm:mb-12 text-center">
        <h1 className="text-2xl sm:text-5xl serif mb-3 sm:mb-4 text-stone-900 dark:text-stone-100 leading-tight">Descubra o seu <span className="italic text-brand-primary">Glow</span></h1>
        <p className="text-stone-500 dark:text-stone-400 max-w-2xl mx-auto text-xs sm:text-base">
          Encontre os melhores profissionais e serviços de beleza da sua região.
          {userCity && (
            <span className="block mt-2 text-brand-primary font-bold">
              Mostrando resultados em {userCity}
            </span>
          )}
        </p>
      </header>

      <div className="flex flex-col md:flex-row gap-6 mb-8 sm:mb-12 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-stone-400 dark:text-stone-500" />
          <input 
            type="text"
            placeholder={viewMode === 'salons' ? "Buscar estabelecimentos..." : "Buscar serviços..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary shadow-sm transition-all dark:text-stone-100 text-sm sm:text-base"
          />
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
                      <div className="relative h-48 sm:h-64 overflow-hidden">
                        <img 
                          src={salon.image_url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=800'} 
                          alt={salon.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl flex items-center shadow-lg">
                          <Star className="h-3 w-3 sm:h-4 sm:w-4 text-amber-400 fill-amber-400 mr-1" />
                          <span className="text-xs sm:text-sm font-bold text-stone-800 dark:text-stone-100">{salon.avgRating.toFixed(1)}</span>
                          <span className="text-[8px] sm:text-[10px] text-stone-400 dark:text-stone-500 ml-1">({salon.reviewCount})</span>
                        </div>
                      </div>
                      <div className="p-6 sm:p-8">
                        <h3 className="text-xl sm:text-2xl serif text-stone-800 dark:text-stone-100 mb-2 group-hover:text-brand-primary transition-colors truncate">{salon.name}</h3>
                        <div className="flex items-center text-stone-500 dark:text-stone-400 text-xs sm:text-sm mb-4">
                          <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                          <span className="truncate">{salon.address || 'Endereço não informado'}</span>
                        </div>
                        <p className="text-stone-400 dark:text-stone-500 text-xs sm:text-sm line-clamp-2 mb-6 italic">
                          "{salon.description || 'Um espaço dedicado à sua beleza e bem-estar.'}"
                        </p>
                        <div className="flex items-center justify-between pt-4 sm:pt-6 border-t border-stone-50 dark:border-stone-800">
                          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500">Ver detalhes</span>
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-stone-50 dark:bg-stone-800 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all">
                            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
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
