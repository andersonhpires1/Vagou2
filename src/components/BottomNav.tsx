import React from 'react';
import { Home, Calendar, Sparkles, Store, LayoutDashboard, Users } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { hapticLight } from '../utils/haptics';

export interface SalonNavContext {
  activeTab: 'home' | 'servicos' | 'vagas' | 'espaco' | 'equipe';
  onSelectTab: (tab: 'home' | 'servicos' | 'vagas' | 'espaco' | 'equipe') => void;
  ServicesIcon?: React.ComponentType<{ className?: string }>;
  SpaceIcon?: React.ComponentType<{ className?: string }>;
  spaceTabLabel?: string;
  vagasTabLabel?: string;
  isProfessionalMode?: boolean;
}

interface BottomNavProps {
  salonContext?: SalonNavContext | null;
  activeTab?: 'home' | 'servicos' | 'vagas' | 'espaco' | 'equipe';
  onSelectTab?: (tab: 'home' | 'servicos' | 'vagas' | 'espaco' | 'equipe') => void;
  ServicesIcon?: React.ComponentType<{ className?: string }>;
  SpaceIcon?: React.ComponentType<{ className?: string }>;
  spaceTabLabel?: string;
  vagasTabLabel?: string;
  isProfessionalMode?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  salonContext,
  activeTab: propActiveTab,
  onSelectTab: propOnSelectTab,
  ServicesIcon: propServicesIcon,
  SpaceIcon: propSpaceIcon,
  spaceTabLabel: propSpaceTabLabel,
  vagasTabLabel: propVagasTabLabel,
  isProfessionalMode: propIsProfessionalMode,
}) => {
  const { isDark } = useTheme();

  const activeTab = propActiveTab || salonContext?.activeTab || 'home';
  const onSelectTab = propOnSelectTab || salonContext?.onSelectTab;
  const isProfessionalMode = propIsProfessionalMode ?? salonContext?.isProfessionalMode ?? false;
  const ServicesIcon = propServicesIcon || salonContext?.ServicesIcon || Sparkles;
  const SpaceIcon = propSpaceIcon || salonContext?.SpaceIcon || Store;
  const spaceTabLabel = propSpaceTabLabel || salonContext?.spaceTabLabel || (isProfessionalMode ? 'Config' : 'Espaço');
  const vagasTabLabel = propVagasTabLabel || salonContext?.vagasTabLabel || (isProfessionalMode ? 'Agenda' : 'Agendar');

  if (!onSelectTab) {
    return null;
  }

  const establishmentTabs: Array<{
    id: 'home' | 'vagas' | 'servicos' | 'espaco' | 'equipe';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'home', label: 'Início', icon: isProfessionalMode ? LayoutDashboard : Home },
    { id: 'vagas', label: vagasTabLabel, icon: Calendar },
    { id: 'servicos', label: 'Serviços', icon: ServicesIcon },
    { id: 'espaco', label: spaceTabLabel, icon: SpaceIcon },
  ];

  if (isProfessionalMode) {
    establishmentTabs.splice(3, 0, { id: 'equipe', label: 'Equipe', icon: Users });
  }

  return (
    <nav className={`flex-shrink-0 w-full h-[70px] ${
      isDark
        ? 'bg-[#151A1E]/95 border-slate-800/90 shadow-[0_-4px_16px_rgba(0,0,0,0.5)]'
        : 'bg-nav-light-theme shadow-[0_-4px_20px_rgba(0,0,0,0.15)] text-white'
    } backdrop-blur-md border-t px-2 sm:px-3 py-1 my-0 mx-0 flex items-center justify-around z-30 transition-colors`}>
      {establishmentTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            id={`nav-salon-${tab.id}`}
            onClick={() => {
              hapticLight();
              onSelectTab(tab.id);
            }}
            className="flex flex-col items-center justify-center gap-1 py-1 px-2 sm:px-3 transition active:scale-95 cursor-pointer group"
          >
            <div className={`w-[34px] h-[34px] rounded-lg flex items-center justify-center transition-all ${
              isActive
                ? isDark
                  ? 'bg-accent/20 border border-accent text-white scale-105 shadow-[0_0_12px_var(--accent-color)]/25'
                  : 'bg-white text-slate-900 border border-white scale-105 shadow-sm'
                : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-white/80 hover:text-white hover:bg-white/15'
            }`}>
              <Icon className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className={`text-[10px] tracking-wide font-['Poppins'] font-bold truncate max-w-[64px] transition-colors ${
              isActive
                ? isDark ? 'text-white' : 'text-white font-extrabold'
                : isDark ? 'text-slate-400' : 'text-white/80'
            }`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
