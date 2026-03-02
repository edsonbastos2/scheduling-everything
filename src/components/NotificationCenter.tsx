import React, { useState, useEffect } from 'react';
import { Bell, X, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  type: 'info' | 'success' | 'warning';
  read: boolean;
}

interface NotificationCenterProps {
  notifications: AppNotification[];
  onClear: () => void;
  onMarkAsRead: (id: string) => void;
}

export default function NotificationCenter({ notifications, onClear, onMarkAsRead }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 rounded-2xl hover:bg-stone-200 dark:hover:bg-stone-700 transition-all shadow-sm relative"
        title="Notificações do Dia"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-4 h-4 bg-brand-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-stone-800">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-[120]" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-stone-900 rounded-[24px] shadow-2xl border border-stone-100 dark:border-stone-800 z-[130] overflow-hidden"
            >
              <div className="p-5 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-stone-50/50 dark:bg-stone-800/50">
                <h3 className="font-bold text-stone-800 dark:text-stone-100 flex items-center">
                  <Bell className="h-4 w-4 mr-2 text-brand-primary" />
                  Alertas do Dia
                </h3>
                <div className="flex items-center space-x-2">
                  {notifications.length > 0 && (
                    <button 
                      onClick={onClear}
                      className="text-[10px] font-bold text-stone-400 hover:text-red-500 uppercase tracking-wider transition-colors"
                    >
                      Limpar
                    </button>
                  )}
                  <button onClick={() => setIsOpen(false)}>
                    <X className="h-4 w-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200" />
                  </button>
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto p-4 space-y-3">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Bell className="h-6 w-6 text-stone-300" />
                    </div>
                    <p className="text-sm text-stone-400 italic">Nenhum alerta para hoje.</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      onClick={() => onMarkAsRead(notification.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        notification.read 
                          ? 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800 opacity-60' 
                          : 'bg-stone-50 dark:bg-stone-800/50 border-brand-primary/10 shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">
                          {notification.title}
                        </span>
                        <span className="text-[10px] text-stone-400 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {format(notification.timestamp, 'HH:mm')}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                        {notification.message}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 bg-stone-50 dark:bg-stone-800/30 border-t border-stone-100 dark:border-stone-800 text-center">
                <p className="text-[10px] text-stone-400 uppercase font-bold tracking-widest">
                  {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
