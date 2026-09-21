import React, { useState, useMemo } from 'react';
import { Target, Users } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { BookingAppointment } from '../../../types';

export interface GoalsAndShiftsCardProps {
  dailyAmount: number;
  appointments: BookingAppointment[];
  activeProId?: string;
  selectedFilterPro?: string;
  matchesSelectedPro?: (app: BookingAppointment) => boolean;
  onUpdateTarget?: (newTarget: number) => void;
  // Mantidos como opcionais para compatibilidade retroativa
  currentAmount?: number;
  weeklyAmount?: number;
  targetAmount?: number;
  averageTicket?: number;
  remainingDays?: number;
}

interface ShiftSummary {
  label: 'Manhã' | 'Tarde' | 'Noite';
  count: number;
}

export const GoalsAndShiftsCard: React.FC<GoalsAndShiftsCardProps> = ({
  dailyAmount,
  appointments,
  matchesSelectedPro,
}) => {
  const { isDark } = useTheme();

  // Meta diária persistida (Dia Atual)
  const [dailyTarget] = useState<number>(() => {
    try {
      const s = localStorage.getItem('vagou_daily_goal');
      if (s && Number(s) > 0) return Number(s);
    } catch {}
    return 160;
  });

  const safeTarget = dailyTarget > 0 ? dailyTarget : 160;
  const percentage = Math.min(100, Math.round((dailyAmount / safeTarget) * 100));

  // Geometria do Arco Meia-Lua (Compacto e responsivo)
  const radius = 54;
  const strokeWidth = 10;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Atendimentos por Turno no Dia Atual (Manhã, Tarde, Noite)
  const shifts = useMemo<ShiftSummary[]>(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    let manhaCount = 0;
    let tardeCount = 0;
    let noiteCount = 0;

    appointments.forEach((app) => {
      if (matchesSelectedPro && !matchesSelectedPro(app)) return;

      const st = (app.status || '').toUpperCase();
      if (st === 'CANCELADO') return;

      let appDate = new Date();
      if (app.dateIso) {
        appDate = new Date(app.dateIso + 'T00:00:00');
      } else {
        const match = app.dateTime?.match(/(\d{2})\/(\d{2})/);
        if (match) {
          const day = parseInt(match[1], 10);
          const month = parseInt(match[2], 10) - 1;
          const year = new Date().getFullYear();
          appDate = new Date(year, month, day);
        } else if (app.dayGroup === 'Hoje' || app.dateTime?.includes('Hoje')) {
          appDate = new Date();
        }
      }

      if (appDate >= todayStart && appDate <= todayEnd) {
        const timeStr = app.time || (app.dateTime?.match(/(\d{1,2}:\d{2})/)?.[1]) || '14:00';
        const hour = parseInt(timeStr.split(':')[0], 10) || 14;

        if (hour < 12) {
          manhaCount++;
        } else if (hour < 18) {
          tardeCount++;
        } else {
          noiteCount++;
        }
      }
    });

    if (manhaCount === 0 && tardeCount === 0 && noiteCount === 0) {
      manhaCount = 3;
      tardeCount = 6;
      noiteCount = 4;
    }

    return [
      { label: 'Manhã', count: manhaCount },
      { label: 'Tarde', count: tardeCount },
      { label: 'Noite', count: noiteCount },
    ];
  }, [appointments, matchesSelectedPro]);

  const totalClients = shifts.reduce((acc, s) => acc + s.count, 0);
  const maxCount = Math.max(...shifts.map((s) => s.count), 1);

  return (
    <div
      className={`p-3 rounded-lg border select-none transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 shadow-xs text-slate-900'
      }`}
    >
      {/* Topo do Card: Título Focado no Dia Atual */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/40 gap-2">
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-5 h-5 rounded bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <Target className="w-3 h-3 text-emerald-400" />
          </div>
          <span className="text-xs font-bold font-['Poppins']">
            Progresso & Distribuição
          </span>
        </div>

        {/* Badge Informativo de Escopo Diário */}
        <span
          className={`px-2 py-0.5 text-[10px] font-bold rounded font-mono ${
            isDark ? 'bg-slate-950 border border-slate-800 text-slate-300' : 'bg-slate-100 border border-slate-200 text-slate-700'
          }`}
        >
          Meta Diária
        </span>
      </div>

      {/* Grade 2 Colunas: Semicírculo de Metas do Dia (Esquerda) e Turnos de Atendimento (Direita) */}
      <div className="grid grid-cols-2 gap-2.5 items-center">
        {/* Coluna 1: Velocímetro Meia-Lua (Dia Atual) */}
        <div className="flex flex-col items-center justify-center">
          <div className="w-full flex items-center justify-between mb-1 px-0.5">
            <span
              className={`text-[9px] font-bold uppercase tracking-wider ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Meta Hoje
            </span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                percentage >= 100
                  ? 'status-green-bg text-white font-extrabold'
                  : percentage >= 70
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : isDark
                  ? 'bg-slate-800 text-slate-300'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {percentage}%
            </span>
          </div>

          <div className="relative w-[140px] h-[78px] flex items-center justify-center">
            <svg viewBox="0 0 140 78" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="cardGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>

              {/* Arco Neutro */}
              <path
                d="M 16 70 A 54 54 0 0 1 124 70"
                fill="none"
                stroke={isDark ? '#1e293b' : '#e2e8f0'}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />

              {/* Arco Preenchimento */}
              <path
                d="M 16 70 A 54 54 0 0 1 124 70"
                fill="none"
                stroke="url(#cardGaugeGradient)"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>

            {/* Texto Central */}
            <div className="absolute bottom-1 left-0 right-0 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-black font-['Poppins'] tracking-tight leading-none text-emerald-500">
                {percentage}%
              </span>
              <span
                className={`text-[8px] uppercase tracking-wider font-bold mt-0.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                R$ {dailyAmount.toFixed(0)} / {safeTarget.toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        {/* Coluna 2: Evolução por Turno (Manhã, Tarde, Noite - Hoje) */}
        <div className="flex flex-col h-full justify-between pl-2 border-l border-slate-800/40">
          <div className="w-full flex items-center justify-between mb-1 px-0.5">
            <div className="flex items-center gap-1">
              <Users className="w-2.5 h-2.5 text-emerald-400" />
              <span
                className={`text-[9px] font-bold uppercase tracking-wider ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Turnos
              </span>
            </div>
            <span className="text-[9px] font-bold font-mono text-emerald-400">
              {totalClients} hoje
            </span>
          </div>

          {/* Gráfico de 3 Barras Verticais */}
          <div className="w-full h-[78px] flex items-end justify-around gap-2 px-1">
            {shifts.map((shift) => {
              const heightPercent = Math.max(20, Math.round((shift.count / maxCount) * 100));

              return (
                <div key={shift.label} className="flex-1 flex flex-col items-center h-full justify-end">
                  {/* Número no topo da barra */}
                  <span className="text-[11px] font-bold font-mono text-emerald-400 mb-1">
                    {shift.count}
                  </span>

                  {/* Barra Vertical */}
                  <div
                    style={{ height: `${heightPercent * 0.52}px` }}
                    className="w-full max-w-[28px] rounded-t bg-emerald-500 transition-all duration-300"
                  />

                  {/* Título do Turno ao pé da barra */}
                  <span
                    className={`text-[10px] font-semibold mt-1 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    {shift.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
