import React, { useState } from 'react';
import { 
  Wrench, 
  Plus, 
  Trash2, 
  Zap, 
  CheckCircle2, 
  Clock
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { hapticLight, hapticSuccess } from '../../../utils/haptics';
import { OperationalEquipment } from './consumptionTypes';

const INITIAL_OPERATIONAL_EQUIPMENTS: OperationalEquipment[] = [
  {
    id: 'op-1',
    name: 'Secador Taiff Titanium 2400W',
    category: 'Térmico & Secagem',
    voltage: '220V',
    powerWatts: 2400,
    kwhPerHour: 2.4,
    avgHoursPerDay: 4.5,
    lastMaintenance: '01/09/2026',
    status: 'Operacional',
  },
  {
    id: 'op-2',
    name: 'Aquecedor do Lavatório de Cabelo',
    category: 'Lavatório & Água',
    voltage: '220V',
    powerWatts: 4500,
    kwhPerHour: 4.5,
    avgHoursPerDay: 2.0,
    lastMaintenance: '15/07/2026',
    status: 'Operacional',
  },
  {
    id: 'op-3',
    name: 'Máquina de Corte Magic Clip',
    category: 'Corte & Acabamento',
    voltage: 'Bivolt',
    powerWatts: 30,
    kwhPerHour: 0.03,
    avgHoursPerDay: 7.0,
    lastMaintenance: '10/09/2026',
    status: 'Operacional',
  },
  {
    id: 'op-4',
    name: 'Máquina de Acabamento Detailer',
    category: 'Corte & Acabamento',
    voltage: 'Bivolt',
    powerWatts: 15,
    kwhPerHour: 0.015,
    avgHoursPerDay: 5.0,
    lastMaintenance: '12/09/2026',
    status: 'Operacional',
  },
  {
    id: 'op-5',
    name: 'Prancha Térmica Babyliss Pro',
    category: 'Térmico & Secagem',
    voltage: 'Bivolt',
    powerWatts: 60,
    kwhPerHour: 0.06,
    avgHoursPerDay: 2.5,
    lastMaintenance: '05/08/2026',
    status: 'Operacional',
  },
];

export const OperationalEquipmentsManager: React.FC = () => {
  const { isDark } = useTheme();

  const [equipments, setEquipments] = useState<OperationalEquipment[]>(() => {
    try {
      const stored = localStorage.getItem('vagou_operational_equipments');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: Partial<OperationalEquipment>) => ({
            ...item,
            kwhPerHour: item.kwhPerHour ?? ((item.powerWatts || 100) / 1000),
            avgHoursPerDay: item.avgHoursPerDay ?? 3.0,
          })) as OperationalEquipment[];
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_OPERATIONAL_EQUIPMENTS;
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<OperationalEquipment['category']>('Corte & Acabamento');
  const [voltage, setVoltage] = useState<OperationalEquipment['voltage']>('Bivolt');
  const [powerWatts, setPowerWatts] = useState<number>(2400);
  const [kwhPerHour, setKwhPerHour] = useState<number>(2.4);
  const [avgHoursPerDay, setAvgHoursPerDay] = useState<number>(4.0);
  const [status, setStatus] = useState<OperationalEquipment['status']>('Operacional');

  const handlePowerChange = (w: number) => {
    setPowerWatts(w);
    setKwhPerHour(parseFloat((w / 1000).toFixed(3)));
  };

  const handleAddEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    hapticSuccess();

    const newEq: OperationalEquipment = {
      id: `op-eq-${Date.now()}`,
      name: name.trim(),
      category,
      voltage,
      powerWatts: powerWatts > 0 ? powerWatts : 15,
      kwhPerHour: kwhPerHour > 0 ? kwhPerHour : 0.015,
      avgHoursPerDay: avgHoursPerDay > 0 ? avgHoursPerDay : 1.0,
      lastMaintenance: new Date().toLocaleDateString('pt-BR'),
      status,
    };

    const updated = [newEq, ...equipments];
    setEquipments(updated);
    try {
      localStorage.setItem('vagou_operational_equipments', JSON.stringify(updated));
    } catch {
      // ignore
    }

    setName('');
    setShowAddForm(false);
  };

  const handleUpdateInline = (id: string, newKwh: number, newHours: number) => {
    const updated = equipments.map(eq => {
      if (eq.id === id) {
        return {
          ...eq,
          kwhPerHour: Math.max(0.001, newKwh),
          avgHoursPerDay: Math.max(0.1, newHours),
          powerWatts: Math.round(newKwh * 1000),
        };
      }
      return eq;
    });
    setEquipments(updated);
    try {
      localStorage.setItem('vagou_operational_equipments', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleDeleteEquipment = (id: string) => {
    hapticLight();
    const updated = equipments.filter(eq => eq.id !== id);
    setEquipments(updated);
    try {
      localStorage.setItem('vagou_operational_equipments', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-3.5 animate-in fade-in duration-150">
      {/* Header com Ação */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-xs font-bold font-['Poppins'] text-white flex items-center gap-1.5">
            <span>Operação</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {equipments.length} Ativos
            </span>
          </h3>
          <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Controle de consumo por hora e potência de secadores e bancada
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            hapticLight();
            setShowAddForm(!showAddForm);
          }}
          className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-xs active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Cadastrar</span>
        </button>
      </div>

      {/* Formulário Novo Equipamento */}
      {showAddForm && (
        <form
          onSubmit={handleAddEquipment}
          className={`p-3.5 rounded-xl border space-y-3 animate-in fade-in duration-150 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold font-['Poppins'] text-emerald-400 flex items-center gap-1.5">
              <Wrench className="w-4 h-4" />
              <span>Novo Equipamento Operacional</span>
            </h4>
            <span className="text-[10px] text-slate-400">Preencha os dados de consumo</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1 text-slate-400">
                Nome do Equipamento *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Secador Taiff 2400W"
                className={`w-full px-3 py-1.5 text-xs rounded-lg border outline-none ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase mb-1 text-slate-400">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as OperationalEquipment['category'])}
                className={`w-full px-3 py-1.5 text-xs rounded-lg border outline-none ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                <option value="Térmico & Secagem">Térmico & Secagem (Secador/Prancha)</option>
                <option value="Lavatório & Água">Lavatório & Água (Aquecedores)</option>
                <option value="Corte & Acabamento">Corte & Acabamento (Máquinas)</option>
                <option value="Outros Operacionais">Outros Operacionais</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase mb-1 text-slate-400">
                Consumo por Hora (kWh/h) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={kwhPerHour}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0.01;
                  setKwhPerHour(val);
                  setPowerWatts(Math.round(val * 1000));
                }}
                className={`w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border outline-none ${
                  isDark ? 'bg-slate-950 border-slate-700 text-amber-300' : 'bg-slate-50 border-slate-300 text-amber-800'
                }`}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase mb-1 text-slate-400">
                Uso Estimado (Horas/Dia) *
              </label>
              <input
                type="number"
                step="0.5"
                required
                value={avgHoursPerDay}
                onChange={(e) => setAvgHoursPerDay(parseFloat(e.target.value) || 1.0)}
                className={`w-full px-3 py-1.5 text-xs font-mono rounded-lg border outline-none ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase mb-1 text-slate-400">
                Potência Elétrica (Watts)
              </label>
              <input
                type="number"
                step="10"
                value={powerWatts}
                onChange={(e) => handlePowerChange(parseInt(e.target.value, 10) || 0)}
                className={`w-full px-3 py-1.5 text-xs font-mono rounded-lg border outline-none ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase mb-1 text-slate-400">
                Voltagem
              </label>
              <select
                value={voltage}
                onChange={(e) => setVoltage(e.target.value as OperationalEquipment['voltage'])}
                className={`w-full px-3 py-1.5 text-xs rounded-lg border outline-none ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                <option value="110V">110V</option>
                <option value="220V">220V</option>
                <option value="Bivolt">Bivolt</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-xs active:scale-95"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Salvar Equipamento</span>
            </button>
          </div>
        </form>
      )}

      {/* Lista de Equipamentos */}
      <div className="space-y-2">
        {equipments.map((eq) => (
          <div
            key={eq.id}
            className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Wrench className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold font-['Poppins'] text-white truncate">
                  {eq.name}
                </h4>
                <span className="text-[9.5px] text-slate-400">
                  {eq.category} • {eq.voltage}
                </span>
              </div>
            </div>

            {/* Campos de Ajuste Direto: Consumo/h e Horas/dia */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              <div>
                <span className="block text-[8px] uppercase font-bold text-slate-400">Consumo (kWh/h)</span>
                <input
                  type="number"
                  step="0.01"
                  value={eq.kwhPerHour}
                  onChange={(e) => handleUpdateInline(eq.id, parseFloat(e.target.value) || 0.01, eq.avgHoursPerDay)}
                  className={`w-18 px-2 py-1 text-xs font-mono font-bold rounded border outline-none text-right ${
                    isDark ? 'bg-slate-950 border-slate-700 text-amber-300' : 'bg-slate-50 border-slate-300 text-amber-800'
                  }`}
                />
              </div>

              <div>
                <span className="block text-[8px] uppercase font-bold text-slate-400">Uso (h/dia)</span>
                <input
                  type="number"
                  step="0.5"
                  value={eq.avgHoursPerDay}
                  onChange={(e) => handleUpdateInline(eq.id, eq.kwhPerHour, parseFloat(e.target.value) || 0.5)}
                  className={`w-14 px-2 py-1 text-xs font-mono font-bold rounded border outline-none text-right ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <button
                type="button"
                onClick={() => handleDeleteEquipment(eq.id)}
                className="p-1 rounded text-slate-500 hover:text-rose-400 transition cursor-pointer ml-1"
                title="Excluir equipamento"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
