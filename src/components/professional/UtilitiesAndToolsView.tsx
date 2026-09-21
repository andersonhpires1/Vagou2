import React, { useState } from 'react';
import { 
  Zap, 
  Package, 
  Sliders, 
  ArrowLeft, 
  Clock, 
  Timer, 
  Play, 
  Pause, 
  RotateCcw, 
  Calculator,
  Flame,
  CheckCircle2,
  Wrench
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { BookingAppointment, CatalogServiceItem } from '../../types';
import { hapticLight, hapticSuccess, hapticMedium } from '../../utils/haptics';
import { UtilitiesEfficiencySection } from './dashboard/UtilitiesEfficiencySection';
import { ServicesAndSuppliesForecast } from './dashboard/ServicesAndSuppliesForecast';

export interface UtilitiesAndToolsViewProps {
  appointments: BookingAppointment[];
  services?: CatalogServiceItem[];
  activeProId?: string;
  isOwner?: boolean;
  onBack?: () => void;
}

export const UtilitiesAndToolsView: React.FC<UtilitiesAndToolsViewProps> = ({
  appointments = [],
  services = [],
  activeProId,
  isOwner = true,
  onBack,
}) => {
  const { isDark } = useTheme();

  // Sub-abas da seção Utilidades: 'utilidades' (Água e Luz), 'insumos' (Previsão de Serviços e Almoxarifado), 'bancada' (Ferramentas)
  const [activeSubTab, setActiveSubTab] = useState<'utilidades' | 'insumos' | 'bancada'>('utilidades');

  // Estados da Calculadora de Bancada (Proporção Química)
  const [colorMassGrams, setColorMassGrams] = useState<number>(60);
  const [ratioMultiplier, setRatioMultiplier] = useState<number>(1.5); // 1:1.5
  const [oxVolume, setOxVolume] = useState<number>(20); // 20 Vol

  // Estados do Timer de Pausa Química
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Efeito do Timer de Bancada
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            hapticSuccess();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds]);

  const handleStartTimer = (minutes: number) => {
    hapticMedium();
    setTimerSeconds(minutes * 60);
    setIsTimerRunning(true);
  };

  const handleToggleTimer = () => {
    hapticLight();
    setIsTimerRunning(!isTimerRunning);
  };

  const handleResetTimer = () => {
    hapticLight();
    setIsTimerRunning(false);
    setTimerSeconds(0);
  };

  // Formatar tempo do timer em MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainderSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainderSecs).padStart(2, '0')}`;
  };

  // Cálculo da mistura química
  const calculatedOxGrams = Math.round(colorMassGrams * ratioMultiplier);
  const totalMixGrams = colorMassGrams + calculatedOxGrams;

  // Total de clientes atendidos para alimentação do módulo de utilidades
  const completedClientsCount = React.useMemo(() => {
    return appointments.filter(a => a.status === 'CONCLUÍDO' || a.status === 'CONFIRMADO').length;
  }, [appointments]);

  return (
    <div className={`w-full h-full flex flex-col overflow-hidden select-none ${
      isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* 1. CABEÇALHO DA SEÇÃO DE UTILIDADES & FERRAMENTAS */}
      <header className={`p-3.5 border-b shrink-0 flex items-center justify-between gap-2 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex items-center gap-2.5 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={() => {
                hapticLight();
                onBack();
              }}
              className={`p-1.5 rounded transition cursor-pointer ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
              }`}
              title="Voltar ao Painel"
              aria-label="Voltar ao Painel"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="w-8 h-8 rounded bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Wrench className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-bold uppercase tracking-wider font-['Poppins'] truncate">
                Utilidades & Ferramentas
              </h2>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500 text-white shadow-xs">
                Gestão
              </span>
            </div>
            <p className={`text-[10px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Água, luz, previsão de insumos e ferramentas de bancada
            </p>
          </div>
        </div>

        {/* Alternador de Sub-Abas: Água & Luz | Insumos | Bancada */}
        <div className={`flex items-center p-0.5 rounded border shrink-0 ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300 shadow-xs'
        }`}>
          <button
            type="button"
            onClick={() => {
              hapticLight();
              setActiveSubTab('utilidades');
            }}
            className={`px-2 py-1 text-[10px] font-bold rounded flex items-center gap-1 transition cursor-pointer whitespace-nowrap ${
              activeSubTab === 'utilidades'
                ? 'bg-emerald-500 text-white shadow-xs'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span className="hidden sm:inline">Água & Luz</span>
          </button>

          <button
            type="button"
            onClick={() => {
              hapticLight();
              setActiveSubTab('insumos');
            }}
            className={`px-2 py-1 text-[10px] font-bold rounded flex items-center gap-1 transition cursor-pointer whitespace-nowrap ${
              activeSubTab === 'insumos'
                ? 'bg-emerald-500 text-white shadow-xs'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <Package className="w-3 h-3" />
            <span className="hidden sm:inline">Insumos & Previsão</span>
          </button>

          <button
            type="button"
            onClick={() => {
              hapticLight();
              setActiveSubTab('bancada');
            }}
            className={`px-2 py-1 text-[10px] font-bold rounded flex items-center gap-1 transition cursor-pointer whitespace-nowrap ${
              activeSubTab === 'bancada'
                ? 'bg-emerald-500 text-white shadow-xs'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <Sliders className="w-3 h-3" />
            <span className="hidden sm:inline">Bancada</span>
          </button>
        </div>
      </header>

      {/* 2. CORPO ROLÁVEL COM CONTEÚDO ESPECÍFICO */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
        {/* SUB-ABA 1: UTILIDADES & EFICIÊNCIA (Água, Luz e Auditoria de Rede) */}
        {activeSubTab === 'utilidades' && (
          <div className="animate-in fade-in duration-150 space-y-3">
            <UtilitiesEfficiencySection
              completedClientsCount={completedClientsCount || 48}
            />
          </div>
        )}

        {/* SUB-ABA 2: PREVISÃO DE SERVIÇOS & ALMOXARIFADO DE INSUMOS */}
        {activeSubTab === 'insumos' && (
          <div className="animate-in fade-in duration-150 space-y-3">
            <ServicesAndSuppliesForecast
              appointments={appointments}
              services={services}
              activeProId={activeProId}
              isOwner={isOwner}
            />
          </div>
        )}

        {/* SUB-ABA 3: FERRAMENTAS PRÁTICAS DE BANCADA */}
        {activeSubTab === 'bancada' && (
          <div className="animate-in fade-in duration-150 space-y-3">
            {/* 1. Timer / Cronômetro de Pausa Química */}
            <div className={`p-3.5 rounded border transition-colors ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/40">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Timer className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold font-['Poppins']">
                      Cronômetro de Pausa Química (Cabelo & Barba)
                    </h3>
                    <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Controle o tempo exato de ação de descolorações, tinturas e tratamentos
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`text-sm font-black font-mono px-2.5 py-1 rounded border ${
                    timerSeconds > 0
                      ? 'bg-amber-500 text-white border-amber-400 animate-pulse'
                      : isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                  }`}>
                    {formatTime(timerSeconds)}
                  </span>
                </div>
              </div>

              {/* Botões Rápidos de Duração de Pausa */}
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {[
                  { label: '10 min', min: 10, desc: 'Tonalização' },
                  { label: '20 min', min: 20, desc: 'Barboterapia' },
                  { label: '35 min', min: 35, desc: 'Coloração' },
                  { label: '45 min', min: 45, desc: 'Descolorante' },
                ].map((preset) => (
                  <button
                    key={preset.min}
                    type="button"
                    onClick={() => handleStartTimer(preset.min)}
                    className={`p-2 rounded border text-center transition cursor-pointer active:scale-95 ${
                      isDark
                        ? 'bg-slate-950/60 hover:bg-slate-800 border-slate-800 text-white'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-900'
                    }`}
                  >
                    <span className="block text-xs font-black">{preset.label}</span>
                    <span className={`block text-[9px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {preset.desc}
                    </span>
                  </button>
                ))}
              </div>

              {/* Controles do Cronômetro: Play / Pausar / Zerar */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/40">
                <button
                  type="button"
                  onClick={handleResetTimer}
                  disabled={timerSeconds === 0}
                  className={`px-3 py-1.5 rounded text-[11px] font-bold border flex items-center gap-1.5 transition cursor-pointer ${
                    timerSeconds === 0
                      ? 'opacity-40 pointer-events-none'
                      : isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Zerar</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleTimer}
                  disabled={timerSeconds === 0}
                  className={`px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                    timerSeconds === 0
                      ? 'opacity-40 pointer-events-none bg-slate-700 text-white'
                      : isTimerRunning
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  }`}
                >
                  {isTimerRunning ? (
                    <>
                      <Pause className="w-3 h-3 text-white" />
                      <span>Pausar</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 text-white" />
                      <span>Continuar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 2. Calculadora de Proporção de Mistura Química (Coloração & OX) */}
            <div className={`p-3.5 rounded border transition-colors ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/40">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Calculator className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold font-['Poppins']">
                      Calculadora de Mistura Química (Balança de Precisão)
                    </h3>
                    <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Evite desperdício pesando a massa exata de oxidante recomendada pelo fabricante
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
                {/* Massa de Coloração / Pó (g) */}
                <div>
                  <label className={`block text-[10px] uppercase font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Massa de Tinta / Pó (g):
                  </label>
                  <input
                    type="number"
                    value={colorMassGrams}
                    onChange={(e) => setColorMassGrams(Math.max(1, parseFloat(e.target.value) || 1))}
                    className={`w-full px-3 py-2 text-sm font-bold font-mono rounded border outline-none ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                {/* Proporção de Mistura (1:1, 1:1.5, 1:2) */}
                <div>
                  <label className={`block text-[10px] uppercase font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Proporção do Fabricante:
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { label: '1:1', value: 1.0 },
                      { label: '1:1.5', value: 1.5 },
                      { label: '1:2', value: 2.0 },
                    ].map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          hapticLight();
                          setRatioMultiplier(p.value);
                        }}
                        className={`py-2 text-xs font-bold rounded border transition cursor-pointer ${
                          ratioMultiplier === p.value
                            ? 'bg-emerald-500 text-white border-emerald-400 font-extrabold shadow-xs'
                            : isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Volumagem do Oxidante */}
                <div>
                  <label className={`block text-[10px] uppercase font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Oxidante (Vol):
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {[10, 20, 30, 40].map((vol) => (
                      <button
                        key={vol}
                        type="button"
                        onClick={() => {
                          hapticLight();
                          setOxVolume(vol);
                        }}
                        className={`py-2 text-xs font-bold rounded border transition cursor-pointer ${
                          oxVolume === vol
                            ? 'bg-emerald-500 text-white border-emerald-400 font-extrabold shadow-xs'
                            : isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        {vol}V
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Resultado da Balança */}
              <div className={`p-3 rounded border flex items-center justify-between ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}>
                <div className="space-y-0.5">
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Peso a adicionar na balança de OX ({oxVolume} Vol):
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black font-mono text-emerald-400">
                      +{calculatedOxGrams}g
                    </span>
                    <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      (Total na cumbuca: <strong className="text-white font-mono">{totalMixGrams}g</strong>)
                    </span>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
