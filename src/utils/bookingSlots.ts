import { BookingAppointment } from '../types';

export interface AvailableSlot {
  time: string;
  period: 'manha' | 'tarde' | 'noite';
  available: boolean;
  blockedReason?: string;
}

export const getAvailableSlotsForDate = (
  dateIso: string,
  professional?: string,
  appointmentsList?: BookingAppointment[]
): AvailableSlot[] => {
  const baseSlots: AvailableSlot[] = [
    // Manhã
    { time: '09:00', period: 'manha', available: true },
    { time: '09:45', period: 'manha', available: true },
    { time: '10:30', period: 'manha', available: false },
    { time: '11:15', period: 'manha', available: true },
    // Tarde
    { time: '13:00', period: 'tarde', available: true },
    { time: '13:45', period: 'tarde', available: true },
    { time: '14:30', period: 'tarde', available: true },
    { time: '15:15', period: 'tarde', available: false },
    { time: '16:00', period: 'tarde', available: true },
    { time: '16:45', period: 'tarde', available: true },
    { time: '17:30', period: 'tarde', available: true },
    // Noite
    { time: '18:15', period: 'noite', available: true },
    { time: '19:00', period: 'noite', available: true },
    { time: '19:45', period: 'noite', available: false },
    { time: '20:30', period: 'noite', available: true },
  ];

  // Recupera agendamentos para cruzar bloqueios e horários ocupados
  let currentAppointments = appointmentsList;
  if (!currentAppointments && typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('vagou_salon_appointments');
      if (saved) currentAppointments = JSON.parse(saved);
    } catch {}
  }

  // Base com variação determinística padrão
  let computedSlots = baseSlots;
  if (dateIso) {
    const charCodeSum = dateIso.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    computedSlots = baseSlots.map((slot, idx) => ({
      ...slot,
      available: (charCodeSum + idx) % 5 !== 0,
    }));
  }

  // Se houver agendamentos salvos ou bloqueios manuais na data
  if (currentAppointments && currentAppointments.length > 0 && dateIso) {
    const formattedDate = dateIso.split('T')[0];
    
    return computedSlots.map((slot) => {
      // Procura por conflito de horário na data
      const conflict = currentAppointments!.find((app) => {
        const appDate = app.dateIso ? app.dateIso.split('T')[0] : '';
        const appTime = app.time || '';
        const status = (app.status || '').toUpperCase();

        const isCancelled = status === 'CANCELADO';
        if (isCancelled) return false;

        const isSameDate = appDate === formattedDate || (app.dateTime && app.dateTime.includes(formattedDate));
        const isSameTime = appTime === slot.time;

        if (!isSameDate || !isSameTime) return false;

        // Se for bloqueio geral ou para o mesmo profissional
        if (app.isBlockedSlot || status === 'BLOQUEADO') {
          if (!app.professional || !professional || app.professional === professional || app.professional === 'Todos') {
            return true;
          }
        }

        // Se for agendamento normal
        if (!professional || !app.professional || app.professional === professional) {
          return true;
        }

        return false;
      });

      if (conflict) {
        return {
          ...slot,
          available: false,
          blockedReason: conflict.isBlockedSlot ? (conflict.blockReason || 'Horário Bloqueado') : 'Horário Ocupado'
        };
      }

      return slot;
    });
  }

  return computedSlots;
};
