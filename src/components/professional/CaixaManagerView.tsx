import React from 'react';
import { 
  Wallet, 
  ArrowLeft, 
  Wrench, 
  ArrowUpRight 
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { BookingAppointment, UserPersona } from '../../types';
import { hapticLight } from '../../utils/haptics';
import { CaixaDailyWeeklyCard } from './dashboard/CaixaDailyWeeklyCard';

export interface CaixaManagerViewProps {
  appointments: BookingAppointment[];
  onUpdateAppointments?: (appointments: BookingAppointment[]) => void;
  salonName?: string;
  currentPersona?: UserPersona;
  activeProId?: string;
  matchesSelectedPro?: (app: BookingAppointment) => boolean;
  onNavigateTab?: (tab: 'home' | 'servicos' | 'vagas' | 'espaco' | 'equipe' | 'financeiro' | 'caixa' | 'personalizar' | 'utilidades') => void;
  onBack?: () => void;
}

export const CaixaManagerView: React.FC<CaixaManagerViewProps> = ({
  appointments = [],
  salonName = 'Barbearia Rota 99',
  matchesSelectedPro,
  onNavigateTab,
  onBack,
}) => {
  const { isDark } = useTheme();

  return (
    <div className={`w-full h-full flex flex-col min-h-0 select-none overflow-hidden ${
      isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* 1. CABEÇALHO DA SEÇÃO CAIXA */}
      <header className={`px-4 py-3 border-b shrink-0 flex items-center justify-between transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex items-center gap-2.5 min-w-0">
          {onBack && (
            <button
              type="button"
              id="btn-back-caixa"
              onClick={() => {
                hapticLight();
                onBack();
              }}
              className={`p-1.5 rounded border transition active:scale-95 cursor-pointer shrink-0 ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' 
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
              title="Voltar ao Painel"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="w-8 h-8 rounded bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Wallet className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold font-['Poppins'] tracking-tight truncate">
                Caixa Operacional
              </h1>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500 text-white shadow-xs">
                Hoje & Semana
              </span>
            </div>
            <p className={`text-[10.5px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {salonName} • Entradas em tempo real e metas
            </p>
          </div>
        </div>

        {/* Atalho para Utilidades > Financeiro */}
        {onNavigateTab && (
          <button
            type="button"
            onClick={() => {
              hapticLight();
              onNavigateTab('utilidades');
            }}
            className={`px-2.5 py-1 rounded border text-[10.5px] font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer whitespace-nowrap ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-emerald-400'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-emerald-700 shadow-xs'
            }`}
            title="Abrir gestão financeira avançada em Utilidades"
          >
            <Wrench className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">Utilidades / DRE</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        )}
      </header>

      {/* 2. CORPO ROLÁVEL COM O PAINEL DE CAIXA */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3 max-w-3xl mx-auto w-full pb-8">
        <CaixaDailyWeeklyCard
          appointments={appointments}
          matchesSelectedPro={matchesSelectedPro}
          onNavigateToUtilitiesFinancial={onNavigateTab ? () => onNavigateTab('utilidades') : undefined}
        />
      </div>
    </div>
  );
};



