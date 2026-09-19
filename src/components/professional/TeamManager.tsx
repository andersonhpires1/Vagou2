import React, { useState } from 'react';
import { 
  Users, UserPlus, ShieldCheck, User as UserIcon, 
  Trash2, Edit2, X, Phone, Briefcase, Scissors, Percent
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { hapticLight, hapticSuccess, hapticMedium, ProfessionalTeamMember, ProfessionalRole } from '../../types';

// Mock Data inicial
const INITIAL_TEAM: ProfessionalTeamMember[] = [
  {
    id: 'prof_admin_1',
    name: 'Você (Dono)',
    role: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80',
    phone: '(11) 99999-9999',
    specialties: ['Cabelo', 'Barba'],
    commissionRate: 100,
    isActive: true,
    joinedAt: new Date().toISOString()
  }
];

export const TeamManager: React.FC = () => {
  const { isDark } = useTheme();
  
  const [team, setTeam] = useState<ProfessionalTeamMember[]>(() => {
    try {
      const saved = localStorage.getItem('vagou_team_members');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_TEAM;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<ProfessionalTeamMember | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ProfessionalTeamMember | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<ProfessionalRole>('professional');
  const [formPhone, setFormPhone] = useState('');
  const [formSpecialties, setFormSpecialties] = useState('');
  const [formAvatarUrl, setFormAvatarUrl] = useState('');
  const [formCommissionRate, setFormCommissionRate] = useState<number>(50);

  const saveTeam = (newTeam: ProfessionalTeamMember[]) => {
    setTeam(newTeam);
    localStorage.setItem('vagou_team_members', JSON.stringify(newTeam));
  };

  const handleOpenForm = (member?: ProfessionalTeamMember) => {
    hapticLight();
    if (member) {
      setEditingMember(member);
      setFormName(member.name);
      setFormRole(member.role);
      setFormPhone(member.phone || '');
      setFormSpecialties(member.specialties.join(', '));
      setFormAvatarUrl(member.avatarUrl || '');
      setFormCommissionRate(member.commissionRate ?? (member.role === 'admin' ? 100 : 50));
    } else {
      setEditingMember(null);
      setFormName('');
      setFormRole('professional');
      setFormPhone('');
      setFormSpecialties('');
      setFormAvatarUrl('');
      setFormCommissionRate(50);
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const specsArray = formSpecialties.split(',').map(s => s.trim()).filter(Boolean);
    const cleanedAvatarUrl = formAvatarUrl.trim();

    let updatedTeam: ProfessionalTeamMember[];
    
    if (editingMember) {
      updatedTeam = team.map(m => m.id === editingMember.id ? {
        ...m,
        name: formName,
        role: formRole,
        phone: formPhone,
        specialties: specsArray,
        commissionRate: formCommissionRate,
        avatarUrl: cleanedAvatarUrl || undefined
      } : m);
    } else {
      const newMember: ProfessionalTeamMember = {
        id: `prof_${Date.now()}`,
        name: formName,
        role: formRole,
        phone: formPhone,
        specialties: specsArray,
        commissionRate: formCommissionRate,
        avatarUrl: cleanedAvatarUrl || undefined,
        isActive: true,
        joinedAt: new Date().toISOString()
      };
      updatedTeam = [...team, newMember];
    }

    saveTeam(updatedTeam);
    hapticSuccess();
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    const updatedTeam = team.filter(m => m.id !== id);
    saveTeam(updatedTeam);
    setDeleteConfirm(null);
    hapticMedium();
  };

  const roleLabels = {
    admin: { label: 'Administrador', icon: ShieldCheck, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    professional: { label: 'Profissional', icon: Scissors, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    receptionist: { label: 'Recepcionista', icon: Briefcase, color: 'text-blue-400', bg: 'bg-blue-400/10' }
  };

  return (
    <div className={`flex flex-col h-full ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* HEADER */}
      <div className={`p-4 border-b shrink-0 flex items-center justify-between sticky top-0 z-20 ${
        isDark ? 'bg-slate-950/95 border-slate-800' : 'bg-white/95 border-slate-200'
      } backdrop-blur-md`}>
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-500" />
            <span>Gestão de Equipe</span>
          </h2>
          <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {team.length} {team.length === 1 ? 'membro' : 'membros'} cadastrados
          </p>
        </div>
        
        <button
          onClick={() => handleOpenForm()}
          className="px-3.5 py-2 rounded bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] uppercase tracking-wider transition shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Adicionar</span>
        </button>
      </div>

      {/* LISTAGEM */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {team.map(member => {
          const RoleIcon = roleLabels[member.role].icon;
          const isMainAdmin = member.role === 'admin' && member.id === 'prof_admin_1';

          return (
            <div 
              key={member.id}
              className={`p-3 rounded-lg border flex flex-col gap-3 transition ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800 shrink-0 border border-slate-700/50 flex items-center justify-center relative">
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <UserIcon className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  
                  <div>
                    <h3 className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {member.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${roleLabels[member.role].bg} ${roleLabels[member.role].color}`}>
                        <RoleIcon className="w-3 h-3" />
                        {roleLabels[member.role].label}
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <Percent className="w-2.5 h-2.5 text-emerald-400" />
                        {member.commissionRate ?? (member.role === 'admin' ? 100 : 50)}% Repasse
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleOpenForm(member)}
                    className={`p-2 rounded-md transition cursor-pointer ${
                      isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-emerald-400' : 'hover:bg-slate-100 text-slate-500 hover:text-emerald-500'
                    }`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  
                  {!isMainAdmin && (
                    <button
                      onClick={() => {
                        hapticLight();
                        setDeleteConfirm(member);
                      }}
                      className={`p-2 rounded-md transition cursor-pointer ${
                        isDark ? 'hover:bg-rose-500/10 text-slate-400 hover:text-rose-400' : 'hover:bg-rose-50 text-slate-500 hover:text-rose-500'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Informações Extras (Telefone / Especialidades) */}
              <div className="flex items-center gap-4 border-t pt-2 border-slate-800/40 text-[11px] font-medium text-slate-400">
                {member.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{member.phone}</span>
                  </div>
                )}
                {member.specialties.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Scissors className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[150px]">{member.specialties.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE ADICIONAR / EDITAR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in" onClick={() => setIsModalOpen(false)}>
          <div 
            className={`w-full max-w-sm rounded-xl overflow-hidden shadow-2xl border ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <h3 className="font-bold text-sm uppercase tracking-wider text-emerald-400">
                {editingMember ? 'Editar Membro' : 'Novo Membro'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-4 space-y-4">
              
              <div className="flex flex-col items-center justify-center gap-4 mb-4">
                <div className="w-20 h-20 rounded-full bg-slate-800 shrink-0 border border-slate-700/50 flex items-center justify-center relative overflow-hidden">
                  {formAvatarUrl ? (
                    <img src={formAvatarUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-8 h-8 text-slate-500" />
                  )}
                </div>
                <label className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded cursor-pointer transition">
                  Selecionar Foto
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Nome do Profissional
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded border text-sm ${isDark ? 'bg-slate-900 border-slate-800 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'} outline-hidden`}
                  placeholder="Ex: Carlos Silva"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Nível de Acesso (Role)
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as ProfessionalRole)}
                  className={`w-full px-3 py-2.5 rounded border text-sm appearance-none ${isDark ? 'bg-slate-900 border-slate-800 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'} outline-hidden`}
                >
                  <option value="professional">Profissional (Vê apenas própria agenda)</option>
                  <option value="receptionist">Recepcionista (Vê todas as agendas, sem financeiro)</option>
                  <option value="admin">Administrador (Acesso Total)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded border text-sm ${isDark ? 'bg-slate-900 border-slate-800 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'} outline-hidden`}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Especialidades (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={formSpecialties}
                  onChange={(e) => setFormSpecialties(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded border text-sm ${isDark ? 'bg-slate-900 border-slate-800 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'} outline-hidden`}
                  placeholder="Ex: Degradê, Pigmentação, Platinado"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Comissão nos Serviços (% Repasse)
                  </label>
                  <span className="text-xs font-bold text-white bg-emerald-500 px-2 py-0.5 rounded shadow-xs">
                    {formCommissionRate}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={formCommissionRate}
                    onChange={(e) => setFormCommissionRate(Number(e.target.value))}
                    className="flex-1 accent-emerald-500 cursor-pointer"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formCommissionRate}
                    onChange={(e) => setFormCommissionRate(Math.min(100, Math.max(0, Number(e.target.value))))}
                    className={`w-16 px-2 py-1.5 rounded border text-center text-xs font-bold ${
                      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    } outline-hidden`}
                  />
                </div>
                <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Percentual repassado ao profissional em cada atendimento concluído.
                </p>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full py-3 rounded bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-sm active:scale-[0.99]">
                  {editingMember ? 'Salvar Alterações' : 'Adicionar à Equipe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in" onClick={() => setDeleteConfirm(null)}>
          <div 
            className={`w-full max-w-sm rounded-xl overflow-hidden shadow-2xl border p-4.5 space-y-4 ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold font-['Poppins']">Excluir Membro?</h3>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'} leading-relaxed`}>
                  Tem certeza que deseja excluir <strong>{deleteConfirm.name}</strong> da equipe? 
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
              <button onClick={() => setDeleteConfirm(null)} className={`px-4 py-2 rounded text-xs font-bold transition cursor-pointer border ${isDark ? 'border-slate-800 text-slate-300 hover:bg-slate-900' : 'border-slate-200 text-slate-700 hover:bg-slate-100'}`}>
                Cancelar
              </button>
              <button onClick={() => handleDelete(deleteConfirm.id)} className="px-4 py-2 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
