import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Appointment } from '../types';
import { parseISO, differenceInMinutes, isSameDay, startOfToday } from 'date-fns';
import { toast } from 'react-hot-toast';
import { Bell } from 'lucide-react';

import { UserRole } from '../types';

import { AppNotification } from './NotificationCenter';

export default function NotificationManager({ userId, role, onNewNotification, onAppointmentExpired }: { 
  userId: string | undefined, 
  role: UserRole | undefined, 
  onNewNotification?: (n: AppNotification) => void,
  onAppointmentExpired?: (appointment: any) => void
}) {
  const [lastNotified, setLastNotified] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('glow_notifications');
    return saved ? JSON.parse(saved) : {};
  });
  const [lastUrgentAlert, setLastUrgentAlert] = useState<Record<string, number>>({});
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

    // 2. Initial check and then every 30 seconds to catch the 90s interval accurately
    checkAppointments();
    const interval = setInterval(checkAppointments, 30000);

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

        // 1. Alert on the day of appointment
        if (isSameDay(aptTime, today) && !notified.includes('day')) {
          const message = role === 'admin' 
            ? `Hoje: ${apt.profiles?.full_name} tem ${apt.services?.name} às ${formatTime(aptTime)}.`
            : `Você tem um agendamento hoje: ${apt.services?.name} às ${formatTime(aptTime)}.`;
          
          sendNotification('Lembrete de Agendamento', message);
          updateNotified(apt.id, 'day');
        }

        // 2. Urgent alerts (20 minutes before, every 90 seconds)
        if (role === 'client' && diffMinutes <= 20 && diffMinutes > 0) {
          const lastUrgent = lastUrgentAlert[apt.id] || 0;
          const timeSinceLastUrgent = Date.now() - lastUrgent;

          if (timeSinceLastUrgent >= 90000) { // 90 seconds
            const message = `Urgente: Seu agendamento (${apt.services?.name}) começa em ${diffMinutes} minutos!`;
            sendNotification('Agendamento Próximo', message, true);
            setLastUrgentAlert(prev => ({ ...prev, [apt.id]: Date.now() }));
          }
        }

        // 3. Alert 30 minutes before (Standard)
        if (diffMinutes <= 30 && diffMinutes > 20 && !notified.includes('30min')) {
          const message = role === 'admin'
            ? `Em 30 min: ${apt.profiles?.full_name} - ${apt.services?.name}.`
            : `Faltam 30 minutos para seu serviço: ${apt.services?.name}.`;

          sendNotification('Agendamento Próximo', message);
          updateNotified(apt.id, '30min');
        }

        // 4. Expiration logic (Time over)
        if (role === 'client' && diffMinutes <= 0 && !notified.includes('expired')) {
          updateNotified(apt.id, 'expired');
          if (onAppointmentExpired) {
            onAppointmentExpired(apt);
          }
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

  const sendNotification = (title: string, body: string, playSound: boolean = false) => {
    // Browser Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: 'https://picsum.photos/seed/salon-icon-192/192/192'
      });
    }

    if (playSound) {
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log('Audio play blocked by browser policy', e));
      } catch (e) {
        console.error('Error playing notification sound:', e);
      }
    }

    // In-app Toast as fallback/extra
    toast(body, {
      icon: '🔔',
      duration: 10000, // Increased duration to 10 seconds
      style: {
        borderRadius: '16px',
        background: '#1c1917',
        color: '#fff',
      },
    });

    if (onNewNotification) {
      onNewNotification({
        id: Math.random().toString(36).substr(2, 9),
        title,
        message: body,
        timestamp: new Date(),
        type: 'info',
        read: false
      });
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return null; // This component doesn't render anything
}
