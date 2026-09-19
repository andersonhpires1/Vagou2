export const getSalonLogo = (_salonName?: string, logoUrl?: string): string => {
  if (logoUrl) return logoUrl;
  return 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=200&q=80';
};

