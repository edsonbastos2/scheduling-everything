import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Professional, Profile } from '../types';
import { Plus, User, Trash2, Edit2, UserPlus, Image as ImageIcon, X, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';

interface ProfessionalManagementProps {
  profile: Profile | null;
  salonId?: string;
}

export default function ProfessionalManagement({ profile, salonId }: ProfessionalManagementProps) {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (profile && salonId) {
      fetchProfessionals();
    }
  }, [profile, salonId]);

  const fetchProfessionals = async () => {
    if (!salonId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('salon_id', salonId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfessionals(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar profissionais');
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
      const professionalData = {
        name,
        specialty,
        avatar_url: avatarUrl || null,
        salon_id: salonId,
        is_active: isActive
      };

      if (editingProfessional) {
        const { error } = await supabase
          .from('professionals')
          .update(professionalData)
          .eq('id', editingProfessional.id);
        if (error) throw error;
        toast.success('Profissional atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('professionals')
          .insert(professionalData);
        if (error) throw error;
        toast.success('Profissional cadastrado!');
      }

      resetForm();
      fetchProfessionals();
    } catch (error: any) {
      console.error('Error saving professional:', error);
      toast.error('Erro ao salvar profissional');
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deletingId || !salonId) return;

    const toastId = toast.loading('Verificando agendamentos...');
    setIsDeleting(true);
    try {
      // Verificar se existem agendamentos vinculados a este profissional
      const { count, error: checkError } = await supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('professional_id', deletingId);

      if (checkError) throw checkError;

      if (count !== null && count > 0) {
        toast.error(`Não é possível excluir: este profissional possui ${count} agendamento(s). Recomendamos desativar o profissional.`, { 
          id: toastId,
          duration: 5000 
        });
        setDeletingId(null);
        return;
      }

      const { error: deleteError } = await supabase
        .from('professionals')
        .delete()
        .eq('id', deletingId)
        .eq('salon_id', salonId);
      
      if (deleteError) throw deleteError;
      
      toast.success('Profissional removido com sucesso!', { id: toastId });
      setDeletingId(null);
      await fetchProfessionals();
    } catch (error: any) {
      toast.error('Erro ao excluir profissional', { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (professional: Professional) => {
    setEditingProfessional(professional);
    setName(professional.name);
    setSpecialty(professional.specialty || '');
    setAvatarUrl(professional.avatar_url || '');
    setIsActive(professional.is_active ?? true);
    setShowForm(true);
  };

  const resetForm = () => {
    setName('');
    setSpecialty('');
    setAvatarUrl('');
    setIsActive(true);
    setEditingProfessional(null);
    setShowForm(false);
  };

  const filteredProfessionals = showInactive 
    ? professionals 
    : professionals.filter(p => p.is_active !== false);

  if (loading && professionals.length === 0) return <div className="p-12 text-center">Carregando profissionais...</div>;

  return (
    <div className="space-y-8 transition-colors duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl sm:text-3xl serif text-stone-900 dark:text-stone-100">Profissionais</h2>
          <p className="text-stone-500 dark:text-stone-400 text-sm sm:text-base">Gerencie a equipe do seu estabelecimento.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <label className="flex items-center cursor-pointer text-sm text-stone-500 dark:text-stone-400 font-medium whitespace-nowrap">
            <input 
              type="checkbox" 
              checked={showInactive} 
              onChange={(e) => setShowInactive(e.target.checked)}
              className="mr-2 rounded border-stone-300 dark:border-stone-700 text-brand-primary focus:ring-brand-primary bg-transparent"
            />
            Mostrar inativos
          </label>
          <button
            onClick={() => setShowForm(true)}
            className="w-full md:w-auto bg-brand-primary text-white px-6 py-3 rounded-full font-semibold flex items-center justify-center shadow-lg shadow-brand-primary/20 hover:bg-opacity-90 transition-all"
          >
            <Plus className="h-5 w-5 mr-2" /> Novo Profissional
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
              className="bg-white dark:bg-stone-900 w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden relative border border-stone-100 dark:border-stone-800"
            >
              <button 
                onClick={resetForm}
                className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-all z-10"
              >
                <X className="h-6 w-6" />
              </button>

              <div className="p-8 sm:p-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="mb-8">
                  <h3 className="text-3xl serif text-stone-800 dark:text-stone-100">{editingProfessional ? 'Editar Profissional' : 'Novo Profissional'}</h3>
                  <p className="text-stone-500 dark:text-stone-400">Preencha os detalhes do profissional abaixo.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-stone-600 dark:text-stone-400 flex items-center">
                        <User className="h-4 w-4 mr-2" /> Nome Completo
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: João Silva"
                        className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all dark:text-stone-100"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-stone-600 dark:text-stone-400 flex items-center">
                        <Briefcase className="h-4 w-4 mr-2" /> Especialidade
                      </label>
                      <input
                        type="text"
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        placeholder="Ex: Barbeiro, Cabeleireira, Manicure"
                        className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all dark:text-stone-100"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-stone-600 dark:text-stone-400 flex items-center">
                      <ImageIcon className="h-4 w-4 mr-2" /> URL da Foto (Opcional)
                    </label>
                    <input
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://exemplo.com/foto.jpg"
                      className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all dark:text-stone-100"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="h-5 w-5 rounded border-stone-300 dark:border-stone-700 text-brand-primary focus:ring-brand-primary bg-transparent"
                    />
                    <label htmlFor="is_active" className="text-sm font-semibold text-stone-600 dark:text-stone-400 cursor-pointer">
                      Profissional Ativo (disponível para agendamento)
                    </label>
                  </div>

                  <div className="flex justify-end space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-8 py-4 text-stone-500 dark:text-stone-400 font-bold hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-brand-primary text-white px-10 py-4 rounded-2xl font-bold hover:bg-opacity-90 transition-all shadow-xl shadow-brand-primary/20"
                    >
                      {editingProfessional ? 'Salvar Alterações' : 'Cadastrar Profissional'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProfessionals.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white dark:bg-stone-900 rounded-3xl border border-dashed border-stone-200 dark:border-stone-800">
            <UserPlus className="h-12 w-12 text-stone-200 dark:text-stone-800 mx-auto mb-4" />
            <p className="text-stone-400 dark:text-stone-500 italic">Nenhum profissional {showInactive ? '' : 'ativo'} encontrado.</p>
          </div>
        ) : (
          filteredProfessionals.map((professional) => (
            <div key={professional.id} className={`bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800 hover:shadow-md transition-all group overflow-hidden flex flex-col ${!professional.is_active ? 'opacity-75 grayscale-[0.5]' : ''}`}>
              <div className="p-6 flex items-center space-x-4">
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-stone-100 dark:border-stone-800 shadow-sm flex-shrink-0">
                  {professional.avatar_url ? (
                    <img 
                      src={professional.avatar_url} 
                      alt={professional.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-400 bg-stone-50 dark:bg-stone-800">
                      <User className="h-8 w-8" />
                    </div>
                  )}
                  {!professional.is_active && (
                    <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">Inativo</span>
                    </div>
                  )}
                </div>

                <div className="flex-grow overflow-hidden">
                  <h4 className="text-lg font-bold text-stone-800 dark:text-stone-100 truncate">{professional.name}</h4>
                  <p className="text-sm text-stone-500 dark:text-stone-400 truncate">
                    {professional.specialty || 'Profissional'}
                  </p>
                </div>

                <div className="flex flex-col space-y-2">
                  <button 
                    type="button"
                    onClick={() => handleEdit(professional)}
                    className="p-2 text-stone-400 hover:text-brand-primary hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition-all"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => handleDelete(e, professional.id)}
                    className="p-2 text-stone-400 hover:text-red-500 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
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
              className="bg-white dark:bg-stone-900 w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden p-8 text-center border border-stone-100 dark:border-stone-800"
            >
              <div className="bg-red-50 dark:bg-red-900/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trash2 className="h-8 w-8 text-red-500 dark:text-red-400" />
              </div>
              
              <h3 className="text-2xl serif text-stone-800 dark:text-stone-100 mb-2">Excluir Profissional?</h3>
              <p className="text-stone-500 dark:text-stone-400 mb-8">
                Deseja realmente excluir este profissional? Esta ação só é permitida se não houver agendamentos vinculados.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  disabled={isDeleting}
                  onClick={() => setDeletingId(null)}
                  className="flex-1 px-6 py-3 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-xl font-bold hover:bg-stone-200 dark:hover:bg-stone-700 transition-all disabled:opacity-50"
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
