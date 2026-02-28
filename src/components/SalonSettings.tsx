import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Salon, Profile } from '../types';
import { Save, Building, MapPin, Phone, AlignLeft, Clock, Star, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SalonSettingsProps {
  profile: Profile | null;
}

export default function SalonSettings({ profile }: SalonSettingsProps) {
  const [salon, setSalon] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [detailedHistory, setDetailedHistory] = useState('');
  const [differentiators, setDifferentiators] = useState('');
  const [openingHours, setOpeningHours] = useState<Record<string, string>>({
    'Segunda': '09:00 - 19:00',
    'Terça': '09:00 - 19:00',
    'Quarta': '09:00 - 19:00',
    'Quinta': '09:00 - 19:00',
    'Sexta': '09:00 - 19:00',
    'Sábado': '09:00 - 19:00',
    'Domingo': 'Fechado'
  });

  useEffect(() => {
    if (profile) {
      fetchSalon();
    }
  }, [profile]);

  const fetchSalon = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('salons')
        .select('*')
        .eq('owner_id', profile?.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
        throw error;
      }

      if (data) {
        setSalon(data);
        setName(data.name);
        setDescription(data.description || '');
        setAddress(data.address || '');
        setPhone(data.phone || '');
        setDetailedHistory(data.detailed_history || '');
        setDifferentiators(data.differentiators?.join(', ') || '');
        if (data.opening_hours) {
          setOpeningHours(data.opening_hours);
        }
      }
    } catch (error: any) {
      console.error('Error fetching salon:', error);
      toast.error('Erro ao carregar dados do salão');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    try {
      const salonData = {
        owner_id: profile.id,
        name,
        description,
        address,
        phone,
        detailed_history: detailedHistory,
        differentiators: differentiators.split(',').map(s => s.trim()).filter(s => s !== ''),
        opening_hours: openingHours,
      };

      let error;
      if (salon) {
        // Update
        const { error: updateError } = await supabase
          .from('salons')
          .update(salonData)
          .eq('id', salon.id);
        error = updateError;
      } else {
        // Insert
        const { error: insertError } = await supabase
          .from('salons')
          .insert(salonData);
        error = insertError;
      }

      if (error) throw error;
      
      toast.success('Configurações salvas com sucesso!');
      fetchSalon();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center">Carregando configurações...</div>;

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl p-8 shadow-sm border border-stone-100 dark:border-stone-800 max-w-2xl mx-auto transition-colors duration-300">
      <h2 className="text-2xl serif mb-8 flex items-center text-stone-900 dark:text-stone-100">
        <Building className="mr-2 h-6 w-6 text-brand-primary" />
        Configurações do Salão
      </h2>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-stone-600 dark:text-stone-400 flex items-center">
            <Building className="h-4 w-4 mr-2" /> Nome do Salão
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Glow Beauty Studio"
            className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all dark:text-stone-100"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-stone-600 dark:text-stone-400 flex items-center">
            <AlignLeft className="h-4 w-4 mr-2" /> Descrição
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Conte um pouco sobre o seu espaço e serviços..."
            rows={2}
            className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all resize-none dark:text-stone-100"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-stone-600 dark:text-stone-400 flex items-center">
            <Info className="h-4 w-4 mr-2" /> Nossa História (Detalhado)
          </label>
          <textarea
            value={detailedHistory}
            onChange={(e) => setDetailedHistory(e.target.value)}
            placeholder="Conte a história do seu estabelecimento em detalhes..."
            rows={4}
            className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all resize-none dark:text-stone-100"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-stone-600 dark:text-stone-400 flex items-center">
            <Star className="h-4 w-4 mr-2" /> Diferenciais (separados por vírgula)
          </label>
          <input
            type="text"
            value={differentiators}
            onChange={(e) => setDifferentiators(e.target.value)}
            placeholder="Ex: Café cortesia, Wi-Fi, Estacionamento, Ar condicionado"
            className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all dark:text-stone-100"
          />
        </div>

        <div className="space-y-4">
          <label className="text-sm font-semibold text-stone-600 dark:text-stone-400 flex items-center">
            <Clock className="h-4 w-4 mr-2" /> Horário de Funcionamento
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.keys(openingHours).map((day) => (
              <div key={day} className="flex items-center justify-between bg-stone-50 dark:bg-stone-800 p-3 rounded-xl border border-stone-100 dark:border-stone-700">
                <span className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase">{day}</span>
                <input
                  type="text"
                  value={openingHours[day]}
                  onChange={(e) => setOpeningHours({ ...openingHours, [day]: e.target.value })}
                  className="text-xs font-bold text-stone-800 dark:text-stone-200 bg-transparent border-none focus:ring-0 text-right w-32"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-600 dark:text-stone-400 flex items-center">
              <MapPin className="h-4 w-4 mr-2" /> Endereço
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, Número, Bairro"
              className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all dark:text-stone-100"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-600 dark:text-stone-400 flex items-center">
              <Phone className="h-4 w-4 mr-2" /> Telefone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
              className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all dark:text-stone-100"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-brand-primary text-white py-4 rounded-xl font-semibold hover:bg-opacity-90 transition-all disabled:opacity-50 flex items-center justify-center"
        >
          {saving ? (
            'Salvando...'
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" /> Salvar Alterações
            </>
          )}
        </button>
      </form>
    </div>
  );
}
