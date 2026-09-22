import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Zap
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { hapticLight, hapticSuccess } from '../../../utils/haptics';
import { InfrastructureEquipment } from './consumptionTypes';

const INITIAL_INFRA_EQUIPMENTS: InfrastructureEquipment[] = [
  {
    id: 'inf-1',
    name: 'Micro-ondas da Copa (32L)',
    category: 'Copa dos Funcionários',
    voltage: '110V',
    powerWatts: 1200,
    kwhPerHour: 1.2,
    avgHoursPerDay: 0.8,
    lastMaintenance: '10/08/2026',
    status: 'Operacional',
  },
  {
    id: 'inf-2',
    name: 'Ar-Condicionado Split 18.000 BTUs',
    category: 'Climatização',
    voltage: '220V',
    powerWatts: 2100,
    kwhPerHour: 2.1,
    avgHoursPerDay: 8.0,
    lastMaintenance: '20/08/2026',
    status: 'Operacional',
  },
  {
    id: 'inf-3',
    name: 'Refrigerador Duplex da Copa',
    category: 'Copa dos Funcionários',
    voltage: '110V',
    powerWatts: 180,
    kwhPerHour: 0.18,
    avgHoursPerDay: 24.0,
    lastMaintenance: '01/07/2026',
    status: 'Operacional',
  },
  {
    id: 'inf-4',
    name: 'Máquina de Café Espresso',
    category: 'Bebidas & Clientes',
    voltage: '110V',
    powerWatts: 1450,
    kwhPerHour: 1.45,
    avgHoursPerDay: 1.5,
    lastMaintenance: '15/09/2026',
    status: 'Operacional',
  },
  {
    id: 'inf-5',
    name: 'Frigobar de Bebidas',
    category: 'Bebidas & Clientes',
    voltage: '110V',
    powerWatts: 120,
    kwhPerHour: 0.12,
    avgHoursPerDay: 24.0,
    lastMaintenance: '05/08/2026',
    status: 'Operacional',
  },
];

export const InfrastructureEquipmentsManager: React.FC = () => {
  const { isDark } = useTheme();

  const [equipments, setEquipments] = useState<InfrastructureEquipment[]>(() => {
    try {
      const stored = localStorage.getItem('vagou_infra_equipments');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: Partial<InfrastructureEquipment>) => ({
            ...item,
            kwhPerHour: item.kwhPerHour ?? ((item.powerWatts || 100) / 1000),
            avgHoursPerDay: item.avgHoursPerDay ?? 4.0,
          })) as InfrastructureEquipment[];
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_INFRA_EQUIPMENTS;
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InfrastructureEquipment['category']>('Copa dos Funcionários');
  const [voltage, setVoltage] = useState<InfrastructureEquipment['voltage']>('110V');
  const [powerWatts, setPowerWatts] = useState<number>(1200);
  const [kwhPerHour, setKwhPerHour] = useState<number>(1.2);
  const [avgHoursPerDay, setAvgHoursPerDay] = useState<number>(1.0);
  const [status, setStatus] = useState<InfrastructureEquipment['status']>('Operacional');

  const handlePowerChange = (w: number) => {
    setPowerWatts(w);
    setKwhPerHour(parseFloat((w / 1000).toFixed(3)));
  };

  const handleAddEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    hapticSuccess();

    const newEq: InfrastructureEquipment = {
      id: `inf-eq-${Date.now()}`,
      name: name.trim(),
      category,
      voltage,
      powerWatts: powerWatts > 0 ? powerWatts : 100,
      kwhPerHour: kwhPerHour > 0 ? kwhPerHour : 0.1,
      avgHoursPerDay: avgHoursPerDay > 0 ? avgHoursPerDay : 1.0,
      lastMaintenance: new Date().toLocaleDateString('pt-BR'),
      status,
    };

    const updated = [newEq, ...equipments];
    setEquipments(updated);
    try {
      localStorage.setItem('vagou_infra_equipments', JSON.stringify(updated));
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
      localStorage.setItem('vagou_infra_equipments', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleDeleteEquipment = (id: string) => {
    hapticLight();
    const updated = equipments.filter(eq => eq.id !== id);
    setEquipments(updated);
    try {
      localStorage.setItem('vagou_infra_equipments', JSON.stringify(updated));
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
            <span>Infraestrutura</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {equipments.length} Ativos
            </span>
          </h3>
          <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Controle de micro-ondas, geladeiras, cafeteiras e ar-condicionado
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

      {/* Formulário Novo Equipamento de Infra */}
      {showAddForm && (
        <form
          onSubmit={handleAddEquipment}
          className={`p-3.5 rounded-xl border space-y-3 animate-in fade-in duration-150 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold font-['Poppins'] text-blue-400 flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              <span>Novo Equipamento de Infraestrutura</span>
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
                placeholder="Ex: Micro-ondas Copa 32L"
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
                onChange={(e) => setCategory(e.target.value as InfrastructureEquipment['category'])}
                className={`w-full px-3 py-1.5 text-xs rounded-lg border outline-none ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                <option value="Copa dos Funcionários">Copa dos Funcionários (Micro-ondas/Geladeira)</option>
                <option value="Climatização">Climatização (Ar-condicionado/Ventilador)</option>
                <option value="Bebidas & Clientes">Bebidas & Clientes (Café/Frigobar/Bebedouro)</option>
                <option value="Outra Infraestrutura">Outra Infraestrutura</option>
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
                onChange={(e) => setVoltage(e.target.value as InfrastructureEquipment['voltage'])}
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
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <Building2 className="w-4 h-4" />
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
