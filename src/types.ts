export interface ServiceOffer {
  id: string;
  salonName: string;
  salonLogo?: string;
  professionalName: string;
  professionalAvatar?: string;
  serviceTitle: string;
  serviceCategory: 'cabelo' | 'barba' | 'unhas' | 'beleza' | 'estetica';
  price: number;
  originalPrice?: number;
  rating: number;
  ratingCount: number;
  distance: string;
  distanceMeters?: number;
  neighborhood: string;
  timeSlot: string;
  dayLabel: string;
  duration: string;
  imageUrl: string;
  lat: number;
  lng: number;
  featured?: boolean;

  // Extensões de mídia e urgência
  mediaLevel?: 1 | 2 | 3;
  videoUrl?: string;
  galleryImages?: string[];
  expiresInMinutes?: number;
  expiresTimestamp?: number;
  activeViewers?: number;
  isFlashDeal?: boolean;
  isRecurring?: boolean;
  recurringCount?: number;
  brandColor?: string;
  brandGradient?: string;
  categoryIconKey?: 'cabelo' | 'barba' | 'unhas' | 'sobrancelha' | 'estetica' | 'beleza';
  description?: string;
}

export type PaymentMethod = 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'vagou_app';

export interface BookingAppointment {
  id?: string;
  protocolCode: string;
  service?: string;
  serviceTitle?: string;
  professional?: string;
  professionalName?: string;
  salonName: string;
  dateTime: string;
  dayGroup?: string;
  time?: string;
  duration?: string;
  totalPrice: number;
  status: 'EM ANDAMENTO' | 'CONFIRMADO' | 'AGENDADO' | 'CONCLUÍDO' | 'CANCELADO' | 'PENDENTE' | 'ALTERADO' | 'BLOQUEADO' | 'concluido' | 'confirmado' | 'cancelado' | 'agendado' | 'em andamento' | 'pendente' | 'alterado' | 'bloqueado' | string;
  address?: string;
  qrCodeMock?: string;
  customerName?: string;
  clientName?: string;
  customerPhone?: string;
  clientPhone?: string;
  customerEmail?: string;
  dateIso?: string;
  createdAt?: string;

  // Gestão Financeira & Caixa
  paymentMethod?: PaymentMethod;
  isPaid?: boolean;
  paidAt?: string;
  commissionRate?: number;
  commissionAmount?: number;
  platformFee?: number;

  // Bloqueio de Horário
  isBlockedSlot?: boolean;
  blockReason?: string;
}

export type UserPersona = 'cliente' | 'pro' | 'profissional' | 'admin';

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  avatarUrl?: string;
}

export interface DayOperatingHours {
  dayKey: 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';
  dayLabel: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface OperatingSchedule {
  preset: 'salao' | 'comercial' | 'todos' | 'personalizado';
  days: DayOperatingHours[];
  defaultOpenTime?: string;
  defaultCloseTime?: string;
}

export interface SalonAdminSettings {
  salonName: string;
  salonPhone: string;
  salonAddress: string;
  openingHours: string;
  isOpenNow: boolean;
  pinCode: string;
  accentColor?: string;
  salonLogo?: string; // Logo retangular horizontal para o cabeçalho do app
  salonIcon?: string; // Ícone quadrado (1:1) para o PWA (instalação no celular)
  pwaName?: string;   // Nome curto/completo exibido na tela inicial do celular

  // Dados Cadastrais e Fiscais
  razaoSocial?: string;
  cnpj?: string;

  // Localização Detalhada
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;

  // Atendimento Inteligente
  operatingSchedule?: OperatingSchedule;

  // Responsável Legal
  legalManagerName?: string;
  legalManagerCpf?: string;
  legalManagerPhone?: string;
  legalManagerEmail?: string;
}

export interface ServiceCategoryItem {
  id: string;
  name: string;
  description?: string;
  iconKey?: string;
  color?: string;
  sortOrder?: number;
  isCustom?: boolean;
}

export interface SalonProfessionalItem {
  id?: string;
  name: string;
  role?: string;
  systemRole?: 'admin' | 'member';
  avatar?: string;
  avatarUrl?: string;
  rating?: number;
}

export interface CatalogServiceItem {
  id: string;
  title: string;
  duration: string;
  price: number;
  description: string;
  category: string;
  categoryId?: string;
  image?: string;
  photos?: string[];
  mediaType?: 'image' | 'video';
  videoUrl?: string;
  videoDurationSeconds?: number;
  displayMode?: 'static' | 'slideshow' | 'video';
  aspectRatio?: string;
  professionalId?: string; // Multi-tenant RBAC: vincula o serviço a um profissional específico
}

export type ProfessionalRole = 'admin' | 'professional' | 'receptionist';

export interface ProfessionalWorkSchedule {
  shiftType: 'manha' | 'tarde' | 'integral' | 'sabados' | 'personalizado';
  shiftLabel?: string;
  days: string[]; // e.g. ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom']
  startTime: string; // e.g. '08:00'
  endTime: string; // e.g. '14:00'
}

export interface ProfessionalTeamMember {
  id: string;
  name: string;
  role: ProfessionalRole;
  avatarUrl?: string;
  phone?: string;
  specialties: string[];
  commissionRate?: number; // Percentual de repasse (ex: 50 para 50%)
  workSchedule?: ProfessionalWorkSchedule;
  isActive: boolean;
  joinedAt: string;
}

// Utilitários de feedback tátil e fallbacks determinísticos
export const hapticLight = () => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(10); } catch {}
  }
};

export const hapticMedium = () => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(25); } catch {}
  }
};

export const hapticSuccess = () => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate([15, 50, 20]); } catch {}
  }
};

export const getSalonLogo = (_salonName?: string, logoUrl?: string): string => {
  if (logoUrl) return logoUrl;
  return 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=200&q=80';
};


