import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Star, MessageSquare } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReviewsViewProps {
  salonId?: string;
}

export default function ReviewsView({ salonId }: ReviewsViewProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (salonId) {
      fetchReviews();
    }
  }, [salonId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, profiles(full_name, avatar_url)')
        .eq('salon_id', salonId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-12 text-center">Carregando avaliações...</div>;

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl p-8 shadow-sm border border-stone-100 dark:border-stone-800 transition-colors duration-300">
      <h2 className="text-2xl serif mb-8 flex items-center text-stone-900 dark:text-stone-100">
        <Star className="mr-2 h-6 w-6 text-amber-400 fill-amber-400" />
        Avaliações dos Clientes
      </h2>

      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-stone-50 dark:bg-stone-800/50 rounded-[32px] border border-dashed border-stone-200 dark:border-stone-700">
          <MessageSquare className="h-12 w-12 text-stone-200 dark:text-stone-700 mx-auto mb-4" />
          <p className="text-stone-400 dark:text-stone-500 italic">Seu salão ainda não recebeu avaliações.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {reviews.map((review) => (
            <div key={review.id} className="p-6 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-800 flex gap-6">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-stone-200 dark:bg-stone-700 flex-shrink-0">
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
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} className={`h-3 w-3 ${i <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-stone-200 dark:text-stone-700'}`} />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-stone-400 dark:text-stone-500">{format(parseISO(review.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}</span>
                </div>
                <p className="text-stone-600 dark:text-stone-300 italic">"{review.comment}"</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
