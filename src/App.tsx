import React, { createContext, useContext, useState, useEffect } from 'react';
import { SalonProfileView } from './components/SalonProfileView';
import { ServiceOffer } from './types';
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
        {/* Contêiner Principal da Página do Estabelecimento */}
        <main className="flex-1 w-full min-h-0 overflow-hidden relative">
          <SalonProfileView
            salonName="Barbearia Rota 99"
            offers={INITIAL_SALON_OFFERS}
            onDirectBook={(offer) => {
              console.log('Agendamento realizado:', offer);
            }}
            isFavorite={isFavorite}
            onToggleFavorite={handleToggleFavorite}
            userName="Anderson"
            userAvatarUrl="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
          />
        </main>
      </div>
    </div>
  );
};

export default App;
