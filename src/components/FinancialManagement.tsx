import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FinancialItem, Service } from '../types';
import { DollarSign, Plus, Trash2, TrendingUp, TrendingDown, Calculator, Info, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface FinancialManagementProps {
  salonId: string;
}

export default function FinancialManagement({ salonId }: FinancialManagementProps) {
  const [items, setItems] = useState<FinancialItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'fixed' | 'variable'>('fixed');

  // Calculator state
  const [estimatedMonthlyServices, setEstimatedMonthlyServices] = useState(100);
  const [desiredProfitMargin, setDesiredProfitMargin] = useState(30); // 30%

  useEffect(() => {
    if (salonId) {
      fetchData();
    }
  }, [salonId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: financialData } = await supabase
        .from('salon_finances')
        .select('*')
        .eq('salon_id', salonId)
        .order('created_at', { ascending: false });

      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('salon_id', salonId);

      if (financialData) setItems(financialData);
      if (servicesData) setServices(servicesData);
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from('salon_finances').insert({
        salon_id: salonId,
        description,
        amount: parseFloat(amount),
        type
      });

      if (error) throw error;
      toast.success('Item adicionado com sucesso!');
      setDescription('');
      setAmount('');
      fetchData();
    } catch (error: any) {
      toast.error('Erro ao adicionar item: Verifique se a tabela salon_finances existe.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('salon_finances')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Item removido');
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const totalFixed = items.filter(i => i.type === 'fixed').reduce((acc, curr) => acc + curr.amount, 0);
  const totalVariable = items.filter(i => i.type === 'variable').reduce((acc, curr) => acc + curr.amount, 0);

  // Calculation logic
  const fixedCostPerService = estimatedMonthlyServices > 0 ? totalFixed / estimatedMonthlyServices : 0;
  const variableCostPerService = estimatedMonthlyServices > 0 ? totalVariable / estimatedMonthlyServices : 0;
  
  const minPrice = fixedCostPerService + variableCostPerService;
  // Using the margin formula: Price = Cost / (1 - Margin)
  const maxPrice = desiredProfitMargin < 100 ? minPrice / (1 - desiredProfitMargin / 100) : minPrice;
  const profitPerService = maxPrice - minPrice;

  if (loading) return <div className="p-12 text-center">Carregando módulo financeiro...</div>;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl serif text-stone-900 dark:text-stone-100">Gestão de Receitas e Custos</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400">Controle suas finanças e calcule o preço ideal dos seus serviços.</p>
        </div>
        <div className="bg-brand-primary/10 text-brand-primary px-4 py-2 rounded-full text-xs sm:text-sm font-bold flex items-center self-start md:self-auto">
          <DollarSign className="h-4 w-4 mr-2" />
          Saúde Financeira
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Form and List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-[32px] p-5 sm:p-8 border border-stone-100 dark:border-stone-800 shadow-sm">
            <h3 className="text-lg sm:text-xl font-bold mb-6 flex items-center text-stone-800 dark:text-stone-100">
              <Plus className="h-5 w-5 mr-2 text-brand-primary" /> Cadastrar Novo Item (Mensal)
            </h3>
            <form onSubmit={handleAddItem} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-[10px] sm:text-xs font-bold text-stone-400 uppercase mb-2 tracking-wider">Descrição</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Aluguel, Luz..."
                  className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 dark:text-stone-100 text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-stone-400 uppercase mb-2 tracking-wider">Valor Mensal (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 dark:text-stone-100 text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-stone-400 uppercase mb-2 tracking-wider">Tipo</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 dark:text-stone-100 text-sm"
                >
                  <option value="fixed">Custo Fixo</option>
                  <option value="variable">Custo Variável</option>
                </select>
              </div>
              <div className="sm:col-span-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-brand-primary text-white py-3 sm:py-4 rounded-xl font-bold shadow-lg shadow-brand-primary/20 hover:bg-opacity-90 transition-all disabled:opacity-50 text-sm sm:text-base"
                >
                  {saving ? 'Salvando...' : 'Adicionar Item'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-[32px] border border-stone-100 dark:border-stone-800 shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-stone-50 dark:border-stone-800">
              <h3 className="text-lg sm:text-xl font-bold text-stone-800 dark:text-stone-100">Custos Mensais Detalhados</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px] sm:min-w-0">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-800/50">
                    <th className="px-4 sm:px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Descrição</th>
                    <th className="px-4 sm:px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Tipo</th>
                    <th className="px-4 sm:px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Valor Mensal</th>
                    <th className="px-4 sm:px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50 dark:divide-stone-800">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-stone-400 italic text-sm">Nenhum custo cadastrado ainda.</td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/50 transition-colors">
                        <td className="px-4 sm:px-6 py-4 font-medium text-stone-800 dark:text-stone-200 text-sm">{item.description}</td>
                        <td className="px-4 sm:px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${
                            item.type === 'fixed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}>
                            {item.type === 'fixed' ? 'Fixo' : 'Variável'}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 font-bold text-stone-800 dark:text-stone-200 text-sm whitespace-nowrap">R$ {item.amount.toLocaleString()}</td>
                        <td className="px-4 sm:px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Calculator Sidebar */}
        <div className="space-y-6">
          <div className="bg-stone-900 text-white rounded-2xl sm:rounded-[32px] p-6 sm:p-8 shadow-xl lg:sticky lg:top-24">
            <h3 className="text-lg sm:text-xl serif mb-6 flex items-center">
              <Calculator className="h-5 w-5 mr-2 text-brand-primary" /> Simulador de Preço
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">Atendimentos Mensais</label>
                <input
                  type="number"
                  value={estimatedMonthlyServices}
                  onChange={(e) => setEstimatedMonthlyServices(parseInt(e.target.value) || 0)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-sm"
                />
                <p className="text-[10px] text-stone-500 mt-1 italic">Quantos serviços você realiza por mês?</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">Margem de Lucro Alvo (%)</label>
                <input
                  type="number"
                  value={desiredProfitMargin}
                  max={99}
                  onChange={(e) => setDesiredProfitMargin(Math.min(99, parseInt(e.target.value) || 0))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-sm"
                />
              </div>

              <div className="pt-6 border-t border-white/10 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] sm:text-xs text-stone-400">Custo Fixo por Serviço</span>
                  <span className="font-bold text-xs sm:text-sm">R$ {fixedCostPerService.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] sm:text-xs text-stone-400">Custo Variável por Serviço</span>
                  <span className="font-bold text-xs sm:text-sm">R$ {variableCostPerService.toFixed(2)}</span>
                </div>
                
                <div className="h-px bg-white/10 my-2"></div>

                <div className="flex justify-between items-center p-3 sm:p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center text-emerald-400">
                    <TrendingDown className="h-4 w-4 mr-2" />
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase">Preço de Equilíbrio</span>
                  </div>
                  <span className="text-base sm:text-lg font-bold text-emerald-400">R$ {minPrice.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center p-3 sm:p-4 bg-brand-primary/10 rounded-2xl border border-brand-primary/20">
                  <div className="flex items-center text-brand-primary">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase">Preço com Lucro</span>
                  </div>
                  <span className="text-lg sm:text-xl font-bold text-brand-primary">R$ {maxPrice.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center px-2">
                  <span className="text-[9px] sm:text-[10px] text-stone-500 uppercase font-bold">Lucro por Atendimento</span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-500">+ R$ {profitPerService.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-start space-x-3">
                <Info className="h-4 w-4 sm:h-5 sm:w-5 text-brand-primary shrink-0 mt-0.5" />
                <p className="text-[9px] sm:text-[10px] text-stone-400 leading-relaxed">
                  O <b>Preço de Equilíbrio</b> é o valor mínimo para não ter prejuízo. O <b>Preço com Lucro</b> garante sua margem de {desiredProfitMargin}% após cobrir todos os custos mensais rateados.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl sm:rounded-[32px] p-5 sm:p-6">
            <div className="flex items-center text-amber-800 dark:text-amber-400 mb-4">
              <AlertCircle className="h-5 w-5 mr-2" />
              <h4 className="font-bold text-sm sm:text-base">Dica de Gestão</h4>
            </div>
            <p className="text-[11px] sm:text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
              Lembre-se de incluir no cadastro de "Custos Variáveis" os gastos com produtos usados em cada serviço e possíveis comissões.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
