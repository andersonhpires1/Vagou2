/**
 * Utilitário de Ativos PWA Dinâmicos do Estabelecimento — Vagou
 * Gerencia a atualização em tempo real de título, favicon, apple-touch-icon e manifest.json
 */

export function updateDynamicPwaAssets(appName: string, iconUrl?: string): void {
  if (typeof document === 'undefined') return;

  const cleanName = (appName || 'Meu Estabelecimento').trim();
  const shortName = cleanName.length > 12 ? cleanName.slice(0, 12).trim() : cleanName;

  // 1. Atualizar Título da Página e Apple Title
  if (cleanName) {
    document.title = `${cleanName} — Vagou`;
    const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (appleTitle) {
      appleTitle.setAttribute('content', shortName);
    }
  }

  // 2. Atualizar Favicons e Apple Touch Icons
  if (iconUrl) {
    const iconSelectors = [
      'link[rel="icon"]',
      'link[rel="apple-touch-icon"]',
      'link[rel="shortcut icon"]'
    ];
    
    document.querySelectorAll<HTMLLinkElement>(iconSelectors.join(',')).forEach((link) => {
      link.href = iconUrl;
    });

    // 3. Atualizar ou Criar o Web App Manifest Dinâmico via Blob URL
    try {
      const manifestData = {
        id: '/',
        name: cleanName,
        short_name: shortName,
        description: `Aplicativo oficial de agendamentos e serviços de ${cleanName}`,
        start_url: '/?source=pwa',
        scope: '/',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui', 'window-controls-overlay'],
        orientation: 'portrait-primary',
        background_color: '#151A1E',
        theme_color: '#151A1E',
        prefer_related_applications: false,
        categories: ['lifestyle', 'beauty', 'shopping', 'utilities'],
        icons: [
          {
            src: iconUrl,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: iconUrl,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      };

      const blob = new Blob([JSON.stringify(manifestData, null, 2)], { type: 'application/json' });
      const manifestUrl = URL.createObjectURL(blob);

      let manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
      if (!manifestLink) {
        manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        document.head.appendChild(manifestLink);
      }
      manifestLink.href = manifestUrl;
    } catch {
      // Ignora em caso de restrição de ambiente
    }
  }
}

/**
 * Carrega e aplica os ativos PWA salvos no localStorage no boot da aplicação
 */
export function initializeStoredPwaAssets(): void {
  if (typeof window === 'undefined') return;
  try {
    const saved = localStorage.getItem('vagou_salon_admin_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      const appName = parsed.pwaName || parsed.salonName || 'Barbearia Rota 99';
      updateDynamicPwaAssets(appName, parsed.salonIcon);
    }
  } catch {
    // Ignora
  }
}
