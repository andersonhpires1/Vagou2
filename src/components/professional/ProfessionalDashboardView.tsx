import React, { useState, useMemo, useCallback } from 'react';
import { 
  Store, Clock, CalendarCheck, DollarSign, Target, User, Zap, Check, Sparkles, Play, Pause, Plus, X,
  ArrowRightLeft, AlertCircle, ArrowLeft, Users
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { SalonAdminSettings, CatalogServiceItem, BookingAppointment, SalonProfessionalItem, UserPersona } from '../../types';
import { hapticLight, hapticSuccess, hapticMedium } from '../../utils/haptics';
import { DayEvolutionData } from './dashboard/ClientEvolutionChart';
import { CaixaDailyWeeklyCard } from './dashboard/CaixaDailyWeeklyCard';
import { GoalsAndShiftsCard } from './dashboard/GoalsAndShiftsCard';

const WORK_DAY_START_MINUTES = 8 * 60; // 08:00
const WORK_DAY_END_MINUTES = 20 * 60; // 20:00
const CHECKOUT_BUFFER_MINUTES = 15;

const parseTimeToMinutes = (timeStr?: string): number => {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return 0;
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
};

const formatMinutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const formatDurationDisplay = (durMinutes: number): string => {
  if (durMinutes <= 0) return '0m';
  const h = Math.floor(durMinutes / 60);
  const m = durMinutes % 60;
  if (h > 0 && m > 0) return `${h}h${m}m livres`;
  if (h > 0) return `${h}h livres`;
  return `${m}m livres`;
};

const getAppointmentDurationMinutes = (app: BookingAppointment): number => {
  if (typeof app.durationMinutes === 'number' && app.durationMinutes > 0) {
    return app.durationMinutes;
  }
  if (app.duration) {
    const matchMin = app.duration.match(/(\d+)\s*min/i);
    const matchHour = app.duration.match(/(\d+)\s*h/i);
    if (matchMin) return parseInt(matchMin[1], 10);
    if (matchHour) return parseInt(matchHour[1], 10) * 60;
    const numericOnly = parseInt(app.duration, 10);
    if (!isNaN(numericOnly) && numericOnly > 0) return numericOnly;
  }
  return 45;
};

const calculateAppointmentTimes = (app: BookingAppointment) => {
  const startTimeStr = app.time || '10:00';
  const [startH, startM] = startTimeStr.split(':').map((v) => parseInt(v, 10) || 0);
  const durationMinutes = getAppointmentDurationMinutes(app);
  const durHours = Math.floor(durationMinutes / 60);
  const durMins = durationMinutes % 60;
  const durationHhMm = `${String(durHours).padStart(2, '0')}:${String(durMins).padStart(2, '0')}`;

  const totalEndMins = (startH * 60 + startM + durationMinutes) % (24 * 60);
  const endH = Math.floor(totalEndMins / 60);
  const endM = totalEndMins % 60;
  const endTimeHhMm = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

  return { startTimeStr, durationMinutes, durationHhMm, endTimeHhMm };
};

export interface DashboardTeamMember {
  id: string;
  name: string;
  role: 'admin' | 'professional';
  roleLabel: string;
  commissionRate: number;
  avatar?: string;
}

const DEFAULT_TEAM_MEMBERS: DashboardTeamMember[] = [
  {
    id: 'carlos-henrique',
    name: 'Carlos Henrique',
    role: 'admin',
    roleLabel: 'Dono / Master Barber',
    commissionRate: 100,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'mateus-ramos',
    name: 'Mateus Ramos',
    role: 'professional',
    roleLabel: 'Barber & Visagista',
    commissionRate: 50,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'juliana-costa',
    name: 'Juliana Costa',
    role: 'professional',
    roleLabel: 'Especialista em Mechas',
    commissionRate: 60,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'diego-souza',
    name: 'Diego Souza',
    role: 'professional',
    roleLabel: 'Barber Stylist',
    commissionRate: 50,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
  }
];

export interface ProfessionalDashboardViewProps {
  adminSettings?: SalonAdminSettings;
  onUpdateSettings?: (settings: Partial<SalonAdminSettings>) => void;
  services?: CatalogServiceItem[];
  appointments?: BookingAppointment[];
  onUpdateAppointments?: (appointments: BookingAppointment[]) => void;
  professionals?: SalonProfessionalItem[];
  onNavigateTab?: (tab: 'home' | 'servicos' | 'vagas' | 'espaco' | 'equipe' | 'financeiro' | 'caixa' | 'personalizar' | 'utilidades') => void;
  onOpenNewService?: () => void;
  onOpenNewAppointment?: () => void;
  onLogout?: () => void;
  salonName?: string;
  currentUserName?: string;
  currentPersona?: UserPersona;
  isProAdmin?: boolean;
  activeProId?: string;
  onSelectActiveProId?: (id: string) => void;
  onRequestManage?: () => void;
}

export const ProfessionalDashboardView: React.FC<ProfessionalDashboardViewProps> = ({
  adminSettings,
  onUpdateSettings,
  services = [],
  appointments = [],
  onUpdateAppointments,
  professionals = [],
  onNavigateTab,
  onOpenNewService,
  onOpenNewAppointment,
  onLogout,
  salonName = 'Barbearia Rota 99',
  currentUserName,
  currentPersona = 'admin',
  isProAdmin,
  activeProId,
  onSelectActiveProId,
  onRequestManage,
}) => {
  const { isDark } = useTheme();

  // Lista consolidada de membros da equipe com taxas de comissão
  const teamList = useMemo<DashboardTeamMember[]>(() => {
    try {
      const saved = localStorage.getItem('vagou_salon_team_members') || localStorage.getItem('vagou_team_members');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((m: any, idx: number) => ({
            id: m.id || `pro-${idx}`,
            name: m.name || `Profissional ${idx + 1}`,
            role: m.role === 'admin' ? 'admin' : 'professional',
            roleLabel: m.role === 'admin' ? 'Dono / Gerente' : (m.specialties?.join(', ') || 'Profissional da Equipe'),
            commissionRate: typeof m.commissionRate === 'number' ? m.commissionRate : (m.role === 'admin' ? 100 : 50),
            avatar: m.avatarUrl || m.avatar || DEFAULT_TEAM_MEMBERS[idx % DEFAULT_TEAM_MEMBERS.length]?.avatar,
          }));
        }
      }
    } catch {}

    if (professionals && professionals.length > 0) {
      return professionals.map((p, idx) => {
        const isCarlos = p.name.includes('Carlos');
        const defaultMatch = DEFAULT_TEAM_MEMBERS.find(d => d.name.toLowerCase() === p.name.toLowerCase());
        return {
          id: p.id || `pro-${idx}`,
          name: p.name,
          role: isCarlos ? 'admin' : 'professional',
          roleLabel: p.role || (isCarlos ? 'Dono / Master Barber' : 'Profissional da Equipe'),
          commissionRate: defaultMatch?.commissionRate ?? (isCarlos ? 100 : 50),
          avatar: p.avatar || p.avatarUrl,
        };
      });
    }

    return DEFAULT_TEAM_MEMBERS;
  }, [professionals]);

  // Papel do usuário logado: 'admin' (Dono) ou 'professional' (Colaborador)
  const [userRole, setUserRole] = useState<'admin' | 'professional'>(() => {
    try {
      const saved = localStorage.getItem('vagou_dashboard_user_role');
      if (saved === 'admin' || saved === 'professional') return saved;
    } catch {}
    return 'admin';
  });

  // Nome do profissional que está logado atualmente
  const [loggedProfessionalName, setLoggedProfessionalName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('vagou_dashboard_logged_pro_name');
      if (saved) return saved;
    } catch {}
    return 'Carlos Henrique';
  });

  // Filtro ativo de visualização no Dashboard: 'all' (Todo o Salão) ou nome do profissional
  const [selectedFilterPro, setSelectedFilterPro] = useState<string>(() => {
    try {
      const savedRole = localStorage.getItem('vagou_dashboard_user_role');
      const savedPro = localStorage.getItem('vagou_dashboard_selected_pro');
      if (savedRole === 'professional') {
        return localStorage.getItem('vagou_dashboard_logged_pro_name') || 'Mateus Ramos';
      }
      if (savedPro) return savedPro;
    } catch {}
    return 'all';
  });

  const effectiveIsAdmin = typeof isProAdmin === 'boolean'
    ? isProAdmin
    : (userRole === 'admin' || currentPersona === 'admin');

  const isOpen = adminSettings?.isOpenNow ?? true;

  const handleToggleOpen = () => {
    hapticLight();
    if (onUpdateSettings) {
      onUpdateSettings({ isOpenNow: !isOpen });
    }
  };

  // Estados de Filtro para os Atendimentos do Painel
  const [timeFilter, setTimeFilter] = useState<'proximo' | 'hoje' | 'semana' | 'mes'>('proximo');

  // Mapa local de status do atendimento (Ex: 'EM ANDAMENTO' ou 'CONCLUÍDO')
  const [localAppointmentStatuses, setLocalAppointmentStatuses] = useState<Record<string, string>>({});

  const handleUpdateAppointmentStatus = useCallback((appKey: string, newStatus: string) => {
    hapticLight();
    setLocalAppointmentStatuses((prev) => ({
      ...prev,
      [appKey]: newStatus,
    }));
  }, []);

  // Meta Mensal configurada pelo profissional (persistida no localStorage)
  const [targetAmount, setTargetAmount] = useState<number>(() => {
    try {
      const s = localStorage.getItem('vagou_monthly_goal');
      if (s) {
        const val = Number(s);
        if (val > 0) return val;
      }
    } catch {}
    return 3500;
  });

  const handleUpdateTarget = useCallback((newTarget: number) => {
    setTargetAmount(newTarget);
    try {
      localStorage.setItem('vagou_monthly_goal', String(newTarget));
    } catch {}
  }, []);

  // Função utilitária para verificar se um agendamento pertence ao profissional filtrado
  const matchesSelectedPro = useCallback((app: BookingAppointment) => {
    if (selectedFilterPro === 'all') return true;
    const appPro = (app.professionalName || app.professional || '').trim().toLowerCase();
    const target = selectedFilterPro.trim().toLowerCase();
    if (!appPro) return false;
    return appPro.includes(target) || target.includes(appPro);
  }, [selectedFilterPro]);

  // Contagem para Badges das categorias no período selecionado
  const categoryCounts = React.useMemo(() => {
    const counts = {
      concluidos: 0,
      confirmados: 0,
      pendentes: 0,
      cancelados: 0,
    };

    appointments.forEach((app) => {
      // Filtragem por Profissional Ativo
      if (!matchesSelectedPro(app)) return;

      let appDate = new Date();
      if (app.dateIso) {
        appDate = new Date(app.dateIso + 'T00:00:00');
      } else {
        const match = app.dateTime?.match(/(\d{2})\/(\d{2})/);
        if (match) {
          const day = parseInt(match[1], 10);
          const month = parseInt(match[2], 10) - 1;
          const year = new Date().getFullYear();
          appDate = new Date(year, month, day);
        } else if (app.dayGroup === 'Hoje' || app.dateTime?.includes('Hoje')) {
          appDate = new Date();
        }
      }

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      let matchesTime = true;
      if (timeFilter === 'hoje') {
        matchesTime = appDate >= todayStart && appDate <= todayEnd;
      } else if (timeFilter === 'proximo') {
        matchesTime = appDate >= todayStart;
      } else if (timeFilter === 'semana') {
        const sunday = new Date(todayStart);
        sunday.setDate(todayStart.getDate() - todayStart.getDay());
        const saturday = new Date(sunday);
        saturday.setDate(sunday.getDate() + 6);
        saturday.setHours(23, 59, 59, 999);
        matchesTime = appDate >= sunday && appDate <= saturday;
      } else if (timeFilter === 'mes') {
        matchesTime = appDate.getMonth() === now.getMonth() && appDate.getFullYear() === now.getFullYear();
      }

      if (matchesTime) {
        const st = (app.status || '').toUpperCase();
        if (st === 'CONCLUÍDO' || st === 'CONCLUIDO') {
          counts.concluidos++;
        } else if (st === 'CONFIRMADO' || st === 'AGENDADO') {
          counts.confirmados++;
        } else if (st === 'PENDENTE' || st === 'ALTERADO') {
          counts.pendentes++;
        } else if (st === 'CANCELADO') {
          counts.cancelados++;
        }
      }
    });

    return counts;
  }, [appointments, timeFilter, matchesSelectedPro]);

  // Atendimento iniciado e em andamento no momento (se houver)
  const inProgressAppointment = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    return appointments.find((app) => {
      if (!matchesSelectedPro(app)) return false;
      const appKey = app.protocolCode || app.id || `${app.time}-${app.clientName}`;
      const effectiveStatus = localAppointmentStatuses[appKey] || app.status || '';
      const st = effectiveStatus.toUpperCase();
      if (!st.includes('ATEND') && !st.includes('INICI')) return false;

      let appDate = new Date();
      if (app.dateIso) {
        appDate = new Date(app.dateIso + 'T00:00:00');
      } else {
        const match = app.dateTime?.match(/(\d{2})\/(\d{2})/);
        if (match) {
          const day = parseInt(match[1], 10);
          const month = parseInt(match[2], 10) - 1;
          const year = new Date().getFullYear();
          appDate = new Date(year, month, day);
        } else if (app.dayGroup === 'Hoje' || app.dateTime?.includes('Hoje')) {
          appDate = new Date();
        }
      }
      return appDate >= todayStart && appDate <= todayEnd;
    }) || null;
  }, [appointments, matchesSelectedPro, localAppointmentStatuses]);

  // Próximo atendimento do dia para o profissional ativo (excluindo os já iniciados)
  const nextAppointment = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const upcoming = appointments.filter((app) => {
      if (!matchesSelectedPro(app)) return false;
      const appKey = app.protocolCode || app.id || `${app.time}-${app.clientName}`;
      const effectiveStatus = localAppointmentStatuses[appKey] || app.status || '';
      const st = effectiveStatus.toUpperCase();
      if (st === 'CANCELADO' || st === 'CONCLUÍDO' || st === 'CONCLUIDO' || st.includes('ATEND') || st.includes('INICI')) return false;

      let appDate = new Date();
      if (app.dateIso) {
        appDate = new Date(app.dateIso + 'T00:00:00');
      } else {
        const match = app.dateTime?.match(/(\d{2})\/(\d{2})/);
        if (match) {
          const day = parseInt(match[1], 10);
          const month = parseInt(match[2], 10) - 1;
          const year = new Date().getFullYear();
          appDate = new Date(year, month, day);
        }
      }
      return appDate >= todayStart && appDate <= todayEnd;
    });

    return upcoming.sort((a, b) => (a.time || '').localeCompare(b.time || ''))[0] || null;
  }, [appointments, matchesSelectedPro, localAppointmentStatuses]);

  // Ação de iniciar atendimento do próximo cliente
  const handleStartAppointment = useCallback((protocolCode?: string) => {
    if (!protocolCode) return;
    hapticSuccess();
    setLocalAppointmentStatuses((prev) => ({
      ...prev,
      [protocolCode]: 'EM ATENDIMENTO'
    }));

    if (onUpdateAppointments && appointments.length > 0) {
      const updated = appointments.map((a) => {
        if (a.protocolCode === protocolCode) {
          return { ...a, status: 'EM ATENDIMENTO' };
        }
        return a;
      });
      onUpdateAppointments(updated);
      try {
        localStorage.setItem('vagou_salon_appointments', JSON.stringify(updated));
      } catch {}
    }
  }, [appointments, onUpdateAppointments]);

  // Ação de finalizar atendimento em andamento
  const handleCompleteAppointment = useCallback((protocolCode?: string) => {
    if (!protocolCode) return;
    hapticSuccess();
    setLocalAppointmentStatuses((prev) => ({
      ...prev,
      [protocolCode]: 'CONCLUÍDO'
    }));

    if (onUpdateAppointments && appointments.length > 0) {
      const updated = appointments.map((a) => {
        if (a.protocolCode === protocolCode) {
          return { ...a, status: 'CONCLUÍDO' };
        }
        return a;
      });
      onUpdateAppointments(updated);
      try {
        localStorage.setItem('vagou_salon_appointments', JSON.stringify(updated));
      } catch {}
    }
  }, [appointments, onUpdateAppointments]);

  // Estados para o Modal Operacional de Atendimento (Iniciar, Pausar, Adicionar Mais Tempo, Concluir, Transferir)
  const [actionModalAppointment, setActionModalAppointment] = useState<BookingAppointment | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [timeExtensionFeedback, setTimeExtensionFeedback] = useState<string | null>(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferSuccessMessage, setTransferSuccessMessage] = useState<string | null>(null);

  // Fila ativa de hoje para o profissional ativo (excluindo concluídos e cancelados)
  const todayActiveAppointments = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const activeList = appointments.filter((app) => {
      if (!matchesSelectedPro(app)) return false;
      const appKey = app.protocolCode || app.id || `${app.time}-${app.clientName}`;
      const effectiveStatus = localAppointmentStatuses[appKey] || app.status || '';
      const st = effectiveStatus.toUpperCase();
      if (st === 'CANCELADO' || st === 'CONCLUÍDO' || st === 'CONCLUIDO') return false;

      let appDate = new Date();
      if (app.dateIso) {
        appDate = new Date(app.dateIso + 'T00:00:00');
      } else {
        const match = app.dateTime?.match(/(\d{2})\/(\d{2})/);
        if (match) {
          const day = parseInt(match[1], 10);
          const month = parseInt(match[2], 10) - 1;
          const year = new Date().getFullYear();
          appDate = new Date(year, month, day);
        } else if (app.dayGroup === 'Hoje' || app.dateTime?.includes('Hoje')) {
          appDate = new Date();
        }
      }
      return appDate >= todayStart && appDate <= todayEnd;
    });

    // Ordenação: 1º em atendimento / pausado, depois por horário ascendente
    return activeList.sort((a, b) => {
      const keyA = a.protocolCode || a.id || `${a.time}-${a.clientName}`;
      const keyB = b.protocolCode || b.id || `${b.time}-${b.clientName}`;
      const stA = (localAppointmentStatuses[keyA] || a.status || '').toUpperCase();
      const stB = (localAppointmentStatuses[keyB] || b.status || '').toUpperCase();
      const isProgA = stA.includes('ATEND') || stA.includes('INICI') || stA.includes('PAUS');
      const isProgB = stB.includes('ATEND') || stB.includes('INICI') || stB.includes('PAUS');

      if (isProgA && !isProgB) return -1;
      if (!isProgA && isProgB) return 1;

      return (a.time || '').localeCompare(b.time || '');
    });
  }, [appointments, matchesSelectedPro, localAppointmentStatuses]);

  const firstCardAppointment = todayActiveAppointments[0] || null;
  const secondCardAppointment = todayActiveAppointments[1] || null;

  // Trava Operacional de Mitigação: O próximo atendimento não pode ser iniciado sem a conclusão ou definição do anterior
  const isModalBlockedByPrevious = useMemo(() => {
    if (!actionModalAppointment || !firstCardAppointment) return false;
    const modalKey = actionModalAppointment.protocolCode || actionModalAppointment.id || `${actionModalAppointment.time}-${actionModalAppointment.clientName}`;
    const firstKey = firstCardAppointment.protocolCode || firstCardAppointment.id || `${firstCardAppointment.time}-${firstCardAppointment.clientName}`;

    // Se o agendamento no modal for o segundo (ou posterior ao primeiro), verifica se o primeiro ainda está ativo
    if (modalKey !== firstKey) {
      const firstStatus = (localAppointmentStatuses[firstKey] || firstCardAppointment.status || '').toUpperCase();
      const isFirstFinished = firstStatus.includes('CONCLU') || firstStatus.includes('CANCEL');
      return !isFirstFinished;
    }
    return false;
  }, [actionModalAppointment, firstCardAppointment, localAppointmentStatuses]);

  // Colegas da equipe disponíveis para transferência (excluindo o profissional atual)
  const availableColleaguesForTransfer = useMemo(() => {
    const currentProName = (activeProId || selectedFilterPro || currentUserName || '').trim().toLowerCase();
    const list = teamList.filter((m) => {
      const mName = m.name.trim().toLowerCase();
      const mId = m.id.trim().toLowerCase();
      if (mName === currentProName || mId === currentProName) return false;
      if (selectedFilterPro !== 'all' && (mName.includes(selectedFilterPro.toLowerCase()) || selectedFilterPro.toLowerCase().includes(mName))) {
        return false;
      }
      return true;
    });
    if (list.length > 0) return list;
    return DEFAULT_TEAM_MEMBERS.filter((m) => m.name.toLowerCase() !== currentProName);
  }, [teamList, activeProId, selectedFilterPro, currentUserName]);

  // Abertura do Modal de Operações do Atendimento
  const handleOpenActionModal = useCallback((app: BookingAppointment) => {
    hapticLight();
    const appKey = app.protocolCode || app.id || `${app.time}-${app.clientName}`;
    const effectiveStatus = localAppointmentStatuses[appKey] || app.status || 'CONFIRMADO';
    setActionModalAppointment({ ...app, status: effectiveStatus });
    setTimeExtensionFeedback(null);
    setIsTransferOpen(false);
    setTransferSuccessMessage(null);
    setIsActionModalOpen(true);
  }, [localAppointmentStatuses]);

  // Transferência / Repasse de Atendimento para outro profissional do mesmo estabelecimento (Apenas se NÃO iniciado)
  const handleTransferAppointment = useCallback((targetPro: DashboardTeamMember) => {
    if (!actionModalAppointment) return;
    const appKey = actionModalAppointment.protocolCode || actionModalAppointment.id || `${actionModalAppointment.time}-${actionModalAppointment.clientName}`;
    const effectiveStatus = (localAppointmentStatuses[appKey] || actionModalAppointment.status || '').toUpperCase();
    
    // Trava lógica estrita: atendimento já iniciado não pode ser transferido
    if (effectiveStatus.includes('ATEND') || effectiveStatus.includes('INICI')) {
      return;
    }

    hapticSuccess();

    const updatedList = appointments.map((a) => {
      const k = a.protocolCode || a.id || `${a.time}-${a.clientName}`;
      if (k === appKey) {
        return {
          ...a,
          professional: targetPro.name,
          professionalName: targetPro.name,
          professionalId: targetPro.id,
        };
      }
      return a;
    });

    if (onUpdateAppointments) {
      onUpdateAppointments(updatedList);
    }
    try {
      localStorage.setItem('vagou_salon_appointments', JSON.stringify(updatedList));
    } catch {}

    setTransferSuccessMessage(`Atendimento transferido para ${targetPro.name}!`);
    setTimeout(() => {
      setTransferSuccessMessage(null);
      setIsTransferOpen(false);
      setIsActionModalOpen(false);
      setActionModalAppointment(null);
    }, 1200);
  }, [actionModalAppointment, appointments, onUpdateAppointments]);

  // Ações do Modal de Atendimento: Iniciar / Retomar, Pausar, Adicionar Tempo, Concluir
  const handleStartFromModal = useCallback(() => {
    if (!actionModalAppointment || isModalBlockedByPrevious) return;
    const protocolCode = actionModalAppointment.protocolCode || actionModalAppointment.id;
    handleStartAppointment(protocolCode);
    setActionModalAppointment((prev) => prev ? { ...prev, status: 'EM ATENDIMENTO' } : null);
  }, [actionModalAppointment, isModalBlockedByPrevious, handleStartAppointment]);

  const handlePauseFromModal = useCallback(() => {
    if (!actionModalAppointment) return;
    hapticMedium();
    const appKey = actionModalAppointment.protocolCode || actionModalAppointment.id || `${actionModalAppointment.time}-${actionModalAppointment.clientName}`;
    const currentSt = (localAppointmentStatuses[appKey] || actionModalAppointment.status || '').toUpperCase();
    const newSt = currentSt === 'PAUSADO' ? 'EM ATENDIMENTO' : 'PAUSADO';

    setLocalAppointmentStatuses((prev) => ({
      ...prev,
      [appKey]: newSt
    }));

    const updatedApp = { ...actionModalAppointment, status: newSt };
    setActionModalAppointment(updatedApp);

    if (onUpdateAppointments && appointments.length > 0) {
      const updatedList = appointments.map((a) => {
        const k = a.protocolCode || a.id || `${a.time}-${a.clientName}`;
        if (k === appKey) {
          return { ...a, status: newSt };
        }
        return a;
      });
      onUpdateAppointments(updatedList);
      try {
        localStorage.setItem('vagou_salon_appointments', JSON.stringify(updatedList));
      } catch {}
    }
  }, [actionModalAppointment, localAppointmentStatuses, onUpdateAppointments, appointments]);

  const handleAddMoreTime = useCallback((additionalMinutes: number) => {
    if (!actionModalAppointment) return;
    hapticLight();
    const currentDur = getAppointmentDurationMinutes(actionModalAppointment);
    const newDur = currentDur + additionalMinutes;
    const newDurText = newDur >= 60 
      ? `${Math.floor(newDur / 60)}h${newDur % 60 > 0 ? (newDur % 60) + 'min' : ''}`
      : `${newDur} min`;

    const appKey = actionModalAppointment.protocolCode || actionModalAppointment.id || `${actionModalAppointment.time}-${actionModalAppointment.clientName}`;
    
    const updatedApp: BookingAppointment = {
      ...actionModalAppointment,
      duration: newDurText,
      durationMinutes: newDur,
    };
    setActionModalAppointment(updatedApp);

    const { endTimeHhMm } = calculateAppointmentTimes(updatedApp);
    setTimeExtensionFeedback(`+${additionalMinutes} min adicionados (término previsto às ${endTimeHhMm})`);

    if (onUpdateAppointments && appointments.length > 0) {
      const updatedList = appointments.map((a) => {
        const k = a.protocolCode || a.id || `${a.time}-${a.clientName}`;
        if (k === appKey) {
          return updatedApp;
        }
        return a;
      });
      onUpdateAppointments(updatedList);
      try {
        localStorage.setItem('vagou_salon_appointments', JSON.stringify(updatedList));
      } catch {}
    }
  }, [actionModalAppointment, onUpdateAppointments, appointments]);

  const handleCompleteFromModal = useCallback(() => {
    if (!actionModalAppointment) return;
    const protocolCode = actionModalAppointment.protocolCode || actionModalAppointment.id;
    handleCompleteAppointment(protocolCode);
    setIsActionModalOpen(false);
    setActionModalAppointment(null);
  }, [actionModalAppointment, handleCompleteAppointment]);

  // Régua de Próximas Vagas Livres da Cadeira (Acesso Rápido para Encaixe - Seção Inicial)
  const freeSlotsSummary = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const todayApps = appointments.filter((app) => {
      if (!matchesSelectedPro(app)) return false;
      const st = (app.status || '').toUpperCase();
      if (st === 'CANCELADO') return false;

      let appDate = new Date();
      if (app.dateIso) {
        appDate = new Date(app.dateIso + 'T00:00:00');
      } else {
        const match = app.dateTime?.match(/(\d{2})\/(\d{2})/);
        if (match) {
          const day = parseInt(match[1], 10);
          const month = parseInt(match[2], 10) - 1;
          const year = new Date().getFullYear();
          appDate = new Date(year, month, day);
        } else if (app.dayGroup === 'Hoje' || app.dateTime?.includes('Hoje')) {
          appDate = new Date();
        }
      }
      return appDate >= todayStart && appDate <= todayEnd;
    });

    const validApps = todayApps
      .map((app) => {
        const startMin = parseTimeToMinutes(app.time || '09:00');
        const durationMin = typeof app.durationMinutes === 'number' && app.durationMinutes > 0
          ? app.durationMinutes
          : 45;
        const endMin = startMin + durationMin;
        const chairFreeMin = endMin + CHECKOUT_BUFFER_MINUTES;
        return {
          app,
          startMinutes: startMin,
          endMinutes: endMin,
          chairFreeMinutes: chairFreeMin,
        };
      })
      .sort((a, b) => a.startMinutes - b.startMinutes);

    const slots: Array<{ time: string; durationText: string; durationMinutes: number }> = [];
    let currentCursor = WORK_DAY_START_MINUTES;

    validApps.forEach((item) => {
      if (item.startMinutes > currentCursor) {
        const gapMinutes = item.startMinutes - currentCursor;
        if (gapMinutes >= 15) {
          const slotStart = formatMinutesToTime(currentCursor);
          const durText = formatDurationDisplay(gapMinutes);
          slots.push({
            time: slotStart,
            durationText: durText,
            durationMinutes: gapMinutes,
          });
        }
      }
      currentCursor = Math.max(currentCursor, item.chairFreeMinutes);
    });

    if (currentCursor < WORK_DAY_END_MINUTES) {
      const remainingMinutes = WORK_DAY_END_MINUTES - currentCursor;
      if (remainingMinutes >= 15) {
        const slotStart = formatMinutesToTime(currentCursor);
        const durText = formatDurationDisplay(remainingMinutes);
        slots.push({
          time: slotStart,
          durationText: durText,
          durationMinutes: remainingMinutes,
        });
      }
    }

    return slots;
  }, [appointments, matchesSelectedPro]);

  // Ação de clique no horário vago da Seção Inicial
  const handleSlotClick = useCallback((slotTime: string) => {
    hapticLight();
    try {
      localStorage.setItem('vagou_pending_schedule_time', slotTime);
      localStorage.setItem('vagou_pending_open_schedule', 'true');
    } catch {}
    if (onNavigateTab) {
      onNavigateTab('vagas');
    } else if (onOpenNewAppointment) {
      onOpenNewAppointment();
    }
  }, [onNavigateTab, onOpenNewAppointment]);

  // 1. Resumo Financeiro Rápido (Linguagem Direta: Caixa, Previsão, Ticket Médio e Líquido)
  const financialQuickSummary = useMemo(() => {
    let realizedRevenue = 0;
    let completedCount = 0;
    let forecastRevenue = 0;
    let pendingCount = 0;

    appointments.forEach((app) => {
      if (!matchesSelectedPro(app)) return;
      const val = Number(app.totalPrice) || 45;
      const st = (app.status || '').toUpperCase();
      if (st === 'CONCLUÍDO' || st === 'CONCLUIDO') {
        realizedRevenue += val;
        completedCount += 1;
      } else if (st !== 'CANCELADO') {
        forecastRevenue += val;
        pendingCount += 1;
      }
    });

    if (completedCount === 0) {
      realizedRevenue = 2720;
      completedCount = 48;
    }
    if (forecastRevenue === 0) {
      forecastRevenue = 450;
      pendingCount = 8;
    }

    const averageTicket = completedCount > 0 ? realizedRevenue / completedCount : 55;
    const isOwner = userRole === 'admin' || currentPersona === 'admin';
    const activeMember = teamList.find(m => m.name === loggedProfessionalName);
    const commissionRate = isOwner ? 100 : (activeMember?.commissionRate ?? 60);
    const netProfitOrCommission = (realizedRevenue * commissionRate) / 100;

    return {
      realizedRevenue,
      completedCount,
      forecastRevenue,
      pendingCount,
      averageTicket,
      netProfitOrCommission,
      isOwner,
    };
  }, [appointments, matchesSelectedPro, userRole, currentPersona, teamList, loggedProfessionalName]);

  // 2. Gráfico de Evolução de Clientes nos Últimos 7 Dias
  const weekEvolutionData = useMemo<DayEvolutionData[]>(() => {
    const days: DayEvolutionData[] = [];
    const now = new Date();
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

      let count = 0;
      let rev = 0;

      appointments.forEach((app) => {
        if (!matchesSelectedPro(app)) return;
        let appDate = new Date();
        if (app.dateIso) {
          appDate = new Date(app.dateIso + 'T00:00:00');
        } else {
          const match = app.dateTime?.match(/(\d{2})\/(\d{2})/);
          if (match) {
            const day = parseInt(match[1], 10);
            const month = parseInt(match[2], 10) - 1;
            const year = new Date().getFullYear();
            appDate = new Date(year, month, day);
          } else if (app.dayGroup === 'Hoje' || app.dateTime?.includes('Hoje')) {
            appDate = new Date();
          }
        }

        if (appDate >= dayStart && appDate <= dayEnd) {
          const st = (app.status || '').toUpperCase();
          if (st !== 'CANCELADO') {
            count += 1;
            rev += Number(app.totalPrice) || 50;
          }
        }
      });

      if (count === 0 && i > 0) {
        const simCounts = [5, 8, 11, 7, 12, 14, 6];
        count = simCounts[(d.getDay() + 6) % 7];
        rev = count * 55;
      }

      days.push({
        dayLabel: i === 0 ? 'Hoje' : dayNames[d.getDay()],
        dateStr: `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`,
        clientsCount: count,
        totalRevenue: rev,
      });
    }
    return days;
  }, [appointments, matchesSelectedPro]);

  // Valores de Faturamento Diário e Semanal para o Velocímetro de Metas
  const dailyRealizedRevenue = useMemo(() => {
    const today = weekEvolutionData[weekEvolutionData.length - 1];
    return today && today.totalRevenue > 0 ? today.totalRevenue : 165;
  }, [weekEvolutionData]);

  const weeklyRealizedRevenue = useMemo(() => {
    const sum = weekEvolutionData.reduce((acc, d) => acc + d.totalRevenue, 0);
    return sum > 0 ? sum : 980;
  }, [weekEvolutionData]);

  const renderAppointmentButtonCard = (app: BookingAppointment, cardIndex: number) => {
    const appKey = app.protocolCode || app.id || `${app.time}-${app.clientName}`;
    const effectiveStatus = (localAppointmentStatuses[appKey] || app.status || '').toUpperCase();
    const isProgress = effectiveStatus.includes('ATEND') || effectiveStatus.includes('INICI');
    const isPaused = effectiveStatus.includes('PAUS');

    const rawFullName = (app.clientName || app.customerName || 'Cliente').trim();
    const firstName = rawFullName.split(' ')[0] || 'Cliente';
    const serviceText = app.serviceName || app.service || app.serviceTitle || 'Atendimento';

    const { startTimeStr, durationHhMm, endTimeHhMm } = calculateAppointmentTimes(app);

    return (
      <button
        key={appKey}
        id={cardIndex === 1 ? 'professional-next-appointment-card' : 'professional-subsequent-appointment-card'}
        type="button"
        onClick={() => handleOpenActionModal(app)}
        style={{ height: '65px' }}
        title={`Clique para gerenciar atendimento de ${rawFullName}`}
        className={`grid grid-cols-[0.8fr_0.8fr_1.2fr_1.2fr] rounded-lg border overflow-hidden select-none w-full text-left cursor-pointer active:scale-[0.99] transition hover:shadow-md ${
          isDark 
            ? isProgress 
              ? 'bg-slate-900 border-emerald-500/80 text-white ring-1 ring-emerald-500/50' 
              : 'bg-slate-900 border-slate-800 text-white' 
            : isProgress 
              ? 'bg-white border-emerald-500 text-slate-900 shadow-xs ring-1 ring-emerald-400' 
              : 'bg-white border-slate-200 text-slate-900 shadow-xs'
        }`}
      >
        {/* Coluna 1: Horário em destaque grande (-20% de largura) */}
        <div 
          className="flex flex-col items-center justify-center text-center p-0.5 border-r overflow-hidden relative"
          style={{ 
            backgroundColor: cardIndex === 1 ? '#00ff29' : (isProgress ? '#20C933' : '#ffea00'), 
            borderColor: cardIndex === 1 ? '#00df24' : (isProgress ? '#18a82a' : '#f3ff00') 
          }}
        >
          {isProgress && (
            <span className="text-[7.5px] font-black uppercase text-white tracking-widest leading-none mb-0.5 flex items-center gap-0.5">
              <Zap className="w-2 h-2 text-white fill-white animate-pulse" />
              <span>Agora</span>
            </span>
          )}
          {isPaused && (
            <span className={`text-[7.5px] font-black uppercase tracking-widest leading-none mb-0.5 ${
              cardIndex === 1 ? 'text-white' : 'text-slate-950'
            }`}>
              Pausa
            </span>
          )}
          <span 
            className="font-mono font-black tracking-tight leading-none"
            style={{ 
              fontSize: '18px', 
              color: cardIndex === 1 ? '#252525' : (isProgress ? '#ffffff' : '#121212') 
            }}
          >
            {startTimeStr}
          </span>
        </div>

        {/* Coluna 2: Foto do cliente sobre primeiro nome (-20% de largura) */}
        <div className={`flex flex-col h-full w-full p-0 border-r overflow-hidden ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <div className={`h-[70%] w-full flex items-center justify-center p-0.5 border-b ${
            isDark ? 'bg-slate-800/80 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
          }`}>
            <div 
              className={`w-[95%] h-[95%] max-w-[40px] max-h-[40px] aspect-square rounded flex items-center justify-center font-bold text-xs shrink-0 shadow-xs overflow-hidden ${
                isDark ? 'bg-slate-900/90 text-slate-300 ring-1 ring-slate-700/80' : 'bg-white text-slate-700 ring-1 ring-slate-300'
              }`}
            >
              <User className="w-[65%] h-[65%] stroke-[1.75]" />
            </div>
          </div>
          <div className={`h-[30%] w-full flex items-center justify-center px-0.5 ${
            isDark ? 'bg-slate-900/60' : 'bg-white'
          }`}>
            <span className={`font-bold truncate max-w-full text-[9px] leading-tight text-center ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}>
              {firstName}
            </span>
          </div>
        </div>

        {/* Coluna 3: Descrição do serviço com quebra de texto */}
        <div className={`flex items-center justify-center text-center px-1.5 py-0.5 border-r overflow-hidden ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <p className={`text-[10px] font-bold text-center leading-snug whitespace-normal break-words line-clamp-3 ${
            isDark ? 'text-slate-200' : 'text-slate-800'
          }`}>
            {serviceText}
          </p>
        </div>

        {/* Coluna 4: Tempo estimado de duração (HH:MM) sobre Horário de término (HH:MM) */}
        <div className="flex flex-col h-full w-full p-0 overflow-hidden">
          {/* Top: Duração estimada (apenas HH:MM) */}
          <div 
            style={{ backgroundColor: '#315195' }}
            className="flex-1 w-full flex items-center justify-center border-b px-1 text-white border-slate-700/60"
          >
            <span className="font-mono text-[11px] font-bold tracking-tight text-white">
              {durationHhMm}
            </span>
          </div>

          {/* Bottom: Horário de término do serviço (HH:MM) */}
          <div 
            style={{ backgroundColor: '#1c283e' }}
            className="flex-1 w-full flex items-center justify-center px-1 text-white font-mono text-[11px] font-black tracking-tight"
          >
            <span>{endTimeHhMm}</span>
          </div>
        </div>
      </button>
    );
  };

  const renderEmptyAppointmentCard = (cardIndex: number) => {
    if (cardIndex === 1) {
      return (
        <div 
          id="professional-next-appointment-card"
          style={{ height: '65px' }}
          className={`p-2 rounded-lg border flex flex-col items-center justify-center select-none w-full text-center ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 shadow-xs text-slate-900'
          }`}
        >
          <Clock className={`w-4 h-4 mb-0.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
          <p className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Próximo Atendimento
          </p>
          <p className={`text-[9px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Sem atendimento agendado no momento
          </p>
        </div>
      );
    }

    return (
      <div 
        id="professional-subsequent-appointment-card-empty"
        style={{ height: '65px' }}
        className={`p-2 rounded-lg border border-dashed flex items-center justify-center gap-2 select-none w-full text-center ${
          isDark ? 'bg-slate-900/40 border-slate-800/80 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'
        }`}
      >
        <Clock className="w-3.5 h-3.5 opacity-60" />
        <span className="text-[10.5px] font-medium">Sem agendamento subsequente na fila</span>
      </div>
    );
  };

  return (
    <div className={`w-full h-full flex flex-col justify-between overflow-y-auto ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* 1. Cabeçalho de Status Operacional */}
      <div className={`p-3.5 border-b shrink-0 flex items-center justify-between ${
        isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
            isDark
              ? 'bg-emerald-500/20 border-emerald-500/40 text-white'
              : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600'
          }`}>
            <Store className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-bold truncate leading-tight font-['Poppins']">
              {salonName}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-rose-500'}`} />
              <select
                id="dashboard-pro-switcher"
                value={activeProId || teamList.find(m => m.name === loggedProfessionalName)?.id || teamList[0]?.id}
                onChange={(e) => {
                  const targetId = e.target.value;
                  onSelectActiveProId?.(targetId);
                  const selectedMember = teamList.find(m => m.id === targetId);
                  if (selectedMember) {
                    setUserRole(selectedMember.role);
                    setLoggedProfessionalName(selectedMember.name);
                    try {
                      localStorage.setItem('vagou_dashboard_user_role', selectedMember.role);
                      localStorage.setItem('vagou_dashboard_logged_pro_name', selectedMember.name);
                      localStorage.setItem('vagou_active_pro_id', selectedMember.id);
                    } catch {}
                  }
                }}
                className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border appearance-none cursor-pointer outline-hidden transition ${
                  effectiveIsAdmin 
                    ? isDark
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                      : 'bg-amber-500/15 border-amber-500/40 text-amber-950'
                    : isDark
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-950'
                }`}
                title="Alternar profissional ativo para teste de perfil"
              >
                {teamList.map((m) => (
                  <option key={m.id} value={m.id} className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                    {m.name} ({m.role === 'admin' ? 'Admin' : 'Membro'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleToggleOpen}
            className={`px-2.5 py-1.5 rounded text-[10px] font-extrabold uppercase tracking-wider transition cursor-pointer border ${
              isOpen 
                ? isDark
                  ? 'bg-emerald-500/25 border-emerald-500/50 text-white hover:bg-emerald-500/35'
                  : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-950 hover:bg-emerald-500/30' 
                : isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  : 'bg-slate-100 border-slate-300 text-slate-900 hover:bg-slate-200'
            }`}
          >
            {isOpen ? 'Pausar' : 'Abrir'}
          </button>
        </div>
      </div>

      {/* 2. Conteúdo Rolável: Fila & Agenda seguido de Dashboard & Metas */}
      <div className="p-2 flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto">
        {/* Bloco de Atendimentos Prioritários: Atual / Próximo e Subsequente (Acima de Próximas Vagas Livres) */}
        <div className="space-y-2">
          {/* Título do Grupo de Atendimento */}
          <div className="flex items-center justify-between px-0.5 pt-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CalendarCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Fila de Atendimento da Cadeira</span>
            </span>
            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
              isDark ? 'bg-slate-900 border border-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
            }`}>
              Em Andamento & Próximo
            </span>
          </div>

          {/* Card 1: Próximo / Em Atendimento */}
          {firstCardAppointment ? (
            renderAppointmentButtonCard(firstCardAppointment, 1)
          ) : (
            renderEmptyAppointmentCard(1)
          )}

          {/* Card 2: Próximo Atendimento após este (Subsequente) */}
          {secondCardAppointment ? (
            renderAppointmentButtonCard(secondCardAppointment, 2)
          ) : (
            firstCardAppointment && renderEmptyAppointmentCard(2)
          )}
        </div>

        {/* Régua de Acesso Rápido: Próximas Vagas Livres (Cópia da Seção de Agenda na Seção Inicial) */}
        {freeSlotsSummary.length > 0 && (
          <div 
            id="dashboard-free-slots-summary-card"
            className={`p-2.5 rounded-[4px] border ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-2 px-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Próximas Vagas Livres ({freeSlotsSummary.length})</span>
              </span>
              <span className="text-[9px] text-slate-500 font-medium">
                Toque para encaixar
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              {freeSlotsSummary.map((slot) => (
                <button
                  key={slot.time}
                  id={`dashboard-free-slot-${slot.time.replace(':', '-')}`}
                  type="button"
                  onClick={() => handleSlotClick(slot.time)}
                  title={`Encaixar cliente às ${slot.time} (${slot.durationText})`}
                  className="px-2.5 py-1.5 rounded-[4px] border border-dashed border-emerald-500/60 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-white text-xs font-mono font-bold flex items-center justify-center shrink-0 active:scale-95 transition cursor-pointer"
                >
                  <span>{slot.time}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Itens de Dashboard & Caixa Operacional (Posicionados abaixo da Fila & Atendimentos) */}
        <div className="space-y-3 pb-6">
          {/* 1. Seção: Caixa Operacional (Dia & Semana - Entradas vs Metas) */}
          <div className="space-y-1.5">
            <CaixaDailyWeeklyCard
              appointments={appointments}
              matchesSelectedPro={matchesSelectedPro}
              onNavigateToUtilitiesFinancial={() => onNavigateTab('utilidades')}
            />
          </div>

          {/* 2. Grupo: Metas & Turnos */}
          <div className="space-y-1.5">
            {/* Cabeçalho do Grupo de Metas & Turnos */}
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                  <Target className="w-3 h-3 text-emerald-400" />
                </div>
                <span className="text-xs font-bold font-['Poppins']">
                  Metas & Turnos
                </span>
              </div>
            </div>

            {/* Card Unificado: Velocímetro de Metas e Evolução por Turno Lado a Lado */}
            <GoalsAndShiftsCard
              currentAmount={financialQuickSummary.realizedRevenue}
              dailyAmount={dailyRealizedRevenue}
              weeklyAmount={weeklyRealizedRevenue}
              targetAmount={targetAmount}
              averageTicket={financialQuickSummary.averageTicket}
              remainingDays={10}
              appointments={appointments}
              activeProId={activeProId}
              selectedFilterPro={selectedFilterPro}
              matchesSelectedPro={matchesSelectedPro}
              onUpdateTarget={handleUpdateTarget}
            />
          </div>
        </div>
      </div>

      {/* Modal Operacional de Atendimento (Iniciar, Pausar, Adicionar Mais Tempo, Concluir) */}
      {isActionModalOpen && actionModalAppointment && (() => {
        const appKey = actionModalAppointment.protocolCode || actionModalAppointment.id || `${actionModalAppointment.time}-${actionModalAppointment.clientName}`;
        const effectiveStatus = (localAppointmentStatuses[appKey] || actionModalAppointment.status || '').toUpperCase();
        const isProgress = effectiveStatus.includes('ATEND') || effectiveStatus.includes('INICI');
        const isPaused = effectiveStatus.includes('PAUS');

        const clientFullName = (actionModalAppointment.clientName || actionModalAppointment.customerName || 'Cliente').trim();
        const serviceName = actionModalAppointment.serviceName || actionModalAppointment.service || actionModalAppointment.serviceTitle || 'Serviço';
        const { startTimeStr, durationMinutes, durationHhMm, endTimeHhMm } = calculateAppointmentTimes(actionModalAppointment);

        return (
          <div 
            id="professional-appointment-action-modal-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => {
              setIsActionModalOpen(false);
              setActionModalAppointment(null);
            }}
          >
            <div 
              id="professional-appointment-action-modal"
              className={`w-full max-w-sm rounded-xl border p-4 flex flex-col gap-3.5 shadow-2xl relative select-none animate-in zoom-in-95 duration-150 ${
                isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Cabeçalho do Modal com Status e Fechar */}
              <div className="flex items-center justify-between border-b pb-2.5 border-slate-800/80">
                <div className="flex items-center gap-2">
                  {isProgress ? (
                    <span className="px-2 py-0.5 rounded-[4px] bg-emerald-500 text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1">
                      <Zap className="w-3 h-3 text-white fill-white animate-pulse" />
                      <span>Em Atendimento</span>
                    </span>
                  ) : isPaused ? (
                    <span className="px-2 py-0.5 rounded-[4px] bg-amber-500 text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1">
                      <Pause className="w-3 h-3 text-white fill-white" />
                      <span>Atendimento Pausado</span>
                    </span>
                  ) : (
                    <span className={`px-2 py-0.5 rounded-[4px] font-bold text-[10px] uppercase tracking-wider ${
                      isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                    }`}>
                      Aguardando Início
                    </span>
                  )}
                </div>

                <button 
                  type="button"
                  id="modal-close-action-button"
                  onClick={() => {
                    hapticLight();
                    setIsActionModalOpen(false);
                    setActionModalAppointment(null);
                  }}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                  }`}
                  title="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Informações do Cliente e Serviço */}
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${
                  isDark ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  <User className="w-6 h-6 stroke-[1.75]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm truncate leading-snug">
                    {clientFullName}
                  </h3>
                  <p className="text-xs text-slate-400 truncate">
                    {serviceName}
                  </p>
                </div>
              </div>

              {/* Régua de Horários e Duração */}
              <div className={`grid grid-cols-3 gap-2 p-2.5 rounded-lg border text-center ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">
                    Início
                  </span>
                  <span className="font-mono text-xs font-black text-emerald-400">
                    {startTimeStr}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">
                    Duração
                  </span>
                  <span className="font-mono text-xs font-bold">
                    {durationHhMm} ({durationMinutes}m)
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">
                    Término
                  </span>
                  <span className="font-mono text-xs font-black text-emerald-400">
                    {endTimeHhMm}
                  </span>
                </div>
              </div>

              {/* Feedback de Adição de Tempo */}
              {timeExtensionFeedback && (
                <div className="p-2 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-in fade-in duration-150">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>{timeExtensionFeedback}</span>
                </div>
              )}

              {/* Trava Operacional: Alerta se Cadeira Ocupada pelo atendimento anterior */}
              {isModalBlockedByPrevious && (
                <div className="p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-start gap-2 text-amber-300 text-xs animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <div className="flex-1">
                    <p className="font-bold text-[11px] leading-tight text-amber-200">Cadeira Ocupada no Momento</p>
                    <p className="text-[10px] text-amber-300/80 mt-0.5 leading-snug">
                      Conclua o atendimento anterior para liberar a cadeira, ou transfira este cliente para um colega da equipe caso o procedimento atual tenha atrasado.
                    </p>
                  </div>
                </div>
              )}

              {/* Feedback de Transferência Concluída */}
              {transferSuccessMessage && (
                <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-white font-bold text-xs flex items-center justify-center gap-2 text-center animate-in fade-in duration-150">
                  <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                  <span>{transferSuccessMessage}</span>
                </div>
              )}

              {/* Seção Principal: Ações Operacionais OU Tela de Transferência para Colega */}
              {isTransferOpen ? (
                <div className="flex flex-col gap-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b pb-1.5 border-slate-800">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      <span>Repassar para Colega</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsTransferOpen(false)}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Voltar</span>
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-400">
                    Selecione o profissional disponível para assumir este atendimento:
                  </p>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                    {availableColleaguesForTransfer.map((colleague) => (
                      <div 
                        key={colleague.id}
                        className={`flex items-center justify-between p-2 rounded-lg border transition ${
                          isDark ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {colleague.avatar ? (
                            <img src={colleague.avatar} alt={colleague.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                              {colleague.name.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate leading-tight">{colleague.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{colleague.roleLabel}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          id={`modal-btn-transfer-to-${colleague.id}`}
                          onClick={() => handleTransferAppointment(colleague)}
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] uppercase tracking-wider shrink-0 transition cursor-pointer active:scale-95"
                        >
                          Repassar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {/* Ação 1: Iniciar / Retomar Atendimento OU Pausar */}
                  {!isProgress ? (
                    <button
                      type="button"
                      id="modal-btn-start-appointment"
                      disabled={isModalBlockedByPrevious}
                      onClick={handleStartFromModal}
                      className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition ${
                        isModalBlockedByPrevious
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer active:scale-98'
                      }`}
                      title={isModalBlockedByPrevious ? 'Conclua o atendimento anterior para iniciar este' : undefined}
                    >
                      <Zap className={`w-4 h-4 ${isModalBlockedByPrevious ? 'text-slate-500' : 'text-white fill-white'}`} />
                      <span>{isModalBlockedByPrevious ? 'Início Bloqueado (Cadeira Ocupada)' : (isPaused ? 'Retomar Atendimento' : 'Iniciar Atendimento')}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      id="modal-btn-pause-appointment"
                      onClick={handlePauseFromModal}
                      className="w-full py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition cursor-pointer active:scale-98"
                    >
                      <Pause className="w-4 h-4 text-white fill-white" />
                      <span>Pausar Atendimento</span>
                    </button>
                  )}

                  {/* Ação 2: Adicionar Mais Tempo (Estender) */}
                  <div className={`p-2.5 rounded-lg border flex flex-col gap-1.5 ${
                    isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between px-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-400" />
                        <span>Adicionar Mais Tempo</span>
                      </span>
                      <span className="text-[9px] text-slate-500">
                        Estende o término
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[5, 10, 15, 30].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          id={`modal-btn-add-time-${mins}`}
                          onClick={() => handleAddMoreTime(mins)}
                          className={`py-1.5 px-1 rounded border border-dashed font-mono font-bold text-[11px] flex items-center justify-center gap-0.5 transition cursor-pointer active:scale-95 ${
                            isDark 
                              ? 'border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-white' 
                              : 'border-emerald-500/60 bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                          }`}
                          title={`Adicionar +${mins} minutos à duração`}
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>{mins}m</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ação 3: Concluir Atendimento */}
                  <button
                    type="button"
                    id="modal-btn-complete-appointment"
                    onClick={handleCompleteFromModal}
                    className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition cursor-pointer active:scale-98"
                  >
                    <Check className="w-4 h-4 text-white stroke-[2.5]" />
                    <span>Concluir Atendimento</span>
                  </button>

                  {/* Ação 4: Repassar / Transferir Atendimento para Colega do Estabelecimento (Apenas atendimentos NÃO iniciados) */}
                  {!isProgress && (
                    <button
                      type="button"
                      id="modal-btn-open-transfer"
                      onClick={() => {
                        hapticLight();
                        setIsTransferOpen(true);
                      }}
                      className={`w-full py-2 px-3 rounded-lg border font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-98 ${
                        isDark 
                          ? 'border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 hover:text-white' 
                          : 'border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700'
                      }`}
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Transferir para Colega</span>
                    </button>
                  )}
                </div>
              )}

              {/* Botão Secundário Fechar */}
              <div className="pt-1 text-center">
                <button
                  type="button"
                  id="modal-btn-dismiss"
                  onClick={() => {
                    hapticLight();
                    setIsActionModalOpen(false);
                    setActionModalAppointment(null);
                  }}
                  className="text-xs text-slate-400 hover:text-white font-medium py-1 transition cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
