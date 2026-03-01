import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Appointment } from '../types';
import { parseISO, differenceInMinutes, isSameDay, startOfToday } from 'date-fns';
import { toast } from 'react-hot-toast';
import { Bell } from 'lucide-react';

import { UserRole } from '../types';

export default function NotificationManager({ userId, role }: { userId: string | undefined, role: UserRole | undefined }) {
  const [lastNotified, setLastNotified] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('glow_notifications');
    return saved ? JSON.parse(saved) : {};
  });
  const [salonId, setSalonId] = useState<string | null>(null);

  useEffect(() => {
    if (role === 'admin' && userId) {
      supabase
        .from('salons')
        .select('id')
        .eq('owner_id', userId)
        .single()
        .then(({ data }) => {
          if (data) setSalonId(data.id);
        });
    }
  }, [role, userId]);

  useEffect(() => {
    localStorage.setItem('glow_notifications', JSON.stringify(lastNotified));
  }, [lastNotified]);

  useEffect(() => {
    if (!userId) return;

    // 1. Request Permission
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            toast.success('Notificações ativadas para seus agendamentos!');
          }
        });
      }
    }

    // 2. Initial check and then every minute
    checkAppointments();
    const interval = setInterval(checkAppointments, 60000);

    return () => clearInterval(interval);
  }, [userId, salonId]);

  const checkAppointments = async () => {
    if (!userId) return;

    try {
      let query = supabase
        .from('appointments')
        .select('*, services(name), profiles(full_name)')
        .eq('status', 'confirmed')
        .gte('start_time', new Date().toISOString());

      if (role === 'admin' && salonId) {
        query = query.eq('salon_id', salonId);
      } else if (role === 'client') {
        query = query.eq('client_id', userId);
      } else {
        return; // No role or salonId for admin yet
      }

      const { data: appointments, error } = await query;

      if (error) throw error;

      const now = new Date();
      const today = startOfToday();

      appointments?.forEach((apt: any) => {
        const aptTime = parseISO(apt.start_time);
        const diffMinutes = differenceInMinutes(aptTime, now);
        const notified = lastNotified[apt.id] || [];

        // Alert on the day of appointment
        if (isSameDay(aptTime, today) && !notified.includes('day')) {
          const message = role === 'admin' 
            ? `Hoje: ${apt.profiles?.full_name} tem ${apt.services?.name} às ${formatTime(aptTime)}.`
            : `Você tem um agendamento hoje: ${apt.services?.name} às ${formatTime(aptTime)}.`;
          
          sendNotification('Lembrete de Agendamento', message);
          updateNotified(apt.id, 'day');
        }

        // Alert 30 minutes before
        if (diffMinutes <= 30 && diffMinutes > 0 && !notified.includes('30min')) {
          const message = role === 'admin'
            ? `Em 30 min: ${apt.profiles?.full_name} - ${apt.services?.name}.`
            : `Faltam 30 minutos para seu serviço: ${apt.services?.name}.`;

          sendNotification('Agendamento Próximo', message);
          updateNotified(apt.id, '30min');
        }
      });
    } catch (err) {
      console.error('Error checking notifications:', err);
    }
  };

  const updateNotified = (id: string, type: string) => {
    setLastNotified(prev => ({
      ...prev,
      [id]: [...(prev[id] || []), type]
    }));
  };

  const sendNotification = (title: string, body: string) => {
    // Browser Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: 'https://picsum.photos/seed/salon-icon-192/192/192'
      });
    }

    // In-app Toast as fallback/extra
    toast(body, {
      icon: '🔔',
      duration: 6000,
      style: {
        borderRadius: '16px',
        background: '#1c1917',
        color: '#fff',
      },
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return null; // This component doesn't render anything
}
