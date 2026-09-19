import React, { useState, useMemo, useCallback } from 'react';
import { 
  Store, Clock, LogOut, Calendar, LayoutDashboard, DollarSign,
  TrendingUp, Wallet, CalendarRange, ChevronRight,
  Shield, Scissors, Building2, Check, X, User, Users
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { SalonAdminSettings, CatalogServiceItem, BookingAppointment, SalonProfessionalItem } from '../../types';
import { hapticLight, hapticSuccess } from '../../utils/haptics';
import { FinancialManagerView } from './FinancialManagerView';

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
  professionals?: SalonProfessionalItem[];
  onNavigateTab?: (tab: 'home' | 'servicos' | 'vagas' | 'espaco') => void;
  onOpenNewService?: () => void;
  onOpenNewAppointment?: () => void;
  onLogout?: () => void;
  salonName?: string;
  currentUserName?: string;
}

export const ProfessionalDashboardView: React.FC<ProfessionalDashboardViewProps> = ({
  adminSettings,
  onUpdateSettings,
  services = [],
  appointments = [],
  professionals = [],
  onNavigateTab,
  onOpenNewService,
  onOpenNewAppointment,
  onLogout,
  salonName = 'Barbearia Rota 99',
  currentUserName,
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

  // Modal para alternar perfil (Dono vs Colaborador)
  const [isSwitchUserModalOpen, setIsSwitchUserModalOpen] = useState(false);

  const isOpen = adminSettings?.isOpenNow ?? true;

  const handleToggleOpen = () => {
    hapticLight();
    if (onUpdateSettings) {
      onUpdateSettings({ isOpenNow: !isOpen });
    }
  };

  // Sub-aba do Painel: Atendimentos vs Financeiro
  const [dashboardTab, setDashboardTab] = useState<'atendimentos' | 'financeiro'>('atendimentos');

  // Estados de Filtro para os Atendimentos do Painel
  const [timeFilter, setTimeFilter] = useState<'proximo' | 'hoje' | 'semana' | 'mes'>('proximo');
  const [statusFilter, setStatusFilter] = useState<'concluidos' | 'confirmados' | 'pendentes' | 'cancelados'>('confirmados');

  // Função utilitária para verificar se um agendamento pertence ao profissional filtrado
  const matchesSelectedPro = useCallback((app: BookingAppointment) => {
    if (selectedFilterPro === 'all') return true;
    const appPro = (app.professionalName || app.professional || '').trim().toLowerCase();
    const target = selectedFilterPro.trim().toLowerCase();
    if (!appPro) return false;
    return appPro.includes(target) || target.includes(appPro);
  }, [selectedFilterPro]);

  // Filtragem Dinâmica de Próximos Clientes com base nos filtros selecionados e no profissional ativo
  const filteredDashboardAppointments = React.useMemo(() => {
    return appointments.filter((app) => {
      // 0. Filtragem por Profissional Ativo / Visualização
      if (!matchesSelectedPro(app)) return false;

      // 1. Filtragem por Período de Tempo
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

      if (!matchesTime) return false;

      // 2. Filtragem por Status
      const st = (app.status || '').toUpperCase();
      if (statusFilter === 'concluidos') {
        return st === 'CONCLUÍDO' || st === 'CONCLUIDO';
      }
      if (statusFilter === 'confirmados') {
        return st === 'CONFIRMADO' || st === 'AGENDADO';
      }
      if (statusFilter === 'pendentes') {
        return st === 'PENDENTE' || st === 'ALTERADO';
      }
      if (statusFilter === 'cancelados') {
        return st === 'CANCELADO';
      }

      return true;
    });
  }, [appointments, timeFilter, statusFilter, matchesSelectedPro]);

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

  // Provisões e Projeções Financeiras para a Seção Inicial (Visão do Dono vs Profissional Logado)
  const financialProjections = React.useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Início e término da semana corrente (Segunda a Domingo)
    const dayOfWeek = todayStart.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    const weekStart = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() - diffToMonday);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    let receivedToday = 0;
    let receivedTodayCount = 0;
    let estimatedToday = 0;
    let estimatedTodayCount = 0;
    let estimatedWeek = 0;
    let estimatedWeekCount = 0;
    const activeProsToday = new Set<string>();

    // Identifica dados do membro selecionado para cálculo de comissão individual
    const isAll = selectedFilterPro === 'all';
    const currentProMember = !isAll
      ? teamList.find(m => m.name.toLowerCase().includes(selectedFilterPro.toLowerCase()) || selectedFilterPro.toLowerCase().includes(m.name.toLowerCase()))
      : null;
    const commissionRate = currentProMember?.commissionRate ?? (userRole === 'admin' ? 100 : 50);

    appointments.forEach((app) => {
      const st = (app.status || '').toUpperCase();
      const isBlocked = app.isBlockedSlot || st === 'BLOQUEADO';
      const isCancelled = st === 'CANCELADO';
      if (isBlocked || isCancelled) return;

      // Filtra pelo profissional selecionado (se 'all', processa todos os membros)
      if (!matchesSelectedPro(app)) return;

      const price = Number(app.totalPrice) || 0;
      const proName = app.professionalName || app.professional || 'Geral';

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
        } else if (app.dayGroup === 'Amanhã' || app.dateTime?.includes('Amanhã')) {
          appDate = new Date();
          appDate.setDate(appDate.getDate() + 1);
        }
      }

      const isToday = appDate >= todayStart && appDate <= todayEnd;
      const isThisWeek = appDate >= weekStart && appDate <= weekEnd;

      // 1. Valores recebidos até o momento atual (concluídos ou pagos)
      const isCompleted = st.includes('CONCLU') || app.isPaid;
      if (isToday && isCompleted) {
        receivedToday += price;
        receivedTodayCount += 1;
      }

      // 2. Provisões estimadas para hoje (total agendado no dia)
      if (isToday) {
        estimatedToday += price;
        estimatedTodayCount += 1;
        activeProsToday.add(proName);
      }

      // 3. Projeções para esta semana
      if (isThisWeek) {
        estimatedWeek += price;
        estimatedWeekCount += 1;
      }
    });

    const percentAchieved = estimatedToday > 0 
      ? Math.min(100, Math.round((receivedToday / estimatedToday) * 100)) 
      : 0;

    const receivedCommission = isAll ? 0 : (receivedToday * (commissionRate / 100));
    const estimatedCommission = isAll ? 0 : (estimatedToday * (commissionRate / 100));
    const weekCommission = isAll ? 0 : (estimatedWeek * (commissionRate / 100));

    return {
      isAll,
      targetName: isAll ? 'Todo o Estabelecimento' : (currentProMember?.name || selectedFilterPro),
      commissionRate,
      receivedToday,
      receivedTodayCount,
      receivedCommission,
      estimatedToday,
      estimatedTodayCount,
      estimatedCommission,
      estimatedWeek,
      estimatedWeekCount,
      weekCommission,
      percentAchieved,
      activeProsTodayCount: activeProsToday.size,
    };
  }, [appointments, matchesSelectedPro, selectedFilterPro, teamList, userRole]);

  // Cálculo do tempo restante até o atendimento formatado em Temp Rest. XXHXX
  const getRemainingTimeText = (timeStr?: string) => {
    if (!timeStr) return 'Temp Rest. --H--';
    const match = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!match) return `Temp Rest. ${timeStr}`;
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    
    const now = new Date();
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);

    const diffMs = target.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));

    if (diffMins <= 0) {
      return 'Temp Rest. 00H00';
    }

    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    const hStr = String(h).padStart(2, '0');
    const mStr = String(m).padStart(2, '0');
    return `Temp Rest. ${hStr}H${mStr}`;
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
              <span className={`text-[10px] font-semibold uppercase tracking-wide ${
                isOpen 
                  ? isDark ? 'text-white' : 'text-emerald-600'
                  : 'text-rose-400'
              }`}>
                {isOpen ? 'Aberto para Atendimento' : 'Fechado no Momento'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleToggleOpen}
            className={`px-2.5 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition cursor-pointer border ${
              isOpen 
                ? isDark
                  ? 'bg-emerald-500/25 border-emerald-500/50 text-white hover:bg-emerald-500/35'
                  : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/30' 
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isOpen ? 'Pausar' : 'Abrir'}
          </button>
          {onLogout && (
            <button
              type="button"
              onClick={() => {
                hapticLight();
                onLogout();
              }}
              className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
              title="Sair do Modo Profissional"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Segmented Switcher: Atendimentos vs Financeiro */}
      <div className={`px-2.5 py-1.5 border-b shrink-0 flex items-center gap-1.5 ${
        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100 border-slate-200'
      }`}>
        <button
          type="button"
          onClick={() => {
            hapticLight();
            setDashboardTab('atendimentos');
          }}
          className={`flex-1 py-1.5 px-2.5 rounded text-[11px] font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer select-none whitespace-nowrap ${
            dashboardTab === 'atendimentos'
              ? 'bg-emerald-500 text-white shadow-xs'
              : isDark
              ? 'text-slate-400 hover:text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Atendimentos</span>
        </button>

        <button
          type="button"
          onClick={() => {
            hapticLight();
            setDashboardTab('financeiro');
          }}
          className={`flex-1 py-1.5 px-2.5 rounded text-[11px] font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer select-none whitespace-nowrap ${
            dashboardTab === 'financeiro'
              ? 'bg-emerald-500 text-white shadow-xs'
              : isDark
              ? 'text-slate-400 hover:text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Caixa & Comissões</span>
        </button>
      </div>

      {dashboardTab === 'financeiro' ? (
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <FinancialManagerView appointments={appointments} salonName={salonName} />
        </div>
      ) : (
        /* 2. Métricas Rápidas e Dashboard Principal */
        <div className="p-2 flex flex-col gap-1.5 flex-1 min-h-0 overflow-y-auto">
          
          {/* Barra de Perfil Logado & Filtro de Equipe (Visão Geral do Dono vs Visão do Profissional) */}
          <div className={`p-2 rounded-lg border flex flex-col gap-1.5 ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
          }`}>
            {/* Linha 1: Perfil Ativo e Botão de Alternância */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
                  userRole === 'admin'
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                    : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                }`}>
                  {userRole === 'admin' ? <Shield className="w-3.5 h-3.5" /> : <Scissors className="w-3.5 h-3.5" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[11px] font-bold truncate leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {userRole === 'admin' ? '👑 Dono / Gerente Geral' : `✂️ ${loggedProfessionalName}`}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                      userRole === 'admin'
                        ? isDark ? 'bg-amber-500/20 text-white' : 'bg-amber-100 text-amber-800'
                        : isDark ? 'bg-emerald-500/20 text-white' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {userRole === 'admin' ? 'Acesso Geral' : 'Colaborador'}
                    </span>
                  </div>
                  <p className={`text-[9.5px] truncate font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {userRole === 'admin'
                      ? selectedFilterPro === 'all'
                        ? 'Visualizando valores consolidados de todos os membros'
                        : `Inspecionando membro: ${selectedFilterPro}`
                      : 'Valores vinculados exclusivamente à sua agenda e comissão'}
                  </p>
                </div>
              </div>

              {/* Botão de Trocar Perfil / Simular Acesso */}
              <button
                type="button"
                onClick={() => {
                  hapticLight();
                  setIsSwitchUserModalOpen(true);
                }}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 transition flex items-center gap-1 border cursor-pointer ${
                  isDark 
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
              >
                <Users className="w-3 h-3 text-emerald-400" />
                <span>Trocar Perfil</span>
              </button>
            </div>

            {/* Linha 2: Seletor Rápido de Membros da Equipe (Se Dono, ou informativo se Colaborador) */}
            {userRole === 'admin' ? (
              <div className="pt-1.5 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className={`text-[9px] font-bold uppercase tracking-wider shrink-0 mr-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Visão:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    hapticLight();
                    setSelectedFilterPro('all');
                    localStorage.setItem('vagou_dashboard_selected_pro', 'all');
                  }}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1 shrink-0 ${
                    selectedFilterPro === 'all'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : isDark
                      ? 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/60'
                      : 'bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  <Building2 className="w-3 h-3" />
                  <span>Todo o Salão (Geral)</span>
                </button>

                {teamList.map((member) => {
                  const isSelected = selectedFilterPro === member.name;
                  const firstName = member.name.split(' ')[0];
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => {
                        hapticLight();
                        setSelectedFilterPro(member.name);
                        localStorage.setItem('vagou_dashboard_selected_pro', member.name);
                      }}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                        isSelected
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : isDark
                          ? 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/60'
                          : 'bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200'
                      }`}
                    >
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} className="w-3.5 h-3.5 rounded-full object-cover shrink-0" />
                      ) : (
                        <User className="w-3 h-3 shrink-0" />
                      )}
                      <span>{firstName}</span>
                      <span className="text-[8.5px] opacity-75">({member.commissionRate}%)</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[9px]">
                <span className={`flex items-center gap-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <Scissors className="w-3 h-3 text-emerald-400" />
                  Sua taxa de comissão: <strong className="text-emerald-400">{financialProjections.commissionRate}%</strong>
                </span>
                <span className={`text-[8.5px] px-1.5 py-0.2 rounded font-mono ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                  Visualização Pessoal
                </span>
              </div>
            )}
          </div>
          
          {/* Nova seção: Linha com Card do Cliente em Destaque (Coluna 1) e Grid 2x2 de Status (Coluna 2) */}
          <div className="grid grid-cols-2 gap-1 items-stretch">
          {/* Coluna 1: Card do Próximo Cliente (Div Memorizada) */}
          <div className="flex flex-col">
            {filteredDashboardAppointments.length > 0 ? (() => {
              const app = filteredDashboardAppointments[0];
              const stUpper = (app.status || '').toUpperCase();
              const isPending = stUpper === 'PENDENTE';
              const isAlteracao = stUpper.includes('ALTER') || stUpper.includes('REMANEJ') || stUpper.includes('REAGEND');
              const timeLabel = app.time || '14:00';
              const remainingTime = getRemainingTimeText(timeLabel);

              return (
                <div
                  key={app.protocolCode || 'featured-top'}
                  className={`p-2 rounded-lg border flex flex-col justify-between gap-1 h-full select-none transition relative overflow-hidden ${
                    isDark
                      ? 'bg-slate-900 border-slate-800 text-white'
                      : 'bg-white border-slate-200 shadow-xs text-slate-900'
                  }`}
                >
                  {/* Top: Hora & Status */}
                  <div className="flex items-center justify-between gap-1">
                    <div className={`flex items-center gap-1 font-black text-[10px] shrink-0 ${
                      isDark
                        ? 'bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded text-white'
                        : 'text-emerald-600 bg-transparent border-0 px-0 py-0'
                    }`}>
                      <Clock className={`w-2.5 h-2.5 shrink-0 ${isDark ? 'text-white' : 'text-emerald-600'}`} />
                      <span>{timeLabel}</span>
                    </div>

                    <span className={`text-[8.5px] font-bold uppercase tracking-wide shrink-0 ${
                      isDark
                        ? isAlteracao || isPending
                          ? 'px-1.5 py-0.5 rounded bg-amber-500/20 text-white border border-amber-500/40 font-extrabold'
                          : stUpper === 'CANCELADO'
                          ? 'px-1.5 py-0.5 rounded bg-rose-500/25 text-white border border-rose-500/40 font-extrabold'
                          : stUpper === 'CONCLUÍDO' || stUpper === 'CONCLUIDO'
                          ? 'px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-bold'
                          : 'px-1.5 py-0.5 rounded bg-emerald-500/20 text-white border border-emerald-500/40 font-extrabold'
                        : isAlteracao || isPending
                        ? 'text-amber-600 font-extrabold bg-transparent border-0 px-0 py-0'
                        : stUpper === 'CANCELADO'
                        ? 'text-rose-600 font-extrabold bg-transparent border-0 px-0 py-0'
                        : stUpper === 'CONCLUÍDO' || stUpper === 'CONCLUIDO'
                        ? 'text-slate-500 font-bold bg-transparent border-0 px-0 py-0'
                        : 'text-emerald-600 font-extrabold bg-transparent border-0 px-0 py-0'
                    }`}>
                      {isAlteracao ? 'Alteração' : isPending ? 'Pendente' : stUpper === 'CANCELADO' ? 'Cancelado' : stUpper === 'CONCLUÍDO' || stUpper === 'CONCLUIDO' ? 'Concluído' : 'Confirmado'}
                    </span>
                  </div>

                  {/* Cliente e Serviço */}
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-black shrink-0 ${
                        isDark
                          ? 'bg-emerald-500/20 border border-emerald-500/40 text-white'
                          : 'bg-slate-900 text-white shadow-2xs'
                      }`}>
                        {(app.customerName || app.clientName || 'C')[0].toUpperCase()}
                      </div>
                      <p className={`text-[12px] font-black truncate leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {app.customerName || app.clientName || 'Cliente'}
                      </p>
                    </div>

                    <p className={`text-[9.5px] truncate font-medium ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                      {app.service || app.serviceTitle || 'Serviço'}
                    </p>
                  </div>

                  {/* Rodapé: Tempo Restante & Profissional */}
                  <div className={`pt-1 border-t flex items-center justify-between text-[9px] ${
                    isDark ? 'border-slate-800/80' : 'border-slate-100'
                  }`}>
                    <span className={`font-bold truncate font-mono text-[9px] ${
                      isDark ? 'text-white' : 'text-slate-700'
                    }`}>
                      {remainingTime}
                    </span>
                    <span className={`text-[8.5px] truncate font-medium flex items-center gap-0.5 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      <Scissors className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{app.professionalName || app.professional || 'Carlos Henrique'}</span>
                    </span>
                  </div>
                </div>
              );
            })() : (
              <div className={`p-2 rounded-lg border flex flex-col items-center justify-center text-center h-full ${
                isDark ? 'bg-slate-900/50 border-slate-800 text-slate-500' : 'bg-white border-slate-200 text-slate-400'
              }`}>
                <Clock className="w-4 h-4 mb-0.5 opacity-50" />
                <p className="text-[10px] font-semibold">Sem atendimento</p>
              </div>
            )}
          </div>

          {/* Coluna 2: Contêiner dos 4 Indicadores de Status (Grid 2x2) */}
          <div 
            id="professional-status-indicators-container" 
            className={`grid grid-cols-2 gap-1 p-1 rounded-lg border ${
              isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-100/70 border-slate-200'
            }`}
          >
            {(
              [
                { id: 'hoje', label: 'Hoje', icon: Calendar },
                { id: 'confirmados', label: 'Confirmado' },
                { id: 'pendentes', label: 'Pendentes' },
                { id: 'cancelados', label: 'Cancelados' },
              ] as const
            ).map((item) => {
              const isTimeFilter = item.id === 'hoje';
              const isActive = isTimeFilter ? timeFilter === item.id : statusFilter === item.id;
              
              let count = 0;
              if (isTimeFilter) {
                 count = appointments.filter((app) => {
                  const appDate = app.dateIso ? new Date(app.dateIso + 'T00:00:00') : new Date();
                  const now = new Date();
                  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                  return appDate >= todayStart && appDate <= todayEnd;
                 }).length;
              } else {
                 count = categoryCounts[item.id] || 0;
              }

              // Definição de cores de fundo vibrantes por item no Tema Claro
              let lightCardClass = '';
              let lightNumberClass = '';
              let lightLabelClass = '';

              if (item.id === 'hoje') {
                // Azul
                lightCardClass = 'status-blue-bg shadow-xs';
                lightLabelClass = 'text-blue-100';
                lightNumberClass = 'text-white';
              } else if (item.id === 'confirmados') {
                // Verde (REGRA INEGOCIÁVEL: FUNDO VERDE = TEXTO BRANCO)
                lightCardClass = 'status-green-bg shadow-xs';
                lightLabelClass = 'text-emerald-100';
                lightNumberClass = 'text-white';
              } else if (item.id === 'pendentes') {
                // Amarelo
                lightCardClass = 'status-amber-bg shadow-xs';
                lightLabelClass = 'text-amber-950 font-extrabold';
                lightNumberClass = 'text-slate-950';
              } else if (item.id === 'cancelados') {
                // Vermelho
                lightCardClass = 'status-rose-bg shadow-xs';
                lightLabelClass = 'text-rose-100';
                lightNumberClass = 'text-white';
              }

              // Estilos no Dark Mode (fundos temáticos com transparência elegante para manter harmonia dark)
              let darkCardClass = 'bg-slate-900 border-slate-800';
              let darkLabelClass = 'text-white/80';
              let darkNumberClass = 'text-white font-black';

              if (item.id === 'hoje') {
                darkCardClass = 'bg-blue-950/60 border-blue-800/80';
                darkLabelClass = 'text-white/90 font-bold';
                darkNumberClass = 'text-white';
              } else if (item.id === 'confirmados') {
                darkCardClass = 'bg-emerald-950/60 border-emerald-800/80';
                darkLabelClass = 'text-white/90 font-bold';
                darkNumberClass = 'text-white';
              } else if (item.id === 'pendentes') {
                darkCardClass = 'bg-amber-950/60 border-amber-800/80';
                darkLabelClass = 'text-white/90 font-bold';
                darkNumberClass = 'text-white';
              } else if (item.id === 'cancelados') {
                darkCardClass = 'bg-rose-950/60 border-rose-800/80';
                darkLabelClass = 'text-white/90 font-bold';
                darkNumberClass = 'text-white';
              }

              return (
                <div
                  key={item.id}
                  className={`p-1.5 rounded-lg border flex flex-col justify-between items-start text-left select-none w-full h-16 ${
                    isDark ? darkCardClass : lightCardClass
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-[8px] font-bold uppercase tracking-tight ${
                      isDark ? darkLabelClass : lightLabelClass
                    }`}>
                      {item.label}
                    </span>
                  </div>
                  <p className={`text-lg font-black leading-none ${
                    isDark ? darkNumberClass : lightNumberClass
                  }`}>
                    {count}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Próximos Atendimentos */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between px-0.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-500'}`}>
              Próximos Clientes
            </span>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('vagas')}
                className={`text-[10px] font-bold hover:underline cursor-pointer ${isDark ? 'text-white' : 'text-emerald-600'}`}
              >
                Ver todos
              </button>
            )}
          </div>

          {filteredDashboardAppointments.length === 0 ? (
            <div className={`p-4 rounded-[4px] border text-center ${
              isDark ? 'bg-slate-900/50 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
            }`}>
              <Clock className="w-5 h-5 mx-auto mb-1 text-slate-500" />
              <p className="text-xs font-semibold">Nenhum cliente nesta lista</p>
              <p className="text-[10px] mt-0.5 text-slate-500">Altere os filtros acima para ver outros atendimentos.</p>
            </div>
          ) : (
            <div className="flex items-stretch gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar snap-x snap-mandatory scroll-smooth touch-pan-x">
              {filteredDashboardAppointments.slice(0, 8).map((app, idx) => {
                const stUpper = (app.status || '').toUpperCase();
                const isPending = stUpper === 'PENDENTE';
                const isAlteracao = stUpper.includes('ALTER') || stUpper.includes('REMANEJ') || stUpper.includes('REAGEND');
                const timeLabel = app.time || '14:00';
                const remainingTime = getRemainingTimeText(timeLabel);

                return (
                  <div
                    key={app.protocolCode || idx}
                    className={`w-[175px] shrink-0 p-2.5 rounded-[4px] border flex flex-col justify-between gap-2 transition relative overflow-hidden snap-start ${
                      isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    {/* Cabeçalho do Card: Destaque da Próxima Hora & Badge de Status */}
                    <div className="flex items-center justify-between gap-1">
                      <div className={`flex items-center gap-1 font-black text-[11px] shrink-0 ${
                        isDark
                          ? 'bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-[4px] text-white'
                          : 'text-emerald-600 bg-transparent border-0 px-0 py-0'
                      }`}>
                        <Clock className={`w-3 h-3 shrink-0 ${isDark ? 'text-white' : 'text-emerald-600'}`} />
                        <span>{timeLabel}</span>
                      </div>

                      <span className={`text-[9px] font-bold uppercase tracking-wide shrink-0 ${
                        isDark
                          ? isAlteracao
                            ? 'px-1.5 py-0.5 rounded-[4px] bg-amber-500/20 text-white border border-amber-500/40 font-extrabold' 
                            : isPending
                            ? 'px-1.5 py-0.5 rounded-[4px] bg-amber-500/20 text-white border border-amber-500/40 font-extrabold'
                            : stUpper === 'CANCELADO'
                            ? 'px-1.5 py-0.5 rounded-[4px] bg-rose-500/25 text-white border border-rose-500/40 font-extrabold'
                            : stUpper === 'CONCLUÍDO' || stUpper === 'CONCLUIDO'
                            ? 'px-1.5 py-0.5 rounded-[4px] bg-slate-800 text-slate-300 border border-slate-700 font-bold'
                            : 'px-1.5 py-0.5 rounded-[4px] bg-emerald-500/20 text-white border border-emerald-500/40 font-extrabold'
                          : isAlteracao
                          ? 'text-amber-600 font-extrabold bg-transparent border-0 px-0 py-0'
                          : isPending
                          ? 'text-amber-600 font-extrabold bg-transparent border-0 px-0 py-0'
                          : stUpper === 'CANCELADO'
                          ? 'text-rose-600 font-extrabold bg-transparent border-0 px-0 py-0'
                          : stUpper === 'CONCLUÍDO' || stUpper === 'CONCLUIDO'
                          ? 'text-slate-500 font-bold bg-transparent border-0 px-0 py-0'
                          : 'text-emerald-600 font-extrabold bg-transparent border-0 px-0 py-0'
                      }`}>
                        {isAlteracao ? 'Alteração' : isPending ? 'Pendente' : stUpper === 'CANCELADO' ? 'Cancelado' : stUpper === 'CONCLUÍDO' || stUpper === 'CONCLUIDO' ? 'Concluído' : 'Confirmado'}
                      </span>
                    </div>

                    {/* Informações do Cliente & Descrição do Serviço */}
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className={`w-5 h-5 rounded-[4px] border flex items-center justify-center text-[9px] font-black shrink-0 ${
                          isDark
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-white'
                            : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600'
                        }`}>
                          {(app.customerName || app.clientName || 'C')[0].toUpperCase()}
                        </div>
                        <p className={`text-xs font-bold truncate leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {app.customerName || app.clientName || 'Cliente'}
                        </p>
                      </div>

                      <p className={`text-[10px] truncate font-medium ${isDark ? 'text-slate-300' : 'text-slate-400'}`}>
                        {app.service || app.serviceTitle || 'Serviço do Cliente'}
                      </p>
                    </div>

                    {/* Rodapé: Tempo Restante Formatado & Profissional */}
                    <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                      <span className={`font-bold truncate tracking-tight font-mono text-[10px] ${
                        isDark ? 'text-white' : 'text-emerald-600'
                      }`}>
                        {remainingTime}
                      </span>
                      <span className={`text-[8.5px] truncate font-medium flex items-center gap-0.5 ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        <Scissors className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{app.professionalName || app.professional || 'Carlos Henrique'}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. Previsões & Caixa: Provisões de Hoje, Recebido no Momento e Projeções da Semana */}
        <div className="space-y-2 pt-1 pb-1">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${isDark ? 'text-white' : 'text-slate-500'}`}>
                Previsões & Caixa
              </span>
              <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider truncate ${
                financialProjections.isAll
                  ? 'bg-amber-500/20 text-white border border-amber-500/40'
                  : 'bg-emerald-500/20 text-white border border-emerald-500/40'
              }`}>
                {financialProjections.isAll ? '🏢 Todo o Salão (Dono)' : `✂️ ${financialProjections.targetName}`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                hapticLight();
                setDashboardTab('financeiro');
              }}
              className={`text-[10px] font-bold flex items-center gap-0.5 hover:underline cursor-pointer shrink-0 ${
                isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'
              }`}
            >
              <span>Ver detalhes</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Card 1: Valores Recebido até o Momento Atual */}
          <div
            onClick={() => {
              hapticLight();
              setDashboardTab('financeiro');
            }}
            className={`p-2.5 rounded-lg border transition cursor-pointer select-none relative overflow-hidden ${
              isDark 
                ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/30 hover:border-emerald-500/50' 
                : 'bg-gradient-to-br from-emerald-50/70 via-white to-white border-emerald-200 hover:border-emerald-300 shadow-xs'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-md bg-emerald-500 flex items-center justify-center text-white shadow-xs shrink-0">
                    <Wallet className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-[9.5px] font-bold uppercase tracking-wider truncate ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                      {financialProjections.isAll
                        ? 'Recebido no Estabelecimento'
                        : userRole === 'professional'
                        ? 'Meu Recebido no Momento'
                        : `Recebido • ${financialProjections.targetName.split(' ')[0]}`}
                    </p>
                    <p className={`text-[9px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {financialProjections.isAll
                        ? 'Caixa consolidado de todos os membros'
                        : `Sua comissão: R$ ${financialProjections.receivedCommission.toFixed(2).replace('.', ',')} (${financialProjections.commissionRate}%)`}
                    </p>
                  </div>
                </div>

                <div className="pt-0.5 flex items-baseline gap-1.5">
                  <span className={`text-xl font-black font-['Poppins'] tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    R$ {financialProjections.receivedToday.toFixed(2).replace('.', ',')}
                  </span>
                  <span className={`text-[9.5px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    ({financialProjections.receivedTodayCount} {financialProjections.receivedTodayCount === 1 ? 'concluído' : 'concluídos'})
                  </span>
                </div>
              </div>

              {/* Tag / Badge de % Realizado */}
              <div className="flex flex-col items-end shrink-0">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white uppercase tracking-wider shadow-2xs">
                  {financialProjections.percentAchieved}% do dia
                </span>
                <span className={`text-[8.5px] font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Meta: R$ {financialProjections.estimatedToday.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {/* Barra de Progresso Realizado vs Previsto */}
            <div className="mt-2.5 w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                style={{ width: `${financialProjections.percentAchieved}%` }}
              />
            </div>
          </div>

          {/* Grid com 2 Cards: Provisões Estimadas Hoje & Projeções para Esta Semana */}
          <div className="grid grid-cols-2 gap-1.5">
            {/* Card 2: Provisões Estimadas para Hoje */}
            <div
              onClick={() => {
                hapticLight();
                setDashboardTab('financeiro');
              }}
              className={`p-2.5 rounded-lg border flex flex-col justify-between gap-1.5 transition cursor-pointer select-none ${
                isDark
                  ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[9px] font-bold uppercase tracking-wider truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {financialProjections.isAll
                    ? 'Provisão Salão Hoje'
                    : userRole === 'professional'
                    ? 'Minha Provisão Hoje'
                    : `Provisão • ${financialProjections.targetName.split(' ')[0]}`}
                </span>
                <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                  isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                }`}>
                  <TrendingUp className="w-3 h-3" />
                </div>
              </div>

              <div>
                <p className={`text-base font-black font-['Poppins'] tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  R$ {financialProjections.estimatedToday.toFixed(2).replace('.', ',')}
                </p>
                <p className={`text-[9px] font-medium truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {financialProjections.isAll
                    ? `${financialProjections.estimatedTodayCount} agendamentos (${financialProjections.activeProsTodayCount} profissionais)`
                    : `${financialProjections.estimatedTodayCount} agendamento(s) • R$ ${financialProjections.estimatedCommission.toFixed(2).replace('.', ',')}`}
                </p>
              </div>

              <div className={`pt-1 border-t text-[8.5px] font-medium flex items-center justify-between ${
                isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-100 text-slate-500'
              }`}>
                <span>Em aberto:</span>
                <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-700'}`}>
                  R$ {Math.max(0, financialProjections.estimatedToday - financialProjections.receivedToday).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {/* Card 3: Projeções para Esta Semana */}
            <div
              onClick={() => {
                hapticLight();
                setDashboardTab('financeiro');
              }}
              className={`p-2.5 rounded-lg border flex flex-col justify-between gap-1.5 transition cursor-pointer select-none ${
                isDark
                  ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[9px] font-bold uppercase tracking-wider truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {financialProjections.isAll
                    ? 'Projeção Salão Semana'
                    : userRole === 'professional'
                    ? 'Minha Projeção Semana'
                    : `Semana • ${financialProjections.targetName.split(' ')[0]}`}
                </span>
                <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                  isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-50 text-amber-600'
                }`}>
                  <CalendarRange className="w-3 h-3" />
                </div>
              </div>

              <div>
                <p className={`text-base font-black font-['Poppins'] tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  R$ {financialProjections.estimatedWeek.toFixed(2).replace('.', ',')}
                </p>
                <p className={`text-[9px] font-medium truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {financialProjections.isAll
                    ? `${financialProjections.estimatedWeekCount} atendimentos (salão todo)`
                    : `${financialProjections.estimatedWeekCount} atendimentos seus (${financialProjections.commissionRate}%)`}
                </p>
              </div>

              <div className={`pt-1 border-t text-[8.5px] font-medium flex items-center justify-between ${
                isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-100 text-slate-500'
              }`}>
                <span>{financialProjections.isAll ? 'Ciclo semanal:' : 'Previsão líquida:'}</span>
                <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  {financialProjections.isAll ? '7 dias' : `R$ ${financialProjections.weekCommission.toFixed(2).replace('.', ',')}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Modal: Alternar Perfil de Acesso (Dono vs Profissional da Equipe) */}
      {isSwitchUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className={`w-full max-w-sm rounded-xl border p-4 shadow-xl flex flex-col gap-3.5 ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between border-b pb-2.5 border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-tight">Perfil de Acesso & Visão</h3>
                  <p className="text-[10px] text-slate-400">Selecione como deseja visualizar o dashboard</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSwitchUserModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Lista de Perfis Disponíveis */}
            <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-0.5">
              {/* Opção 1: Dono / Gerente Geral (Acesso Completo ao Estabelecimento) */}
              <button
                type="button"
                onClick={() => {
                  hapticSuccess();
                  setUserRole('admin');
                  setLoggedProfessionalName('Carlos Henrique');
                  setSelectedFilterPro('all');
                  localStorage.setItem('vagou_dashboard_user_role', 'admin');
                  localStorage.setItem('vagou_dashboard_logged_pro_name', 'Carlos Henrique');
                  localStorage.setItem('vagou_dashboard_selected_pro', 'all');
                  setIsSwitchUserModalOpen(false);
                }}
                className={`p-3 rounded-lg border text-left transition flex items-start justify-between gap-2 cursor-pointer ${
                  userRole === 'admin' && selectedFilterPro === 'all'
                    ? 'bg-emerald-500/15 border-emerald-500 text-white'
                    : isDark
                    ? 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold">👑 Dono / Gerente Geral</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-white font-black uppercase">
                        Global
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                      Visão consolidada de todos os membros do estabelecimento e provisões totais.
                    </p>
                  </div>
                </div>
                {userRole === 'admin' && selectedFilterPro === 'all' && (
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white stroke-[3]" />
                  </div>
                )}
              </button>

              {/* Divisor */}
              <div className="flex items-center gap-2 my-0.5">
                <div className="h-px bg-slate-800 flex-1" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  Membros da Equipe ({teamList.length})
                </span>
                <div className="h-px bg-slate-800 flex-1" />
              </div>

              {/* Opções dos Membros da Equipe */}
              {teamList.map((member) => {
                const isCurrentLogged = userRole === 'professional' && loggedProfessionalName === member.name;
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      hapticSuccess();
                      setUserRole('professional');
                      setLoggedProfessionalName(member.name);
                      setSelectedFilterPro(member.name);
                      localStorage.setItem('vagou_dashboard_user_role', 'professional');
                      localStorage.setItem('vagou_dashboard_logged_pro_name', member.name);
                      localStorage.setItem('vagou_dashboard_selected_pro', member.name);
                      setIsSwitchUserModalOpen(false);
                    }}
                    className={`p-2.5 rounded-lg border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                      isCurrentLogged
                        ? 'bg-emerald-500/15 border-emerald-500 text-white'
                        : isDark
                        ? 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-700" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold truncate">{member.name}</span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                            {member.commissionRate}% comissão
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{member.roleLabel}</p>
                      </div>
                    </div>
                    {isCurrentLogged && (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Rodapé informativo */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <span>Alterne para testar como cada perfil visualiza o caixa.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
