import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Package, 
  ArrowLeft, 
  Wrench, 
  DollarSign, 
  Layers,
  Droplets,
  Building2,
  Gauge
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { BookingAppointment, CatalogServiceItem, UserPersona } from '../../types';
import { hapticLight } from '../../utils/haptics';
import { FinancialManagerView } from './FinancialManagerView';
import { ServicesAndSuppliesForecast } from './dashboard/ServicesAndSuppliesForecast';
import { EnergyMeterManager } from './consumption/EnergyMeterManager';
import { WaterConsumptionManager } from './consumption/WaterConsumptionManager';
import { OperationalEquipmentsManager } from './consumption/OperationalEquipmentsManager';
import { InfrastructureEquipmentsManager } from './consumption/InfrastructureEquipmentsManager';

export type UtilitiesSubTab = 
  | 'hub'
  | 'consumo_hub'
  | 'consumo_energia'
  | 'consumo_agua'
  | 'consumo_equip_operacionais'
  | 'consumo_equip_infra'
  | 'financeiro'
  | 'insumos'
  | 'bancada'
  | 'utilidades';

export interface UtilitiesAndToolsViewProps {
  appointments: BookingAppointment[];
  services?: CatalogServiceItem[];
  activeProId?: string;
  isOwner?: boolean;
  onBack?: () => void;
  salonName?: string;
  currentPersona?: UserPersona;
  initialSubTab?: UtilitiesSubTab;
  onUpdateAppointments?: (appointments: BookingAppointment[]) => void;
}

export const UtilitiesAndToolsView: React.FC<UtilitiesAndToolsViewProps> = ({
  appointments = [],
  services = [],
  activeProId,
  isOwner = true,
  onBack,
  salonName = 'Barbearia Rota 99',
  currentPersona = 'admin',
  initialSubTab = 'hub',
  onUpdateAppointments,
}) => {
  const { isDark } = useTheme();

  // Mapear rota inicial com compatibilidade retroativa
  const resolveInitialSubTab = (tab?: string): UtilitiesSubTab => {
    if (tab === 'bancada') return 'consumo_equip_operacionais';
    if (tab === 'utilidades') return 'consumo_hub';
    if (
      tab === 'consumo_hub' ||
      tab === 'consumo_energia' ||
      tab === 'consumo_agua' ||
      tab === 'consumo_equip_operacionais' ||
      tab === 'consumo_equip_infra' ||
      tab === 'financeiro' ||
      tab === 'insumos'
    ) {
      return tab;
    }
    return 'hub';
  };

  const [activeSubTab, setActiveSubTab] = useState<UtilitiesSubTab>(() => resolveInitialSubTab(initialSubTab));

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(resolveInitialSubTab(initialSubTab));
    }
  }, [initialSubTab]);

  // CARDS DA PORTA DE ENTRADA PRINCIPAL DE UTILIDADES
  const mainHubCards = [
    {
      id: 'consumo_hub' as const,
      name: 'Gerenciamento de Consumo',
      badge: 'Porta de Entrada',
      desc: 'Água, luz, equipamentos e infraestrutura',
      icon: Gauge,
      iconColor: 'text-amber-400',
      iconBg: isDark ? 'bg-amber-500/15 border-amber-500/30' : 'bg-amber-50 border-amber-200',
      badgeStyle: isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      id: 'financeiro' as const,
      name: 'Financeiro',
      badge: 'DRE & Balanço',
      desc: 'Receitas, despesas, comissões e balanço',
      icon: DollarSign,
      iconColor: 'text-emerald-400',
      iconBg: isDark ? 'bg-emerald-500/15 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200',
      badgeStyle: isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      id: 'insumos' as const,
      name: 'Insumos & Estoque',
      badge: 'Previsão & Estoque',
      desc: 'Previsão de produtos e almoxarifado',
      icon: Package,
      iconColor: 'text-purple-400',
      iconBg: isDark ? 'bg-purple-500/15 border-purple-500/30' : 'bg-purple-50 border-purple-200',
      badgeStyle: isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-purple-100 text-purple-800 border-purple-200',
    },
  ];

  // CARDS DA PORTA DE ENTRADA DE CONSUMO (SUB-HUB)
  const consumoCards = [
    {
      id: 'consumo_energia' as const,
      name: 'Energia Elétrica',
      icon: Zap,
      iconColor: 'text-amber-400',
      iconBg: isDark ? 'bg-amber-500/15 border-amber-500/30' : 'bg-amber-50 border-amber-200',
    },
    {
      id: 'consumo_agua' as const,
      name: 'Água',
      icon: Droplets,
      iconColor: 'text-cyan-400',
      iconBg: isDark ? 'bg-cyan-500/15 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200',
    },
    {
      id: 'consumo_equip_operacionais' as const,
      name: 'Operação',
      icon: Wrench,
      iconColor: 'text-emerald-400',
      iconBg: isDark ? 'bg-emerald-500/15 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200',
    },
    {
      id: 'consumo_equip_infra' as const,
      name: 'Infraestrutura',
      icon: Building2,
      iconColor: 'text-blue-400',
      iconBg: isDark ? 'bg-blue-500/15 border-blue-500/30' : 'bg-blue-50 border-blue-200',
    },
  ];

  // Helper de Navegação do Botão Voltar
  const isInsideConsumoTool = [
    'consumo_energia',
    'consumo_agua',
    'consumo_equip_operacionais',
    'consumo_equip_infra'
  ].includes(activeSubTab);

  const handleBackNavigation = () => {
    hapticLight();
    if (isInsideConsumoTool) {
      setActiveSubTab('consumo_hub');
    } else if (activeSubTab === 'consumo_hub' || activeSubTab === 'financeiro' || activeSubTab === 'insumos') {
      setActiveSubTab('hub');
    } else if (onBack) {
      onBack();
    }
  };

  // Título e Subtítulo dinâmicos do cabeçalho
  const getHeaderInfo = () => {
    switch (activeSubTab) {
      case 'consumo_hub':
        return {
          title: 'Gerenciamento de Consumo',
          badge: 'Porta de Entrada',
          desc: 'Energia elétrica, água, operação e infraestrutura',
          icon: Gauge,
        };
      case 'consumo_energia':
        return {
          title: 'Energia Elétrica',
          badge: 'Consumo',
          desc: 'Previsão de fatura e medição do relógio',
          icon: Zap,
        };
      case 'consumo_agua':
        return {
          title: 'Água',
          badge: 'Consumo',
          desc: 'Previsão de fatura e controle de hidrômetro',
          icon: Droplets,
        };
      case 'consumo_equip_operacionais':
        return {
          title: 'Operação',
          badge: 'Equipamentos',
          desc: 'Equipamentos operacionais e bancada',
          icon: Wrench,
        };
      case 'consumo_equip_infra':
        return {
          title: 'Infraestrutura',
          badge: 'Equipamentos',
          desc: 'Eletrodomésticos, copa e climatização',
          icon: Building2,
        };
      case 'financeiro':
        return {
          title: 'Financeiro',
          badge: 'Ferramenta',
          desc: 'DRE, despesas, balanço e comissões',
          icon: DollarSign,
        };
      case 'insumos':
        return {
          title: 'Insumos & Estoque',
          badge: 'Ferramenta',
          desc: 'Previsão de produtos e suprimentos',
          icon: Package,
        };
      default:
        return {
          title: 'Utilidades & Ferramentas',
          badge: 'Porta de Entrada',
          desc: 'Selecione uma ferramenta operacional abaixo',
          icon: Layers,
        };
    }
  };

  const headerInfo = getHeaderInfo();
  const HeaderIcon = headerInfo.icon;

  return (
    <div className={`w-full h-full flex flex-col overflow-hidden select-none ${
      isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* 1. CABEÇALHO */}
      <header className={`p-3.5 border-b shrink-0 flex items-center justify-between gap-2 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            id="utilidades-btn-voltar"
            onClick={handleBackNavigation}
            className={`p-1.5 rounded transition cursor-pointer ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
            }`}
            title={activeSubTab !== 'hub' ? 'Voltar' : 'Voltar ao Painel'}
            aria-label="Voltar"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="w-8 h-8 rounded bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <HeaderIcon className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-bold uppercase tracking-wider font-['Poppins'] truncate">
                {headerInfo.title}
              </h2>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500 text-white shadow-xs">
                {headerInfo.badge}
              </span>
            </div>
            <p className={`text-[10px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {headerInfo.desc}
            </p>
          </div>
        </div>

        {/* Atalhos Rápidos no Cabeçalho */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isInsideConsumoTool && (
            <button
              type="button"
              onClick={() => {
                hapticLight();
                setActiveSubTab('consumo_hub');
              }}
              className={`px-2.5 py-1 text-[11px] font-bold rounded border flex items-center gap-1.5 transition cursor-pointer ${
                isDark 
                  ? 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30 text-amber-300' 
                  : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Consumo</span>
            </button>
          )}

          {activeSubTab !== 'hub' && (
            <button
              type="button"
              onClick={() => {
                hapticLight();
                setActiveSubTab('hub');
              }}
              className={`px-2.5 py-1 text-[11px] font-bold rounded border flex items-center gap-1.5 transition cursor-pointer ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' 
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Todas as Ferramentas</span>
              <span className="sm:hidden">Menu</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. CORPO ROLÁVEL COM CONTEÚDO */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-4 max-w-4xl mx-auto w-full">
        {/* PORTA DE ENTRADA PRINCIPAL: CARDS QUADRADOS DAS FERRAMENTAS */}
        {activeSubTab === 'hub' && (
          <div className="space-y-4 animate-in fade-in duration-150 py-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Porta de Entrada — Ferramentas</span>
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                isDark ? 'bg-slate-900 border border-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
              }`}>
                {mainHubCards.length} Módulos
              </span>
            </div>

            {/* GRADE DE CARDS QUADRADOS LADO A LADO */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {mainHubCards.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    id={`tool-card-${tool.id}`}
                    type="button"
                    onClick={() => {
                      hapticLight();
                      setActiveSubTab(tool.id);
                    }}
                    className={`aspect-square w-full rounded-2xl border p-3.5 sm:p-4 flex flex-col justify-between items-center text-center transition-all duration-200 cursor-pointer active:scale-95 group hover:shadow-lg ${
                      isDark
                        ? 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 shadow-xs'
                    }`}
                  >
                    <div className="w-full flex items-center justify-center">
                      <span className={`text-[8.5px] sm:text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border whitespace-nowrap ${tool.badgeStyle}`}>
                        {tool.badge}
                      </span>
                    </div>

                    <div className={`w-13 h-13 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-110 shadow-xs ${tool.iconBg}`}>
                      <Icon className={`w-6 h-6 sm:w-8 sm:h-8 stroke-[1.8] ${tool.iconColor}`} />
                    </div>

                    <div className="w-full">
                      <h3 className={`font-bold font-['Poppins'] text-xs sm:text-[13px] tracking-tight truncate leading-tight ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                        {tool.name}
                      </h3>
                      <p className={`text-[9.5px] sm:text-[10px] mt-0.5 line-clamp-1 ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        {tool.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* SUB-HUB: PORTA DE ENTRADA DO GERENCIAMENTO DE CONSUMO */}
        {activeSubTab === 'consumo_hub' && (
          <div className="space-y-4 animate-in fade-in duration-150 py-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 shrink-0" />
                <span>Gerenciamento de Consumo</span>
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                isDark ? 'bg-slate-900 border border-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
              }`}>
                4 Ferramentas
              </span>
            </div>

            {/* GRADE DE 4 CARDS QUADRADOS LADO A LADO */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {consumoCards.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    id={`consumo-card-${tool.id}`}
                    type="button"
                    onClick={() => {
                      hapticLight();
                      setActiveSubTab(tool.id);
                    }}
                    className={`aspect-square w-full rounded-2xl border p-4 flex flex-col justify-center items-center text-center gap-3 transition-all duration-200 cursor-pointer active:scale-95 group hover:shadow-lg ${
                      isDark
                        ? 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 shadow-xs'
                    }`}
                  >
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-110 shadow-xs ${tool.iconBg}`}>
                      <Icon className={`w-7 h-7 sm:w-8 sm:h-8 stroke-[1.8] ${tool.iconColor}`} />
                    </div>

                    <h3 className={`font-bold font-['Poppins'] text-xs sm:text-[13px] tracking-tight truncate leading-tight ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      {tool.name}
                    </h3>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* FERRAMENTA CONSUMO 1: ENERGIA ELÉTRICA (REGISTRO DO RELÓGIO & LISTA) */}
        {activeSubTab === 'consumo_energia' && (
          <div className="animate-in fade-in duration-150">
            <EnergyMeterManager />
          </div>
        )}

        {/* FERRAMENTA CONSUMO 2: ÁGUA (CONSUMO BÁSICO & HIDRÔMETRO) */}
        {activeSubTab === 'consumo_agua' && (
          <div className="animate-in fade-in duration-150">
            <WaterConsumptionManager />
          </div>
        )}

        {/* FERRAMENTA CONSUMO 3: EQUIPAMENTOS OPERACIONAIS */}
        {activeSubTab === 'consumo_equip_operacionais' && (
          <div className="animate-in fade-in duration-150">
            <OperationalEquipmentsManager />
          </div>
        )}

        {/* FERRAMENTA CONSUMO 4: EQUIPAMENTOS DE INFRAESTRUTURA */}
        {activeSubTab === 'consumo_equip_infra' && (
          <div className="animate-in fade-in duration-150">
            <InfrastructureEquipmentsManager />
          </div>
        )}

        {/* FERRAMENTA GERAL 1: GESTÃO FINANCEIRA (DRE, Despesas, Balanço, Comissões) */}
        {activeSubTab === 'financeiro' && (
          <div className="animate-in fade-in duration-150">
            <FinancialManagerView
              appointments={appointments}
              onUpdateAppointments={onUpdateAppointments}
              salonName={salonName}
              currentPersona={currentPersona}
            />
          </div>
        )}

        {/* FERRAMENTA GERAL 2: INSUMOS & ESTOQUE */}
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
      </div>
    </div>
  );
};


