import React, { useState, useEffect } from 'react';
import { 
  X, User, Mail, Phone, MapPin, Calendar, Clock, 
  Check, Moon, Sun, MessageCircle, MessageSquare, Send, ShieldCheck, 
  ChevronRight, ArrowRight, Sparkles, CheckCircle2, 
  Scissors, LayoutDashboard, Store, LogOut, Users, DollarSign
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { hapticLight, hapticSuccess, hapticMedium } from '../utils/haptics';
import { BookingAppointment, UserProfile, UserPersona } from '../types';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userAvatarUrl?: string;
  onUpdateUserName?: (name: string) => void;
  onNavigateToSchedule?: () => void;
  onNavigateTab?: (tab: 'home' | 'servicos' | 'vagas' | 'espaco' | 'equipe' | 'financeiro' | 'personalizar') => void;
  salonName?: string;
  salonPhone?: string;
  isSalonLoggedIn?: boolean;
  currentPersona?: UserPersona;
  isProAdmin?: boolean;
  onRequestManage?: () => void;
  onOpenAdminPanel?: () => void;
  onLoginSalon?: (pin: string) => boolean;
  onLogoutSalon?: () => void;
}

const DEFAULT_PROFILE: UserProfile = {
  name: 'Lucas Silva',
  email: 'lucas.silva@email.com',
  phone: '(11) 98765-4321',
  address: 'Rua das Flores, 120 - São Paulo, SP',
};

const DEFAULT_APPOINTMENTS: BookingAppointment[] = [
  {
    protocolCode: 'VGA-84920',
    service: 'Corte Degradê & Barboterapia',
    professional: 'Carlos Silva',
    salonName: 'Barbearia Rota 99',
    dateTime: 'Hoje às 16:30',
    dayGroup: 'Hoje',
    time: '16:30',
    totalPrice: 45.0,
    status: 'CONFIRMADO',
    address: 'Av. Paulista, 1000 - Bela Vista',
  },
  {
    protocolCode: 'VGA-61042',
    service: 'Barboterapia & Toalha Quente',
    professional: 'Carlos Silva',
    salonName: 'Barbearia Rota 99',
    dateTime: '10/09 às 14:00',
    dayGroup: '10/09',
    time: '14:00',
    totalPrice: 35.0,
    status: 'CONCLUÍDO',
    address: 'Av. Paulista, 1000 - Bela Vista',
  }
];

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  isOpen,
  onClose,
  userName = 'Lucas Silva',
  userAvatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  onUpdateUserName,
  onNavigateToSchedule,
  onNavigateTab,
  salonName = 'Barbearia Rota 99',
  salonPhone = '5511987654321',
  isSalonLoggedIn = false,
  currentPersona = 'cliente',
  isProAdmin = false,
  onRequestManage,
  onOpenAdminPanel,
  onLoginSalon,
  onLogoutSalon,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const [activeSubTab, setActiveSubTab] = useState<'menu' | 'agenda' | 'dados' | 'config'>('menu');

  // Estado do Chat Interno no App
  const [isAppChatOpen, setIsAppChatOpen] = useState(false);
  const [drawerChatMessages, setDrawerChatMessages] = useState<Array<{ id: string; sender: 'user' | 'salon' | 'system'; text: string; timestamp: string }>>([
    {
      id: 'sys-1',
      sender: 'system',
      text: 'Chat oficial do aplicativo. Suas mensagens são seguras e registradas no Vagou.',
      timestamp: '10:00',
    },
    {
      id: 'salon-1',
      sender: 'salon',
      text: `Olá! Como podemos ajudar com seu agendamento na ${salonName}?`,
      timestamp: '10:01',
    }
  ]);
  const [inputDrawerChatMessage, setInputDrawerChatMessage] = useState('');

  const handleSendDrawerChatMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputDrawerChatMessage.trim()) return;
    hapticSuccess();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newMsg = {
      id: `user-${Date.now()}`,
      sender: 'user' as const,
      text: inputDrawerChatMessage.trim(),
      timestamp: timeStr,
    };
    setDrawerChatMessages(prev => [...prev, newMsg]);
    setInputDrawerChatMessage('');

    setTimeout(() => {
      const replyTime = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;
      setDrawerChatMessages(prev => [
        ...prev,
        {
          id: `salon-${Date.now()}`,
          sender: 'salon',
          text: 'Recebemos sua mensagem! Nossa equipe responderá em instantes pelo próprio aplicativo.',
          timestamp: replyTime,
        }
      ]);
    }, 1100);
  };

  // Estado dos Dados Pessoais do Usuário
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('vagou_user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_PROFILE, ...parsed, name: userName || parsed.name };
      }
    } catch {
      // ignore
    }
    return { ...DEFAULT_PROFILE, name: userName };
  });

  const [isEditing, setIsEditing] = useState(false);
  const [savedSuccessToast, setSavedSuccessToast] = useState(false);

  // Estado dos Agendamentos
  const [appointments, setAppointments] = useState<BookingAppointment[]>(() => {
    try {
      const saved = localStorage.getItem('vagou_user_appointments');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_APPOINTMENTS;
  });

  // Preferências
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('vagou_notifications_pref') !== 'disabled';
  });

  const [hapticsEnabled, setHapticsEnabled] = useState(() => {
    return localStorage.getItem('vagou_haptics_pref') !== 'disabled';
  });

  // Salvar preferências
  const handleToggleNotifications = () => {
    hapticLight();
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    localStorage.setItem('vagou_notifications_pref', next ? 'enabled' : 'disabled');
  };

  const handleToggleHaptics = () => {
    hapticLight();
    const next = !hapticsEnabled;
    setHapticsEnabled(next);
    localStorage.setItem('vagou_haptics_pref', next ? 'enabled' : 'disabled');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    hapticSuccess();
    try {
      localStorage.setItem('vagou_user_profile', JSON.stringify(profile));
    } catch {
      // ignore
    }
    if (onUpdateUserName && profile.name.trim()) {
      onUpdateUserName(profile.name.trim());
    }
    setIsEditing(false);
    setSavedSuccessToast(true);
    setTimeout(() => {
      setSavedSuccessToast(false);
    }, 2500);
  };

  // Fechar ao pressionar a tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 cursor-pointer"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      {/* Container do Drawer com limite de largura mobile */}
      <div 
        className={`w-full max-w-md h-full flex flex-col shadow-2xl transition-transform animate-in slide-in-from-right duration-250 cursor-default ${
          isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. CABEÇALHO DO MENU DO USUÁRIO */}
        <div className={`p-4 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            {activeSubTab !== 'menu' ? (
              <button
                type="button"
                onClick={() => {
                  hapticLight();
                  setActiveSubTab('menu');
                  setIsEditing(false);
                }}
                className={`p-1.5 rounded transition active:scale-95 cursor-pointer ${
                  isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                }`}
                title="Voltar ao Menu"
                aria-label="Voltar ao Menu"
              >
                <ChevronRight className="w-5 h-5 rotate-180 text-emerald-500" />
              </button>
            ) : null}

            <div>
              <h2 className="text-sm font-bold tracking-tight uppercase font-['Poppins']">
                {activeSubTab === 'menu' && 'Menu do Cliente'}
                {activeSubTab === 'agenda' && 'Minha Agenda'}
                {activeSubTab === 'dados' && 'Meus Dados Pessoais'}
                {activeSubTab === 'config' && 'Configurações'}
              </h2>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {salonName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              hapticLight();
              onClose();
            }}
            className={`w-8 h-8 rounded flex items-center justify-center transition active:scale-95 cursor-pointer ${
              isDark 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900'
            }`}
            title="Fechar menu"
            aria-label="Fechar menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. CORPO DO DRAWER COM ROLAGEM */}
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-4 space-y-4">
          {/* TOAST DE FEEDBACK DE SALVAMENTO */}
          {savedSuccessToast && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded flex items-center gap-2.5 text-emerald-400 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Dados pessoais atualizados com sucesso!</span>
            </div>
          )}

          {/* VISTA 1: MENU PRINCIPAL DE OPÇÕES */}
          {activeSubTab === 'menu' && (
            <div className="space-y-4">
              {/* CARD DE IDENTIFICAÇÃO DO USUÁRIO COM BOTÃO DE TEMA NO LADO DIREITO OPOSTO */}
              <div className={`p-3.5 sm:p-4 rounded border flex items-center justify-between gap-3 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded overflow-hidden ring-2 ring-emerald-500 shrink-0 bg-slate-800">
                    <img 
                      src={userAvatarUrl} 
                      alt={profile.name} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold truncate">{profile.name}</h3>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                        currentPersona === 'admin'
                          ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                          : currentPersona === 'profissional'
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {currentPersona === 'admin' ? 'Admin Dono' : currentPersona === 'profissional' ? 'Profissional' : 'Cliente'}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {profile.email}
                    </p>
                    <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {profile.phone}
                    </p>
                  </div>
                </div>

                {/* Botão Modo Claro/Escuro (Lado direito oposto ao avatar) */}
                <button
                  type="button"
                  id="drawer-theme-toggle-btn"
                  onClick={() => {
                    hapticLight();
                    toggleTheme();
                  }}
                  className={`px-2.5 py-2 rounded border flex flex-col items-center justify-center gap-1 transition active:scale-95 cursor-pointer shrink-0 ${
                    isDark 
                      ? 'bg-slate-800/90 hover:bg-slate-750 text-amber-400 border-slate-700' 
                      : 'bg-slate-100 hover:bg-slate-200 text-amber-600 border-slate-200 shadow-xs'
                  }`}
                  title={isDark ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
                  aria-label="Alternar Modo Claro / Escuro"
                >
                  {isDark ? (
                    <Moon className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Sun className="w-4 h-4 text-amber-500" />
                  )}
                  <span className="text-[9.5px] font-bold tracking-tight uppercase whitespace-nowrap">
                    {isDark ? 'Escuro' : 'Claro'}
                  </span>
                </button>
              </div>

              {/* LISTA DE OPÇÕES DO MENU */}
              <div className="space-y-2">
                {/* MODO PRO - ADMINISTRADOR: Caixa + Agenda */}
                {currentPersona !== 'cliente' && isProAdmin && (
                  <>
                    <button
                      type="button"
                      id="menu-option-financeiro"
                      onClick={() => {
                        hapticLight();
                        onClose();
                        onNavigateTab?.('financeiro');
                      }}
                      className={`w-full p-3.5 rounded border flex items-center justify-between text-left transition active:scale-[0.99] cursor-pointer ${
                        isDark 
                          ? 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-white' 
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                          <DollarSign className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold font-['Poppins']">Caixa & Financeiro</div>
                          <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Fechamento de caixa e comissões da equipe
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    </button>

                    <button
                      type="button"
                      id="menu-option-agenda-admin"
                      onClick={() => {
                        hapticLight();
                        onClose();
                        onNavigateTab?.('vagas');
                      }}
                      className={`w-full p-3.5 rounded border flex items-center justify-between text-left transition active:scale-[0.99] cursor-pointer ${
                        isDark 
                          ? 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-white' 
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold font-['Poppins']">Agenda Geral</div>
                          <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Todos os atendimentos e horários
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    </button>
                  </>
                )}

                {/* MODO PRO - MEMBRO / PROFISSIONAL: Apenas Agenda e Comissões Próprias (Sem Gerenciar) */}
                {currentPersona !== 'cliente' && !isProAdmin && (
                  <>
                    <button
                      type="button"
                      id="menu-option-agenda"
                      onClick={() => {
                        hapticLight();
                        onClose();
                        onNavigateTab?.('vagas');
                      }}
                      className={`w-full p-3.5 rounded border flex items-center justify-between text-left transition active:scale-[0.99] cursor-pointer ${
                        isDark 
                          ? 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-white' 
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold font-['Poppins']">Minha Agenda</div>
                          <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Seus atendimentos e agendamentos
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    </button>

                    <button
                      type="button"
                      id="menu-option-comissoes"
                      onClick={() => {
                        hapticLight();
                        onClose();
                        onNavigateTab?.('financeiro');
                      }}
                      className={`w-full p-3.5 rounded border flex items-center justify-between text-left transition active:scale-[0.99] cursor-pointer ${
                        isDark 
                          ? 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-white' 
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                          <DollarSign className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold font-['Poppins']">Minhas Comissões</div>
                          <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Seus repasses e atendimentos realizados
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    </button>
                  </>
                )}

                {/* Opção: Meus Dados Pessoais */}
                <button
                  type="button"
                  onClick={() => {
                    hapticLight();
                    setActiveSubTab('dados');
                  }}
                  className={`w-full p-3.5 rounded border flex items-center justify-between text-left transition active:scale-[0.99] cursor-pointer ${
                    isDark 
                      ? 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-white' 
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold font-['Poppins']">Meus Dados Pessoais</div>
                      <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Nome, e-mail, telefone e endereço
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                </button>

                {/* Opção: Chat no App com o Estabelecimento */}
                <button
                  type="button"
                  onClick={() => {
                    hapticLight();
                    setIsAppChatOpen(true);
                  }}
                  className={`w-full p-3.5 rounded-[4px] border flex items-center justify-between text-left transition active:scale-[0.99] cursor-pointer ${
                    isDark 
                      ? 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-white' 
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[4px] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold font-['Poppins']">Chat no App Vagou</div>
                      <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Mensagens diretas com a equipe
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                </button>

                {/* ÚLTIMA OPÇÃO DA LISTA DO MENU: Gerenciar Estabelecimento (Exclusivo Administrador Pro) */}
                {currentPersona !== 'cliente' && isProAdmin && (
                  <button
                    type="button"
                    id="menu-option-personalizar"
                    onClick={() => {
                      hapticLight();
                      onClose();
                      if (onRequestManage) {
                        onRequestManage();
                      } else {
                        onNavigateTab?.('personalizar');
                      }
                    }}
                    className={`w-full p-3.5 rounded border flex items-center justify-between text-left transition active:scale-[0.99] cursor-pointer ${
                      isDark 
                        ? 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-white' 
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                        <Store className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold font-['Poppins']">Gerenciar Estabelecimento</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">Admin</span>
                        </div>
                        <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Espaço, catálogo de serviços e equipe
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                  </button>
                )}

                {/* Desconectar do Modo Pro */}
                {currentPersona !== 'cliente' && onLogoutSalon && (
                  <button
                    type="button"
                    onClick={() => {
                      hapticMedium();
                      onClose();
                      onLogoutSalon();
                    }}
                    className={`w-full p-3 rounded border flex items-center justify-between text-left transition active:scale-[0.99] cursor-pointer mt-3 ${
                      isDark 
                        ? 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-400' 
                        : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <LogOut className="w-4 h-4" />
                      <span className="text-xs font-bold font-['Poppins']">Sair da Conta Pro</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold">Desconectar</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* VISTA 2: MINHA AGENDA */}
          {activeSubTab === 'agenda' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-['Poppins']">
                  Histórico de Agendamentos
                </span>
                <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {appointments.length} itens
                </span>
              </div>

              {appointments.length === 0 ? (
                <div className={`p-6 rounded border text-center space-y-3 ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
                }`}>
                  <Calendar className="w-8 h-8 text-emerald-500 mx-auto opacity-60" />
                  <p className="text-xs font-medium">Você ainda não possui agendamentos cadastrados.</p>
                  {onNavigateToSchedule && (
                    <button
                      type="button"
                      onClick={() => {
                        hapticMedium();
                        onClose();
                        onNavigateToSchedule();
                      }}
                      className="px-4 py-2 bg-[#20C933] hover:bg-[#1bb32d] text-white text-xs font-bold rounded uppercase tracking-wider cursor-pointer"
                    >
                      Agendar Agora
                    </button>
                  )}
                </div>
              ) : (
                appointments.map((item, idx) => (
                  <div
                    key={item.protocolCode || idx}
                    className={`p-3.5 rounded border space-y-2.5 transition ${
                      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-800 text-emerald-400 border border-slate-700">
                        #{item.protocolCode}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.status === 'CONFIRMADO' 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold">{item.service}</h4>
                      <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Profissional: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{item.professional}</strong>
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/60">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{item.dateTime || `${item.dayGroup} às ${item.time}`}</span>
                      </div>
                      <span className="font-bold text-xs">
                        R$ {Number(item.totalPrice).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                ))
              )}

              {onNavigateToSchedule && (
                <button
                  type="button"
                  onClick={() => {
                    hapticMedium();
                    onClose();
                    onNavigateToSchedule();
                  }}
                  className="w-full py-3 mt-2 bg-[#20C933] hover:bg-[#1bb32d] active:scale-[0.99] text-white font-bold text-xs rounded transition uppercase tracking-wider font-['Poppins'] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Scissors className="w-4 h-4" />
                  <span>AGENDAR NOVO HORÁRIO</span>
                </button>
              )}
            </div>
          )}

          {/* VISTA 3: MEUS DADOS PESSOAIS */}
          {activeSubTab === 'dados' && (
            <div className="space-y-4">
              <form onSubmit={handleSaveProfile} className="space-y-3">
                {/* Campo Nome */}
                <div className="space-y-1">
                  <label className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    <User className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Nome Completo</span>
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    disabled={!isEditing}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    required
                    className={`w-full px-3 py-2.5 rounded text-xs border outline-hidden transition ${
                      !isEditing
                        ? isDark ? 'bg-slate-900/60 border-slate-800/60 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                        : isDark ? 'bg-slate-900 border-emerald-500 text-white focus:ring-1 focus:ring-emerald-500' : 'bg-white border-emerald-500 text-slate-900 focus:ring-1 focus:ring-emerald-500'
                    }`}
                  />
                </div>

                {/* Campo E-mail */}
                <div className="space-y-1">
                  <label className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    <Mail className="w-3.5 h-3.5 text-emerald-500" />
                    <span>E-mail</span>
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled={!isEditing}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    required
                    className={`w-full px-3 py-2.5 rounded text-xs border outline-hidden transition ${
                      !isEditing
                        ? isDark ? 'bg-slate-900/60 border-slate-800/60 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                        : isDark ? 'bg-slate-900 border-emerald-500 text-white focus:ring-1 focus:ring-emerald-500' : 'bg-white border-emerald-500 text-slate-900 focus:ring-1 focus:ring-emerald-500'
                    }`}
                  />
                </div>

                {/* Campo Telefone */}
                <div className="space-y-1">
                  <label className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Telefone / WhatsApp</span>
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    disabled={!isEditing}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    required
                    className={`w-full px-3 py-2.5 rounded text-xs border outline-hidden transition ${
                      !isEditing
                        ? isDark ? 'bg-slate-900/60 border-slate-800/60 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                        : isDark ? 'bg-slate-900 border-emerald-500 text-white focus:ring-1 focus:ring-emerald-500' : 'bg-white border-emerald-500 text-slate-900 focus:ring-1 focus:ring-emerald-500'
                    }`}
                  />
                </div>

                {/* Campo Endereço */}
                <div className="space-y-1">
                  <label className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Endereço Residencial</span>
                  </label>
                  <input
                    type="text"
                    value={profile.address}
                    disabled={!isEditing}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded text-xs border outline-hidden transition ${
                      !isEditing
                        ? isDark ? 'bg-slate-900/60 border-slate-800/60 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                        : isDark ? 'bg-slate-900 border-emerald-500 text-white focus:ring-1 focus:ring-emerald-500' : 'bg-white border-emerald-500 text-slate-900 focus:ring-1 focus:ring-emerald-500'
                    }`}
                  />
                </div>

                {/* BOTÕES DE AÇÃO DOS DADOS */}
                <div className="pt-2">
                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={() => {
                        hapticLight();
                        setIsEditing(true);
                      }}
                      className="w-full py-3 bg-[#20C933] hover:bg-[#1bb32d] active:scale-[0.99] text-white font-bold text-xs rounded transition uppercase tracking-wider font-['Poppins'] cursor-pointer flex items-center justify-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      <span>EDITAR DADOS</span>
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          hapticLight();
                          setIsEditing(false);
                        }}
                        className={`flex-1 py-3 rounded border text-xs font-bold transition cursor-pointer ${
                          isDark 
                            ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300' 
                            : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                        }`}
                      >
                        CANCELAR
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3 bg-[#20C933] hover:bg-[#1bb32d] active:scale-[0.99] text-white font-bold text-xs rounded transition uppercase tracking-wider font-['Poppins'] cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>SALVAR</span>
                      </button>
                    </div>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* VISTA 4: CONFIGURAÇÕES & PREFERÊNCIAS */}
          {activeSubTab === 'config' && (
            <div className="space-y-3">
              {/* Notificações no App */}
              <div className={`p-3.5 rounded border flex items-center justify-between ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="space-y-0.5">
                  <div className="text-xs font-bold font-['Poppins']">Lembretes de Horário</div>
                  <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Receber aviso 1h antes no aplicativo
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleNotifications}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    notificationsEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                  title="Ativar/Desativar Lembretes"
                  aria-label="Ativar/Desativar Lembretes"
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Vibração Tátil */}
              <div className={`p-3.5 rounded border flex items-center justify-between ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="space-y-0.5">
                  <div className="text-xs font-bold font-['Poppins']">Vibração Tátil (Haptics)</div>
                  <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Feedback ao clicar em botões e abas
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleHaptics}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    hapticsEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                  title="Ativar/Desativar Vibração"
                  aria-label="Ativar/Desativar Vibração"
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      hapticsEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Segurança e Privacidade */}
              <div className={`p-3.5 rounded border space-y-1.5 ${
                isDark ? 'bg-slate-900/60 border-slate-800/80 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Privacidade e Segurança</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Seus dados e agendamentos estão protegidos de acordo com a LGPD e são transmitidos de forma criptografada para {salonName}.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 3. RODAPÉ FIXO DO MENU */}
        <div className={`p-3 border-t text-center text-[10px] shrink-0 ${
          isDark ? 'bg-slate-900/80 border-slate-800 text-slate-500' : 'bg-white border-slate-200 text-slate-400'
        }`}>
          <span>{salonName} • App Oficial do Estabelecimento</span>
        </div>
      </div>

      {/* Modal do Chat Interno no App (Cliente -> Salão) */}
      {isAppChatOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className={`w-full max-w-md h-[85vh] sm:h-[550px] rounded-t-[4px] sm:rounded-[4px] border flex flex-col overflow-hidden shadow-2xl ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            {/* Cabeçalho do Chat */}
            <div className={`p-3 border-b shrink-0 flex items-center justify-between ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-[4px] bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black shrink-0">
                  <Scissors className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className={`font-bold text-xs truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {salonName}
                    </h3>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Online no Vagou" />
                  </div>
                  <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Chat Oficial Vagou</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAppChatOpen(false)}
                className={`p-1.5 rounded-[4px] border transition cursor-pointer ${
                  isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0 bg-slate-950/40">
              {drawerChatMessages.map((msg) => {
                if (msg.sender === 'system') {
                  return (
                    <div key={msg.id} className="my-2 p-2 rounded-[4px] bg-slate-900/90 border border-slate-800 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{msg.text}</span>
                    </div>
                  );
                }

                const isUser = msg.sender === 'user';

                return (
                  <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] p-2.5 rounded-[4px] text-xs ${
                      isUser
                        ? 'bg-emerald-500 text-white font-medium'
                        : isDark
                        ? 'bg-slate-800 text-slate-100 border border-slate-700 font-medium'
                        : 'bg-slate-100 text-slate-900 border border-slate-200 font-medium'
                    }`}>
                      <p>{msg.text}</p>
                      <span className={`block text-[9px] mt-1 text-right font-mono ${
                        isUser ? 'text-white/80' : 'text-slate-400'
                      }`}>
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendDrawerChatMessage} className={`p-2.5 border-t shrink-0 flex items-center gap-2 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <input
                type="text"
                value={inputDrawerChatMessage}
                onChange={(e) => setInputDrawerChatMessage(e.target.value)}
                placeholder="Digite sua mensagem no aplicativo..."
                className={`flex-1 px-3 py-2 rounded-[4px] border text-xs font-medium outline-hidden transition ${
                  isDark 
                    ? 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus:border-emerald-500' 
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500'
                }`}
              />
              <button
                type="submit"
                disabled={!inputDrawerChatMessage.trim()}
                className="py-2 px-3 rounded-[4px] bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer active:scale-98"
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
