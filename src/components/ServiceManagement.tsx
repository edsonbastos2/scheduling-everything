import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Service, Profile } from '../types';
import { Plus, Scissors, Trash2, Edit2, Clock, DollarSign, AlignLeft, Image as ImageIcon, List, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';

interface ServiceManagementProps {
  profile: Profile | null;
  salonId?: string;
}

export default function ServiceManagement({ profile, salonId }: ServiceManagementProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('30');
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('Outros');

  const categories = ['Masculino', 'Feminino', 'Corte de Cabelo', 'Barba', 'Unhas', 'Outros'];

  useEffect(() => {
    if (profile && salonId) {
      fetchServices();
    }
  }, [profile, salonId]);

  const fetchServices = async () => {
    if (!salonId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('salon_id', salonId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !salonId) {
      toast.error('Cadastre seu salão primeiro nas configurações');
      return;
    }

    try {
      const serviceData = {
        name,
        description,
        price: parseFloat(price),
        duration: parseInt(duration),
        salon_id: salonId,
        is_active: isActive,
        image_url: imageUrl || null,
        category: category
      };

      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingService.id);
        if (error) throw error;
        toast.success('Serviço atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('services')
          .insert(serviceData);
        if (error) throw error;
        toast.success('Serviço cadastrado!');
      }

      resetForm();
      fetchServices();
    } catch (error: any) {
      console.error('Error saving service:', error);
      toast.error('Erro ao salvar serviço');
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deletingId || !salonId) return;

    const toastId = toast.loading('Verificando permissões e agendamentos...');
    setIsDeleting(true);
    try {
      // 1. Verificar se existem agendamentos (independente do status)
      const { count, error: checkError } = await supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('service_id', deletingId);

      if (checkError) throw checkError;

      if (count !== null && count > 0) {
        toast.error(`Não é possível excluir: este serviço possui ${count} agendamento(s) registrado(s). Recomendamos desativar o serviço para que ele não apareça mais para os clientes.`, { 
          id: toastId,
          duration: 5000 
        });
        setDeletingId(null);
        return;
      }

      // 2. Tentar a exclusão
      toast.loading('Excluindo serviço do catálogo...', { id: toastId });
      const { error: deleteError } = await supabase
        .from('services')
        .delete()
        .eq('id', deletingId)
        .eq('salon_id', salonId); // Garantia extra de segurança RLS
      
      if (deleteError) throw deleteError;
      
      toast.success('Serviço removido com sucesso!', { id: toastId });
      setDeletingId(null);
      await fetchServices();
    } catch (error: any) {
      console.error('Erro ao excluir serviço:', error);
      toast.error(error.message || 'Erro ao processar exclusão. Verifique se você tem permissão.', { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setName(service.name);
    setDescription(service.description || '');
    setPrice(service.price.toString());
    setDuration(service.duration.toString());
    setIsActive(service.is_active ?? true);
    setImageUrl(service.image_url || '');
    setCategory(service.category || 'Outros');
    setShowForm(true);
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setDuration('30');
    setIsActive(true);
    setImageUrl('');
    setCategory('Outros');
    setEditingService(null);
    setShowForm(false);
  };

  const filteredServices = showInactive 
    ? services 
    : services.filter(s => s.is_active !== false);

  if (loading && services.length === 0) return <div className="p-12 text-center">Carregando serviços...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl serif">Meus Serviços</h2>
          <p className="text-stone-500">Gerencie os serviços oferecidos pelo seu estabelecimento.</p>
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center cursor-pointer text-sm text-stone-500 font-medium">
            <input 
              type="checkbox" 
              checked={showInactive} 
              onChange={(e) => setShowInactive(e.target.checked)}
              className="mr-2 rounded border-stone-300 text-brand-primary focus:ring-brand-primary"
            />
            Mostrar inativos
          </label>
          <button
            onClick={() => setShowForm(true)}
            className="bg-brand-primary text-white px-6 py-3 rounded-full font-semibold flex items-center shadow-lg shadow-brand-primary/20 hover:bg-opacity-90 transition-all"
          >
            <Plus className="h-5 w-5 mr-2" /> Novo Serviço
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden relative"
            >
              <button 
                onClick={resetForm}
                className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-all z-10"
              >
                <X className="h-6 w-6" />
              </button>

              <div className="p-8 sm:p-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="mb-8">
                  <h3 className="text-3xl serif text-stone-800">{editingService ? 'Editar Serviço' : 'Novo Serviço'}</h3>
                  <p className="text-stone-500">Preencha os detalhes do serviço abaixo.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-stone-600 flex items-center">
                        <Scissors className="h-4 w-4 mr-2" /> Nome do Serviço
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Corte de Cabelo Masculino"
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-stone-600 flex items-center">
                        <ImageIcon className="h-4 w-4 mr-2" /> URL da Imagem (Opcional)
                      </label>
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://exemplo.com/foto.jpg"
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-stone-600 flex items-center">
                          <DollarSign className="h-4 w-4 mr-2" /> Preço (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="0,00"
                          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-stone-600 flex items-center">
                          <Clock className="h-4 w-4 mr-2" /> Duração
                        </label>
                        <select
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                        >
                          <option value="15">15 min</option>
                          <option value="30">30 min</option>
                          <option value="45">45 min</option>
                          <option value="60">1 hora</option>
                          <option value="90">1h 30min</option>
                          <option value="120">2 horas</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-stone-600 flex items-center">
                        <List className="h-4 w-4 mr-2" /> Categoria
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-stone-600 flex items-center">
                      <AlignLeft className="h-4 w-4 mr-2" /> Descrição (Opcional)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Descreva o que está incluso neste serviço..."
                      rows={3}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all resize-none"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="h-5 w-5 rounded border-stone-300 text-brand-primary focus:ring-brand-primary"
                    />
                    <label htmlFor="is_active" className="text-sm font-semibold text-stone-600 cursor-pointer">
                      Serviço Ativo (disponível para agendamento)
                    </label>
                  </div>

                  <div className="flex justify-end space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-8 py-4 text-stone-500 font-bold hover:text-stone-700 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-brand-primary text-white px-10 py-4 rounded-2xl font-bold hover:bg-opacity-90 transition-all shadow-xl shadow-brand-primary/20"
                    >
                      {editingService ? 'Salvar Alterações' : 'Criar Serviço'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-stone-200">
            <Scissors className="h-12 w-12 text-stone-200 mx-auto mb-4" />
            <p className="text-stone-400 italic">Nenhum serviço {showInactive ? '' : 'ativo'} encontrado.</p>
          </div>
        ) : (
          filteredServices.map((service) => (
            <div key={service.id} className={`bg-white rounded-3xl shadow-sm border border-stone-100 hover:shadow-md transition-all group overflow-hidden flex flex-col ${!service.is_active ? 'opacity-75 grayscale-[0.5]' : ''}`}>
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={service.image_url || 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=80&w=400'} 
                  alt={service.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4 flex items-center space-x-2">
                  {service.category && (
                    <span className="bg-brand-primary/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md">{service.category}</span>
                  )}
                  {!service.is_active && (
                    <span className="bg-stone-800/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md">Inativo</span>
                  )}
                </div>
                <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleEdit(service); }}
                    className="p-2 bg-white/90 backdrop-blur-md text-stone-600 hover:text-brand-primary rounded-xl shadow-lg transition-all"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => handleDelete(e, service.id)}
                    className="p-2 bg-white/90 backdrop-blur-md text-stone-600 hover:text-red-500 rounded-xl shadow-lg transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 flex-grow flex flex-col">
                <h4 className="text-lg font-bold text-stone-800 mb-1">{service.name}</h4>
                <p className="text-sm text-stone-500 line-clamp-2 mb-4 h-10">
                  {service.description || 'Sem descrição disponível.'}
                </p>
                
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-stone-50">
                  <div className="flex items-center text-stone-500 text-sm">
                    <Clock className="h-4 w-4 mr-1" />
                    {service.duration} min
                  </div>
                  <div className="text-xl font-bold text-brand-primary">
                    R$ {service.price.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden p-8 text-center"
            >
              <div className="bg-red-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trash2 className="h-8 w-8 text-red-500" />
              </div>
              
              <h3 className="text-2xl serif text-stone-800 mb-2">Excluir Serviço?</h3>
              <p className="text-stone-500 mb-8">
                Deseja realmente excluir este serviço? Esta ação só é permitida se não houver agendamentos vinculados.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  disabled={isDeleting}
                  onClick={() => setDeletingId(null)}
                  className="flex-1 px-6 py-3 bg-stone-100 text-stone-600 rounded-xl font-bold hover:bg-stone-200 transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  disabled={isDeleting}
                  onClick={confirmDelete}
                  className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
                >
                  {isDeleting ? 'Excluindo...' : 'Sim, excluir'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
