import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Salon, Profile } from '../types';
import { Save, Building, MapPin, Phone, AlignLeft } from 'lucide-react';
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
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-100 max-w-2xl mx-auto">
      <h2 className="text-2xl serif mb-8 flex items-center">
        <Building className="mr-2 h-6 w-6 text-brand-primary" />
        Configurações do Salão
      </h2>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-stone-600 flex items-center">
            <Building className="h-4 w-4 mr-2" /> Nome do Salão
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Glow Beauty Studio"
            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-stone-600 flex items-center">
            <AlignLeft className="h-4 w-4 mr-2" /> Descrição
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Conte um pouco sobre o seu espaço e serviços..."
            rows={4}
            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all resize-none"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-600 flex items-center">
              <MapPin className="h-4 w-4 mr-2" /> Endereço
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, Número, Bairro"
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-600 flex items-center">
              <Phone className="h-4 w-4 mr-2" /> Telefone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
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
