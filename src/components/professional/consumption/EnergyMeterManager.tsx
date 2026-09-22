import React, { useState, useEffect, useMemo } from 'react';
import { 
  Zap, 
  Plus, 
  Trash2, 
  Gauge, 
  Calendar, 
  DollarSign, 
  CheckCircle2,
  Sliders,
  Calculator,
  ArrowRight,
  Info
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { hapticLight, hapticSuccess } from '../../../utils/haptics';
import { EnergyReading, EnergyTariffConfig } from './consumptionTypes';

export const DEFAULT_ENERGY_TARIFF: EnergyTariffConfig = {
  concessionaria: 'Enel SP (Padrão)',
  teRate: 0.342, // R$/kWh Geração
  tusdRate: 0.448, // R$/kWh Distribuição
  flagType: 'Verde',
  flagRate: 0.0,
  icmsPercent: 18, // 18% ICMS
  pisCofinsPercent: 5.4, // 5.4% PIS/COFINS
  cosipFixed: 32.5, // Iluminação Pública (R$)
};

interface EquipmentHourlyRateItem {
  id: string;
  name: string;
  category: 'Operacional' | 'Infraestrutura';
  powerWatts: number;
  kwhPerHour: number; // Consumo por hora (kWh/h)
  hoursPerDay: number; // Horas de uso diário
}

const DEFAULT_EQUIPMENTS_HOURLY: EquipmentHourlyRateItem[] = [
  { id: 'eq-secador', name: 'Secador de Cabelo Pro', category: 'Operacional', powerWatts: 2400, kwhPerHour: 2.4, hoursPerDay: 4.5 },
  { id: 'eq-lavatorio', name: 'Aquecedor de Lavatório', category: 'Operacional', powerWatts: 4500, kwhPerHour: 4.5, hoursPerDay: 2.0 },
  { id: 'eq-maquinas', name: 'Máquinas de Corte (Bancada)', category: 'Operacional', powerWatts: 30, kwhPerHour: 0.03, hoursPerDay: 7.0 },
  { id: 'eq-prancha', name: 'Prancha Térmica / Chapinha', category: 'Operacional', powerWatts: 60, kwhPerHour: 0.06, hoursPerDay: 2.0 },
  { id: 'eq-ar', name: 'Ar-Condicionado Salão', category: 'Infraestrutura', powerWatts: 1400, kwhPerHour: 1.4, hoursPerDay: 8.0 },
  { id: 'eq-microondas', name: 'Micro-ondas (Copa)', category: 'Infraestrutura', powerWatts: 1200, kwhPerHour: 1.2, hoursPerDay: 0.8 },
  { id: 'eq-geladeira', name: 'Geladeira / Refrigerador', category: 'Infraestrutura', powerWatts: 180, kwhPerHour: 0.18, hoursPerDay: 24.0 },
  { id: 'eq-cafeteira', name: 'Máquina de Café Espresso', category: 'Infraestrutura', powerWatts: 1000, kwhPerHour: 1.0, hoursPerDay: 1.5 },
];

const INITIAL_ENERGY_READINGS: EnergyReading[] = [
  {
    id: 'en-1',
    date: '2026-06-20',
    meterReadingKwh: 14200,
    consumptionPeriodKwh: 410,
    costAmountReais: 422.30,
    notes: 'Ciclo Junho',
  },
  {
    id: 'en-2',
    date: '2026-07-20',
    meterReadingKwh: 14640,
    consumptionPeriodKwh: 440,
    costAmountReais: 453.20,
    notes: 'Ciclo Julho (Uso ar-condicionado)',
  },
  {
    id: 'en-3',
    date: '2026-08-20',
    meterReadingKwh: 15060,
    consumptionPeriodKwh: 420,
    costAmountReais: 432.60,
    notes: 'Ciclo Agosto',
  },
  {
    id: 'en-4',
    date: '2026-09-20',
    meterReadingKwh: 15495,
    consumptionPeriodKwh: 435,
    costAmountReais: 448.05,
    notes: 'Último Mês registrado',
  },
];

export const EnergyMeterManager: React.FC = () => {
  const { isDark } = useTheme();

  // Sub-aba interna: 'leitura' | 'config' | 'equipamentos'
  const [activeTab, setActiveTab] = useState<'leitura' | 'config' | 'equipamentos'>('leitura');

  // 1. Configuração Tarifária ANEEL
  const [tariff, setTariff] = useState<EnergyTariffConfig>(() => {
    try {
      const stored = localStorage.getItem('vagou_energy_tariff_config');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return DEFAULT_ENERGY_TARIFF;
  });

  const handleSaveTariff = (updated: EnergyTariffConfig) => {
    setTariff(updated);
    try {
      localStorage.setItem('vagou_energy_tariff_config', JSON.stringify(updated));
    } catch {
      // ignore
    }
    hapticSuccess();
  };

  // Cálculo da Tarifa Efetiva ANEEL com tributos por dentro
  const effectiveKwhRate = useMemo(() => {
    const basePure = tariff.teRate + tariff.tusdRate + tariff.flagRate;
    const totalTaxPercent = (tariff.icmsPercent + tariff.pisCofinsPercent) / 100;
    if (totalTaxPercent >= 0.99) return basePure * 1.3;
    // Cálculo tributário padrão brasileiro (ICMS e PIS/COFINS por dentro)
    return basePure / (1 - totalTaxPercent);
  }, [tariff]);

  // 2. Histórico de Leituras do Relógio
  const [readings, setReadings] = useState<EnergyReading[]>(() => {
    try {
      const stored = localStorage.getItem('vagou_energy_meter_readings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_ENERGY_READINGS;
  });

  // Ordenar medições por data decrescente
  const sortedReadings = useMemo(() => {
    return [...readings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [readings]);

  const latestReading = sortedReadings[0];

  // 3. Simulador & Previsão da Conta com Medidor Atual
  const [currentMeterInput, setCurrentMeterInput] = useState<string>('');
  const [dayOfCycle, setDayOfCycle] = useState<number>(15); // Dia atual do ciclo (ex: 15 de 30 dias)

  // Cálculo da Previsão em Tempo Real
  const forecastData = useMemo(() => {
    const currentVal = parseFloat(currentMeterInput);
    if (!latestReading || isNaN(currentVal) || currentVal <= latestReading.meterReadingKwh) {
      return null;
    }

    const consumedSoFar = currentVal - latestReading.meterReadingKwh;
    const validDays = Math.max(1, Math.min(30, dayOfCycle));
    // Projeção proporcional para ciclo de 30 dias
    const projectedKwhTotal = Math.round((consumedSoFar / validDays) * 30);
    
    // Cálculo dos componentes da conta
    const baseEnergyPure = projectedKwhTotal * tariff.teRate;
    const baseDistributionPure = projectedKwhTotal * tariff.tusdRate;
    const flagCost = projectedKwhTotal * tariff.flagRate;
    const pureSubtotal = baseEnergyPure + baseDistributionPure + flagCost;
    
    const taxRate = (tariff.icmsPercent + tariff.pisCofinsPercent) / 100;
    const taxesAmount = taxRate < 0.99 ? (pureSubtotal / (1 - taxRate)) - pureSubtotal : pureSubtotal * taxRate;
    const totalProjectedBill = pureSubtotal + taxesAmount + tariff.cosipFixed;

    // Custo acumulado até o momento
    const soFarSubtotal = consumedSoFar * (tariff.teRate + tariff.tusdRate + tariff.flagRate);
    const soFarTaxes = taxRate < 0.99 ? (soFarSubtotal / (1 - taxRate)) - soFarSubtotal : soFarSubtotal * taxRate;
    const totalSoFar = soFarSubtotal + soFarTaxes + (tariff.cosipFixed * (validDays / 30));

    return {
      consumedSoFar,
      projectedKwhTotal,
      baseEnergyPure,
      baseDistributionPure,
      flagCost,
      taxesAmount,
      totalProjectedBill,
      totalSoFar,
    };
  }, [currentMeterInput, latestReading, dayOfCycle, tariff]);

  // Salvar Leitura do Simulador como Registro Oficial
  const handleSaveSimulatedReading = () => {
    if (!forecastData || !currentMeterInput) return;
    hapticSuccess();

    const newRecord: EnergyReading = {
      id: `energy-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      meterReadingKwh: parseFloat(currentMeterInput),
      consumptionPeriodKwh: forecastData.consumedSoFar,
      costAmountReais: forecastData.totalProjectedBill,
      notes: `Previsão dia ${dayOfCycle}/30 (${forecastData.projectedKwhTotal} kWh projetados)`,
    };

    const updated = [newRecord, ...readings];
    setReadings(updated);
    try {
      localStorage.setItem('vagou_energy_meter_readings', JSON.stringify(updated));
    } catch {
      // ignore
    }
    setCurrentMeterInput('');
  };

  const handleDeleteReading = (id: string) => {
    hapticLight();
    const updated = readings.filter(r => r.id !== id);
    setReadings(updated);
    try {
      localStorage.setItem('vagou_energy_meter_readings', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // 4. Equipamentos com Consumo por Hora
  const [equipmentsHourly, setEquipmentsHourly] = useState<EquipmentHourlyRateItem[]>(() => {
    try {
      const stored = localStorage.getItem('vagou_energy_equipments_hourly');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_EQUIPMENTS_HOURLY;
  });

  const handleUpdateEquipmentConsumption = (id: string, newKwhHour: number, newHoursDay: number) => {
    const updated = equipmentsHourly.map(eq => {
      if (eq.id === id) {
        return {
          ...eq,
          kwhPerHour: Math.max(0.001, newKwhHour),
          hoursPerDay: Math.max(0.1, newHoursDay),
          powerWatts: Math.round(newKwhHour * 1000),
        };
      }
      return eq;
    });
    setEquipmentsHourly(updated);
    try {
      localStorage.setItem('vagou_energy_equipments_hourly', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Custo mensal total estimado dos equipamentos
  const totalEquipmentsMonthlyCost = useMemo(() => {
    return equipmentsHourly.reduce((acc, eq) => {
      // 26 dias úteis no mês
      const monthlyKwh = eq.kwhPerHour * eq.hoursPerDay * 26;
      return acc + (monthlyKwh * effectiveKwhRate);
    }, 0);
  }, [equipmentsHourly, effectiveKwhRate]);

  return (
    <div className="space-y-3.5 animate-in fade-in duration-150">
      {/* 1. SELETOR DE MODO / SUB-ABAS (Zero blablabla, ultra-sintético) */}
      <div className={`p-1 rounded-xl border flex items-center gap-1 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <button
          type="button"
          onClick={() => {
            hapticLight();
            setActiveTab('leitura');
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'leitura'
              ? 'bg-amber-500 text-white shadow-xs'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>Medidor & Previsão</span>
        </button>

        <button
          type="button"
          onClick={() => {
            hapticLight();
            setActiveTab('config');
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'config'
              ? 'bg-amber-500 text-white shadow-xs'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Tarifa & Impostos</span>
        </button>

        <button
          type="button"
          onClick={() => {
            hapticLight();
            setActiveTab('equipamentos');
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'equipamentos'
              ? 'bg-amber-500 text-white shadow-xs'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Consumo / Hora</span>
        </button>
      </div>

      {/* ========================================================
          ABA 1: MEDIDOR, SIMULAÇÃO E PREVISÃO DA CONTA NO FIM DO MÊS
         ======================================================== */}
      {activeTab === 'leitura' && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          {/* Card do Simulador / Previsão */}
          <div className={`p-4 rounded-xl border space-y-3 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold font-['Poppins'] text-white">
                    Previsão da Conta de Energia
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Insira o número do relógio para prever a fatura final
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[9px] uppercase font-bold text-slate-400">Tarifa Efetiva</span>
                <p className="text-xs font-mono font-bold text-emerald-400">
                  R$ {effectiveKwhRate.toFixed(3)}/kWh
                </p>
              </div>
            </div>

            {/* Inputs do Medidor e Dia do Ciclo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1 text-slate-400">
                  Número Atual do Medidor (kWh) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    placeholder={latestReading ? `Ex: ${latestReading.meterReadingKwh + 180}` : 'Ex: 15600'}
                    value={currentMeterInput}
                    onChange={(e) => setCurrentMeterInput(e.target.value)}
                    className={`w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border outline-none ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-amber-400">
                    kWh
                  </span>
                </div>
                {latestReading && (
                  <p className="text-[9px] text-slate-500 mt-1">
                    Último registro: <strong className="text-slate-300">{latestReading.meterReadingKwh} kWh</strong> ({latestReading.date})
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase mb-1 text-slate-400">
                  Dias Decorridos no Ciclo (1 a 30)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={dayOfCycle}
                    onChange={(e) => setDayOfCycle(parseInt(e.target.value, 10))}
                    className="flex-1 accent-amber-500"
                  />
                  <span className="w-12 text-center text-xs font-mono font-bold py-1 px-1.5 rounded bg-slate-950 border border-slate-800 text-white">
                    {dayOfCycle}d
                  </span>
                </div>
                <p className="text-[9px] text-slate-500 mt-1">
                  Projeção proporcional calculada para o ciclo completo de 30 dias
                </p>
              </div>
            </div>

            {/* Resultado da Previsão Calculada */}
            {forecastData && (
              <div className={`p-3.5 rounded-lg border space-y-2.5 animate-in slide-in-from-top-2 duration-200 ${
                isDark ? 'bg-slate-950/70 border-amber-500/40' : 'bg-amber-50/70 border-amber-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Estimativa Final do Mês</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Projeção: {forecastData.projectedKwhTotal} kWh
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-0.5">
                  <div>
                    <span className="text-2xl font-black font-mono text-emerald-400">
                      R$ {forecastData.totalProjectedBill.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Gasto até hoje ({dayOfCycle}d): R$ {forecastData.totalSoFar.toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveSimulatedReading}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Salvar no Histórico</span>
                  </button>
                </div>

                {/* Memória de Cálculo ANEEL (Transparência Total) */}
                <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[9.5px]">
                  <div>
                    <span className="text-slate-500 block">Energia (TE):</span>
                    <span className="font-mono text-slate-200">R$ {forecastData.baseEnergyPure.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Distribuição (TUSD):</span>
                    <span className="font-mono text-slate-200">R$ {forecastData.baseDistributionPure.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Impostos (ICMS/PIS):</span>
                    <span className="font-mono text-slate-200">R$ {forecastData.taxesAmount.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Ilum. Pública (COSIP):</span>
                    <span className="font-mono text-slate-200">R$ {tariff.cosipFixed.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Histórico das Leituras Passadas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Histórico de Leituras & Faturas ({readings.length})
              </span>
            </div>

            <div className="space-y-2">
              {sortedReadings.map((r) => (
                <div
                  key={r.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <Gauge className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black font-mono text-white">
                          {r.meterReadingKwh.toLocaleString('pt-BR')} kWh
                        </span>
                        {r.consumptionPeriodKwh && (
                          <span className="text-[10px] font-mono font-bold text-amber-400">
                            (+{r.consumptionPeriodKwh} kWh)
                          </span>
                        )}
                      </div>
                      <span className="text-[9.5px] text-slate-400 block truncate">
                        {r.date} {r.notes ? `• ${r.notes}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {r.costAmountReais && (
                      <span className="text-xs font-black font-mono text-emerald-400">
                        R$ {r.costAmountReais.toFixed(2).replace('.', ',')}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteReading(r.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 transition cursor-pointer"
                      title="Excluir medição"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          ABA 2: PRÉ-CONFIGURAÇÃO DA TARIFA (COMPOSIÇÃO ANEEL)
         ======================================================== */}
      {activeTab === 'config' && (
        <div className={`p-4 rounded-xl border space-y-4 animate-in fade-in duration-150 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div>
            <h4 className="text-xs font-bold font-['Poppins'] text-white flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Composição da Conta de Energia (ANEEL)</span>
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Ajuste as tarifas da sua concessionária para prever a conta com precisão real
            </p>
          </div>

          {/* Presets Rápidos de Distribuidora */}
          <div>
            <label className="block text-[10px] font-bold uppercase mb-1.5 text-slate-400">
              Concessionária / Modelo Pré-definido:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { name: 'Enel SP', te: 0.342, tusd: 0.448, icms: 18, pis: 5.4, cosip: 32.5 },
                { name: 'CPFL Paulista', te: 0.365, tusd: 0.462, icms: 18, pis: 5.8, cosip: 28.0 },
                { name: 'Cemig MG', te: 0.380, tusd: 0.490, icms: 18, pis: 5.5, cosip: 35.0 },
                { name: 'Light RJ', te: 0.395, tusd: 0.520, icms: 20, pis: 6.0, cosip: 38.0 },
              ].map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    handleSaveTariff({
                      ...tariff,
                      concessionaria: c.name,
                      teRate: c.te,
                      tusdRate: c.tusd,
                      icmsPercent: c.icms,
                      pisCofinsPercent: c.pis,
                      cosipFixed: c.cosip,
                    });
                  }}
                  className={`py-1.5 px-2 text-xs font-bold rounded-lg border transition cursor-pointer ${
                    tariff.concessionaria === c.name
                      ? 'bg-amber-500 text-white border-amber-400'
                      : isDark ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Campos Tarifários Manuais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1 text-slate-400">
                Tarifa TE (Geração) — R$/kWh
              </label>
              <input
                type="number"
                step="0.001"
                value={tariff.teRate}
                onChange={(e) => handleSaveTariff({ ...tariff, teRate: parseFloat(e.target.value) || 0 })}
                className={`w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border outline-none ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase mb-1 text-slate-400">
                Tarifa TUSD (Distribuição/Rede) — R$/kWh
              </label>
              <input
                type="number"
                step="0.001"
                value={tariff.tusdRate}
                onChange={(e) => handleSaveTariff({ ...tariff, tusdRate: parseFloat(e.target.value) || 0 })}
                className={`w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border outline-none ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase mb-1 text-slate-400">
                Bandeira Tarifária
              </label>
              <select
                value={tariff.flagType}
                onChange={(e) => {
                  const fType = e.target.value as EnergyTariffConfig['flagType'];
                  const rates: Record<string, number> = {
                    'Verde': 0.0,
                    'Amarela': 0.01885,
                    'Vermelha 1': 0.04463,
                    'Vermelha 2': 0.07877,
                  };
                  handleSaveTariff({ ...tariff, flagType: fType, flagRate: rates[fType] || 0 });
                }}
                className={`w-full px-3 py-1.5 text-xs rounded-lg border outline-none ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                <option value="Verde">Verde (Sem acréscimo)</option>
                <option value="Amarela">Amarela (+ R$ 0,0188/kWh)</option>
                <option value="Vermelha 1">Vermelha Patamar 1 (+ R$ 0,0446/kWh)</option>
                <option value="Vermelha 2">Vermelha Patamar 2 (+ R$ 0,0787/kWh)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase mb-1 text-slate-400">
                Iluminação Pública (COSIP / CIP) — R$ Fixo
              </label>
              <input
                type="number"
                step="0.5"
                value={tariff.cosipFixed}
                onChange={(e) => handleSaveTariff({ ...tariff, cosipFixed: parseFloat(e.target.value) || 0 })}
                className={`w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border outline-none ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase mb-1 text-slate-400">
                Alíquota ICMS (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={tariff.icmsPercent}
                onChange={(e) => handleSaveTariff({ ...tariff, icmsPercent: parseFloat(e.target.value) || 0 })}
                className={`w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border outline-none ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase mb-1 text-slate-400">
                PIS + COFINS (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={tariff.pisCofinsPercent}
                onChange={(e) => handleSaveTariff({ ...tariff, pisCofinsPercent: parseFloat(e.target.value) || 0 })}
                className={`w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border outline-none ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>

          {/* Resumo da Tarifa Efetiva Final */}
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-white block">
                  Tarifa Efetiva com Tributos Calculados
                </span>
                <span className="text-[10px] text-slate-400">
                  (TE + TUSD + Bandeira) com ICMS e PIS/COFINS por dentro
                </span>
              </div>
            </div>
            <span className="text-base font-black font-mono text-emerald-400">
              R$ {effectiveKwhRate.toFixed(3)} <span className="text-[10px]">/ kWh</span>
            </span>
          </div>
        </div>
      )}

      {/* ========================================================
          ABA 3: CONSUMO POR HORA DE CADA EQUIPAMENTO (Secador, etc.)
         ======================================================== */}
      {activeTab === 'equipamentos' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between px-1">
            <div>
              <h4 className="text-xs font-bold font-['Poppins'] text-white">
                Consumo por Hora dos Equipamentos
              </h4>
              <p className="text-[10px] text-slate-400">
                Insira o consumo por hora (kWh/h) e horas de uso diário
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400">
              Total Est.: R$ {totalEquipmentsMonthlyCost.toFixed(2)}/mês
            </span>
          </div>

          <div className="space-y-2">
            {equipmentsHourly.map((eq) => {
              const costPerHour = eq.kwhPerHour * effectiveKwhRate;
              const monthlyCost = eq.kwhPerHour * eq.hoursPerDay * 26 * effectiveKwhRate;

              return (
                <div
                  key={eq.id}
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold font-['Poppins'] text-white truncate">
                        {eq.name}
                      </h5>
                      <span className="text-[9.5px] text-slate-400">
                        {eq.category} • {eq.powerWatts}W
                      </span>
                    </div>
                  </div>

                  {/* Campos Editáveis de Consumo / Hora e Horas / Dia */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <div>
                      <span className="block text-[8.5px] uppercase font-bold text-slate-400">Consumo (kWh/h)</span>
                      <input
                        type="number"
                        step="0.01"
                        value={eq.kwhPerHour}
                        onChange={(e) => handleUpdateEquipmentConsumption(eq.id, parseFloat(e.target.value) || 0.01, eq.hoursPerDay)}
                        className={`w-18 px-2 py-1 text-xs font-mono font-bold rounded border outline-none text-right ${
                          isDark ? 'bg-slate-950 border-slate-700 text-amber-300' : 'bg-slate-50 border-slate-300 text-amber-800'
                        }`}
                      />
                    </div>

                    <div>
                      <span className="block text-[8.5px] uppercase font-bold text-slate-400">Uso (h/dia)</span>
                      <input
                        type="number"
                        step="0.5"
                        value={eq.hoursPerDay}
                        onChange={(e) => handleUpdateEquipmentConsumption(eq.id, eq.kwhPerHour, parseFloat(e.target.value) || 0.1)}
                        className={`w-14 px-2 py-1 text-xs font-mono font-bold rounded border outline-none text-right ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>

                    <div className="text-right min-w-[70px]">
                      <span className="block text-[8.5px] uppercase font-bold text-slate-400">Custo/Hora</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        R$ {costPerHour.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
