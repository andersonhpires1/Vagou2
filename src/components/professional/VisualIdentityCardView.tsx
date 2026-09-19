import React, { useState, useRef } from 'react';
import { 
  Palette, Upload, Trash2, Smartphone, Image as ImageIcon,
  Check, Sparkles, ArrowLeft, RefreshCw, Save
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { SalonAdminSettings } from '../../types';
import { hapticSuccess, hapticLight } from '../../utils/haptics';
import { updateDynamicPwaAssets } from '../../utils/pwaAssets';

export interface VisualIdentityCardViewProps {
  adminSettings: SalonAdminSettings;
  onUpdateSettings: (settings: Partial<SalonAdminSettings>) => void;
  onBack: () => void;
}

export const VisualIdentityCardView: React.FC<VisualIdentityCardViewProps> = ({
  adminSettings,
  onUpdateSettings,
  onBack,
}) => {
  const { isDark, setAccentColor: setAccentColorContext } = useTheme();

  const [salonName] = useState(adminSettings.salonName || 'Barbearia Rota 99');
  const [pwaName, setPwaName] = useState(adminSettings.pwaName || adminSettings.salonName || 'Barbearia Rota 99');
  const [salonLogo, setSalonLogo] = useState(adminSettings.salonLogo || '');
  const [salonIcon, setSalonIcon] = useState(adminSettings.salonIcon || '');
  const [accentColor, setAccentColor] = useState(adminSettings.accentColor || '#10b981');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);

  const COLOR_PRESETS = [
    { label: 'Esmeralda', hex: '#10b981' },
    { label: 'Azul Real', hex: '#3b82f6' },
    { label: 'Âmbar Ouro', hex: '#f59e0b' },
    { label: 'Rubi', hex: '#ef4444' },
    { label: 'Violeta', hex: '#8b5cf6' },
  ];

  // Upload Logo Retangular
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSalonLogo(reader.result as string);
        hapticSuccess();
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload Ícone Mobile (1:1)
  const handleIconFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSalonIcon(reader.result as string);
        hapticSuccess();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSalonLogo(reader.result as string);
        hapticSuccess();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIconDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSalonIcon(reader.result as string);
        hapticSuccess();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    hapticSuccess();

    onUpdateSettings({
      salonLogo,
      salonIcon,
      accentColor,
      pwaName: pwaName.trim() || salonName,
    });

    setAccentColorContext(accentColor);
    updateDynamicPwaAssets(pwaName.trim() || salonName, salonIcon);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className={`w-full h-full flex flex-col justify-between overflow-y-auto ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Topo com botão voltar */}
      <div className={`px-3 py-2.5 border-b shrink-0 flex items-center justify-between gap-2 sticky top-0 z-30 ${
        isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200 shadow-xs'
      }`}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              hapticLight();
              onBack();
            }}
            className={`p-1.5 rounded transition cursor-pointer active:scale-95 ${
              isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
            }`}
            title="Voltar ao Gerenciamento"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-emerald-500 shrink-0" />
            <h2 className="text-xs sm:text-sm font-bold font-['Poppins']">
              Identidade Visual
            </h2>
          </div>
        </div>

        {savedSuccess && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-emerald-500 px-2 py-0.5 rounded shadow-xs animate-in fade-in">
            <Check className="w-3 h-3 text-white" />
            Salvo
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="p-3.5 space-y-4 pb-24">
        
        {/* 1. COR DE DESTAQUE */}
        <div className={`p-3.5 rounded border space-y-3 ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider font-['Poppins']">
                Cor de Destaque
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {accentColor}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.hex}
                type="button"
                onClick={() => {
                  hapticLight();
                  setAccentColor(preset.hex);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-bold border transition cursor-pointer ${
                  accentColor === preset.hex
                    ? 'border-white/80 bg-slate-800 text-white shadow-xs'
                    : isDark
                    ? 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                    : 'border-slate-200 bg-slate-100 text-slate-700 hover:border-slate-300'
                }`}
              >
                <span 
                  className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0" 
                  style={{ backgroundColor: preset.hex }} 
                />
                <span>{preset.label}</span>
              </button>
            ))}

            {/* Seletor Customizado */}
            <div className="flex items-center gap-1 pl-1">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-7 h-7 rounded border border-slate-700 cursor-pointer bg-transparent"
                title="Escolha uma cor personalizada"
              />
              <span className="text-[10px] text-slate-400 font-mono">Custom</span>
            </div>
          </div>
        </div>

        {/* 2. LOGO DO CABEÇALHO (HORIZONTAL) */}
        <div className={`p-3.5 rounded border space-y-3 ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider font-['Poppins']">
                Logo do Cabeçalho
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              Horizontal (Topo do App)
            </span>
          </div>

          <p className="text-[11px] text-slate-400">
            Exibido no topo de todas as telas. Formato ideal: PNG/SVG horizontal (~3:1 ou 4:1) com fundo transparente.
          </p>

          {/* Prévia no Topo */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400">
              <span>Prévia no Topo</span>
              <span className="text-emerald-400 flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" /> Ao Vivo
              </span>
            </div>

            <div className={`h-11 rounded border px-3 flex items-center justify-between overflow-hidden ${
              isDark ? 'bg-[#151A1E] border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <div className="h-full flex items-center max-w-[180px] overflow-hidden">
                {salonLogo ? (
                  <img 
                    src={salonLogo} 
                    alt="Logo Cabeçalho" 
                    className="max-h-7 w-auto object-contain object-left" 
                  />
                ) : (
                  <span className={`text-xs font-black uppercase tracking-tight truncate ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    <span className="text-emerald-500">{salonName.split(' ')[0]}</span>{' '}
                    {salonName.split(' ').slice(1).join(' ')}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 opacity-60 text-[10px] text-slate-400">
                <span>Cliente</span>
                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                <span>🔔</span>
              </div>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleLogoDrop}
            className={`p-3 rounded border border-dashed flex items-center justify-between gap-2 transition ${
              isDark ? 'border-slate-700 bg-slate-950/40 hover:border-emerald-500' : 'border-slate-300 bg-slate-50 hover:border-emerald-500'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold truncate">
                  {salonLogo ? 'Logo horizontal ativo' : 'Nenhum logo enviado'}
                </p>
                <p className="text-[9.5px] text-slate-400 truncate">
                  {salonLogo ? 'Substitua ou remova abaixo' : 'Arraste a imagem ou toque para enviar'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="py-1.5 px-3 rounded bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <Upload className="w-3 h-3 text-white" />
                <span>{salonLogo ? 'Substituir' : 'Enviar'}</span>
              </button>

              {salonLogo && (
                <button
                  type="button"
                  onClick={() => {
                    hapticLight();
                    setSalonLogo('');
                  }}
                  className="p-1.5 rounded text-rose-400 hover:bg-rose-500/10 border border-slate-700 transition cursor-pointer"
                  title="Remover logo do cabeçalho"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <input 
              ref={logoInputRef}
              type="file" 
              accept="image/png,image/jpeg,image/svg+xml,image/webp" 
              className="hidden" 
              onChange={handleLogoFileChange} 
            />
          </div>
        </div>

        {/* 3. LOGO ÍCONE DO APP (MOBILE / PWA) */}
        <div className={`p-3.5 rounded border space-y-3 ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider font-['Poppins']">
                Ícone do App (Mobile)
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              Quadrado (1:1)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            {/* Mockup do Celular */}
            <div className={`p-3 rounded border flex flex-col items-center justify-center gap-1.5 ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/20 shadow-md flex items-center justify-center overflow-hidden">
                {salonIcon ? (
                  <img 
                    src={salonIcon} 
                    alt="Ícone do App" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-emerald-600 text-white font-bold text-base">
                    ✂️
                  </div>
                )}
              </div>
              <div className="text-center">
                <span className={`text-[11px] font-bold block truncate max-w-[140px] ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {pwaName || salonName}
                </span>
                <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-wider">
                  Tela Inicial
                </span>
              </div>
            </div>

            {/* Upload e Nome */}
            <div className="space-y-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Nome do App no Celular
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      hapticLight();
                      setPwaName(salonName);
                    }}
                    className="text-[9px] text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <RefreshCw className="w-2.5 h-2.5" /> Sincronizar
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={18}
                  value={pwaName}
                  onChange={(e) => setPwaName(e.target.value)}
                  placeholder="Ex: Rota 99"
                  className={`w-full px-3 py-1.5 rounded border text-xs font-semibold outline-hidden transition ${
                    isDark 
                      ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                  }`}
                />
              </div>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleIconDrop}
                className="flex items-center gap-2 pt-1"
              >
                <button
                  type="button"
                  onClick={() => iconInputRef.current?.click()}
                  className="flex-1 py-1.5 px-3 rounded bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Upload className="w-3 h-3 text-white" />
                  <span>{salonIcon ? 'Substituir Ícone' : 'Enviar Ícone (1:1)'}</span>
                </button>

                {salonIcon && (
                  <button
                    type="button"
                    onClick={() => {
                      hapticLight();
                      setSalonIcon('');
                    }}
                    className="p-1.5 rounded text-rose-400 hover:bg-rose-500/10 border border-slate-700 transition cursor-pointer"
                    title="Remover ícone do app"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                <input 
                  ref={iconInputRef}
                  type="file" 
                  accept="image/png,image/jpeg,image/svg+xml,image/webp" 
                  className="hidden" 
                  onChange={handleIconFileChange} 
                />
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* RODAPÉ FIXO DE AÇÃO */}
      <div className={`p-3 border-t shrink-0 sticky bottom-0 z-20 flex items-center justify-between gap-3 ${
        isDark ? 'bg-slate-950/95 border-slate-800' : 'bg-white/95 border-slate-200 shadow-lg'
      }`}>
        <button
          type="button"
          onClick={() => {
            hapticLight();
            onBack();
          }}
          className={`px-4 py-2.5 rounded border text-xs font-bold transition cursor-pointer ${
            isDark ? 'border-slate-800 text-slate-300 hover:bg-slate-900' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
          }`}
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={() => handleSave()}
          className="flex-1 py-2.5 px-4 rounded bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs active:scale-98"
        >
          <Save className="w-4 h-4 text-white" />
          <span>Salvar Identidade Visual</span>
        </button>
      </div>
    </div>
  );
};
