import React, { createContext, useContext, useState, useEffect } from 'react';
import { SalonProfileView } from './components/SalonProfileView';
import { UserAppointmentsView } from './components/UserAppointmentsView';
import { UserDashboard } from './components/UserDashboard';
import { ServiceOffer, BookingAppointment } from './types';
import { initializeStoredPwaAssets } from './utils/pwaAssets';

export interface ThemeContextType {
  theme: 'dark' | 'light';
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  isDark: true,
  toggleTheme: () => {},
  setTheme: () => {},
  accentColor: '#10b981',
  setAccentColor: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('vagou_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return 'dark';
  });
  
  const [accentColor, setAccentColorState] = useState<string>(() => {
      try {
        return localStorage.getItem('vagou_accent_color') || '#10b981';
      } catch {
        return '#10b981';
      }
    });

  const isDark = theme === 'dark';

  useEffect(() => {
    initializeStoredPwaAssets();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('vagou_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch {}
  }, [theme]);
  
  useEffect(() => {
    try {
      localStorage.setItem('vagou_accent_color', accentColor);
      document.documentElement.style.setProperty('--accent-color', accentColor);

      // Atualiza dinamicamente a barra de status do celular (Android/iOS PWA)
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', accentColor);
      }
    } catch {}
  }, [accentColor]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme: 'dark' | 'light') => {
    setThemeState(newTheme);
  };
  
  const setAccentColor = (color: string) => {
    setAccentColorState(color);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme, accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

// Mock de dados oficial do estabelecimento para operação imediata
const INITIAL_SALON_OFFERS: ServiceOffer[] = [
  {
    id: 'off-1',
    salonName: 'Barbearia Rota 99',
    professionalName: 'Carlos Silva',
    professionalAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    serviceTitle: 'Corte Degradê & Barboterapia',
    serviceCategory: 'cabelo',
    price: 45.0,
    originalPrice: 65.0,
    rating: 4.9,
    ratingCount: 142,
    distance: '350 m',
    distanceMeters: 350,
    neighborhood: 'Vila Madalena, São Paulo',
    timeSlot: 'Hoje • 15:30',
    dayLabel: 'Hoje',
    duration: '45 min',
    imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
    lat: -23.5505,
    lng: -46.6883,
    mediaLevel: 2,
    expiresInMinutes: 38,
    expiresTimestamp: Date.now() + 38 * 60 * 1000,
    activeViewers: 12,
    isFlashDeal: true,
    brandGradient: 'from-emerald-950 via-slate-900 to-zinc-950',
    description: 'Corte navalhado com alinhamento perfeito, lavagem com massagem capilar e hidratação com toalha quente na barba.',
  },
  {
    id: 'off-2',
    salonName: 'Barbearia Rota 99',
    professionalName: 'Carlos Silva',
    professionalAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    serviceTitle: 'Barboterapia com Toalha Quente',
    serviceCategory: 'barba',
    price: 35.0,
    originalPrice: 50.0,
    rating: 4.9,
    ratingCount: 98,
    distance: '350 m',
    distanceMeters: 350,
    neighborhood: 'Vila Madalena, São Paulo',
    timeSlot: 'Hoje • 16:30',
    dayLabel: 'Hoje',
    duration: '35 min',
    imageUrl: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=800&q=80',
    lat: -23.5505,
    lng: -46.6883,
    mediaLevel: 2,
    expiresInMinutes: 55,
    expiresTimestamp: Date.now() + 55 * 60 * 1000,
    activeViewers: 8,
    isFlashDeal: true,
    brandGradient: 'from-emerald-950 via-slate-900 to-zinc-950',
    description: 'Tratamento de barba com produtos premium, toalha quente e massagem facial relaxante.',
  },
  {
    id: 'off-3',
    salonName: 'Barbearia Rota 99',
    professionalName: 'Lucas Oliveira',
    professionalAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    serviceTitle: 'Combo Rota VIP: Corte + Barba + Lavagem',
    serviceCategory: 'cabelo',
    price: 75.0,
    originalPrice: 95.0,
    rating: 5.0,
    ratingCount: 167,
    distance: '350 m',
    distanceMeters: 350,
    neighborhood: 'Vila Madalena, São Paulo',
    timeSlot: 'Hoje • 17:15',
    dayLabel: 'Hoje',
    duration: '60 min',
    imageUrl: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=800&q=80',
    lat: -23.5505,
    lng: -46.6883,
    mediaLevel: 2,
    expiresInMinutes: 80,
    expiresTimestamp: Date.now() + 80 * 60 * 1000,
    activeViewers: 14,
    isFlashDeal: false,
    brandGradient: 'from-emerald-950 via-slate-900 to-zinc-950',
    description: 'Pacote completo de cuidados masculinos com produtos importados e cerveja cortesia.',
  }
];

export const App: React.FC = () => {
  const { isDark, accentColor } = useTheme();
  const [viewMode, setViewMode] = useState<'salon' | 'agenda' | 'dashboard'>('salon');
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('vagou_user_name') || 'Anderson';
  });
  const [userAvatarUrl, setUserAvatarUrl] = useState(() => {
    return localStorage.getItem('vagou_user_avatar') || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80';
  });
  const [appointments, setAppointments] = useState<BookingAppointment[]>([]);

  interface AppToast {
    id: string;
    title: string;
    message: string;
    type: 'success' | 'info' | 'error';
  }
  const [activeToast, setActiveToast] = useState<AppToast | null>(null);

  const loadAppointments = () => {
    try {
      const saved = localStorage.getItem('vagou_user_appointments');
      if (saved) {
        setAppointments(JSON.parse(saved));
      } else {
        setAppointments([]);
      }

      const savedName = localStorage.getItem('vagou_user_name');
      if (savedName) {
        setUserName(savedName);
      }
      const savedAvatar = localStorage.getItem('vagou_user_avatar');
      if (savedAvatar) {
        setUserAvatarUrl(savedAvatar);
      }
    } catch {
      setAppointments([]);
    }
  };

  const triggerLocalNotification = (apt: BookingAppointment, oldStatus: string, newStatus: string) => {
    const service = apt.serviceTitle || apt.service || 'Serviço';
    const time = apt.dateTime || '';
    
    let title = 'Status Atualizado! 🔔';
    let message = `Seu agendamento para "${service}" foi atualizado de "${oldStatus.toLowerCase()}" para "${newStatus.toLowerCase()}".`;

    if (newStatus === 'CONFIRMADO') {
      title = 'Agendamento Confirmado! 🎉';
      message = `Seu horário para "${service}" (${time}) foi confirmado com sucesso pelo estabelecimento!`;
    } else if (newStatus === 'CANCELADO') {
      title = 'Agendamento Cancelado ⚠️';
      message = `Infelizmente seu agendamento para "${service}" (${time}) foi cancelado.`;
    } else if (newStatus === 'CONCLUÍDO' || newStatus === 'CONCLUIDO') {
      title = 'Atendimento Concluído! ✨';
      message = `Obrigado! Seu atendimento de "${service}" foi concluído.`;
    }

    // 1. Mostrar o Toast interno no app
    setActiveToast({
      id: Date.now().toString(),
      title,
      message,
      type: newStatus === 'CONFIRMADO' ? 'success' : newStatus === 'CANCELADO' ? 'error' : 'info'
    });

    // Auto fechar o Toast após 5 segundos
    setTimeout(() => {
      setActiveToast((current) => {
        if (current && Date.now() - parseInt(current.id) >= 4900) {
          return null;
        }
        return current;
      });
    }, 5000);

    // 2. Chamar a API de Notificação Nativa do navegador (se disponível e autorizada)
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body: message,
          });
        } catch (e) {
          console.error('Falha ao instanciar notificação nativa:', e);
        }
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            try {
              new Notification(title, {
                body: message,
              });
            } catch (e) {
              console.error('Falha ao instanciar notificação nativa:', e);
            }
          }
        });
      }
    }

    // 3. Feedback tátil/vibratório suave
    try {
      window.navigator.vibrate?.([100, 50, 100]);
    } catch {}
  };

  // Detector de mudança de status para notificações locais
  useEffect(() => {
    if (!appointments || appointments.length === 0) return;

    try {
      // Obter o mapa de status já salvos anteriormente para comparar
      const notifiedStr = localStorage.getItem('vagou_notified_status_map') || '{}';
      const notifiedMap = JSON.parse(notifiedStr) as Record<string, string>;
      let hasChanges = false;

      appointments.forEach((apt) => {
        if (!apt.protocolCode) return;
        
        const currentStatus = apt.status || 'PENDENTE';
        const previousStatus = notifiedMap[apt.protocolCode];

        // Se o agendamento já estava registrado e o status mudou!
        if (previousStatus && previousStatus !== currentStatus) {
          triggerLocalNotification(apt, previousStatus, currentStatus);
          notifiedMap[apt.protocolCode] = currentStatus;
          hasChanges = true;
        } else if (!previousStatus) {
          // Primeira vez que vemos esse agendamento, guardamos o status silenciosamente
          notifiedMap[apt.protocolCode] = currentStatus;
          hasChanges = true;
        }
      });

      if (hasChanges) {
        localStorage.setItem('vagou_notified_status_map', JSON.stringify(notifiedMap));
      }
    } catch (e) {
      console.error('Erro no detector de status:', e);
    }
  }, [appointments]);

  useEffect(() => {
    loadAppointments();
    
    // Solicitar permissão para notificações nativas no carregamento inicial
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Recarregar agendamentos quando a aba ou janela ganha foco para manter dados sincronizados
    window.addEventListener('focus', loadAppointments);

    // Poll localstorage periodicamente a cada 2 segundos para sincronizar as mudanças de status em tempo real
    const interval = setInterval(loadAppointments, 2000);

    return () => {
      window.removeEventListener('focus', loadAppointments);
      clearInterval(interval);
    };
  }, []);

  const handleNavigateToAgenda = () => {
    loadAppointments();
    setViewMode('agenda');
  };

  const handleCancelAppointment = (protocolCode: string) => {
    try {
      const saved = localStorage.getItem('vagou_user_appointments');
      if (saved) {
        const list: BookingAppointment[] = JSON.parse(saved);
        const updated = list.map(apt => {
          if (apt.protocolCode === protocolCode) {
            return { ...apt, status: 'CANCELADO' };
          }
          return apt;
        });
        localStorage.setItem('vagou_user_appointments', JSON.stringify(updated));
        setAppointments(updated);
      }
    } catch (e) {
      console.error('Erro ao cancelar agendamento:', e);
    }
  };

  useEffect(() => {
    const colorMap: Record<string, string> = {
      emerald: '#10b981',
      blue: '#3b82f6',
      rose: '#f43f5e',
      amber: '#f59e0b',
      violet: '#8b5cf6',
    };
    document.documentElement.style.setProperty('--accent-color', colorMap[accentColor] || '#10b981');
  }, [accentColor]);


  const [isFavorite, setIsFavorite] = useState<boolean>(() => {
    try {
      return localStorage.getItem('rota99_is_favorite') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleFavorite = () => {
    setIsFavorite((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('rota99_is_favorite', String(next));
      } catch {}
      return next;
    });
  };

  return (
    <div className={`w-full h-dvh flex items-center justify-center overflow-hidden font-['Poppins'] ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-200/80 text-slate-900'
    }`}>
      {/* Contêiner Mobile do Aplicativo (Enquadramento PWA Nativo Mobile-First no Desktop) */}
      <div className={`w-full max-w-md h-full flex flex-col relative overflow-hidden sm:shadow-2xl sm:border-x ${
        isDark ? 'bg-[#151A1E] sm:border-slate-800/80' : 'bg-slate-50 sm:border-slate-200'
      }`}>
        {/* Toast Notificação de Status */}
        {activeToast && (
          <div className="absolute top-4 left-4 right-4 z-[9999] pointer-events-auto">
            <div className={`p-3.5 rounded-[4px] border shadow-2xl flex items-start gap-3 backdrop-blur-md animate-in slide-in-from-top-4 duration-300 ${
              activeToast.type === 'success'
                ? isDark ? 'bg-emerald-950/95 border-emerald-500/40 text-white shadow-emerald-900/10' : 'bg-emerald-50/95 border-emerald-200 text-emerald-900'
                : activeToast.type === 'error'
                  ? isDark ? 'bg-rose-950/95 border-rose-500/40 text-white shadow-rose-900/10' : 'bg-rose-50/95 border-rose-200 text-rose-900'
                  : isDark ? 'bg-slate-900/95 border-slate-700/50 text-white' : 'bg-slate-100/95 border-slate-200 text-slate-900'
            }`}>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-black tracking-tight font-['Poppins'] flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full animate-pulse shrink-0 ${
                    activeToast.type === 'success' ? 'bg-emerald-400' : activeToast.type === 'error' ? 'bg-rose-400' : 'bg-amber-400'
                  }`} />
                  {activeToast.title}
                </div>
                <div className="text-[11px] leading-snug mt-1 opacity-90 font-medium">
                  {activeToast.message}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveToast(null)}
                className={`text-[10px] uppercase font-bold shrink-0 cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {/* Contêiner Principal da Página do Estabelecimento */}
        <main className="flex-1 w-full min-h-0 overflow-hidden relative">
          {viewMode === 'salon' ? (
            <SalonProfileView
              salonName="Barbearia Rota 99"
              offers={INITIAL_SALON_OFFERS}
              onDirectBook={(offer) => {
                console.log('Agendamento realizado:', offer);
              }}
              isFavorite={isFavorite}
              onToggleFavorite={handleToggleFavorite}
              userName={userName}
              userAvatarUrl={userAvatarUrl}
              onNavigateToUserAppointments={handleNavigateToAgenda}
              onNavigateToUserDashboard={() => setViewMode('dashboard')}
            />
          ) : viewMode === 'agenda' ? (
            <UserAppointmentsView
              appointments={appointments}
              onBack={() => setViewMode('salon')}
              onCancelAppointment={handleCancelAppointment}
            />
          ) : (
            <UserDashboard
              onBack={() => setViewMode('salon')}
              onUpdateProfile={(newName, newAvatar) => {
                setUserName(newName);
                setUserAvatarUrl(newAvatar);
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
