-- ==============================================================================
-- 📜 ECOSSISTEMA VAGOUAPP — ESQUEMA DE BANCO DE DADOS SUPABASE (POSTGRESQL + POSTGIS)
-- Versão: 2.0.0 (Tríade Oficial: Portal, Meu Negócio, Admin Vagou)
-- ==============================================================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. Tabela de Estabelecimentos (Salões, Barbearias, Estética)
CREATE TABLE IF NOT EXISTS public.salons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    trade_name VARCHAR(150) NOT NULL,            -- Nome Fantasia (Nível 1 - Obrigatório Imediato)
    legal_name VARCHAR(150),                     -- Razão Social (Nível 2 - Com Prazo)
    document_type VARCHAR(10) DEFAULT 'CNPJ',    -- 'CNPJ' ou 'CPF'
    document_number VARCHAR(30),                 -- Número do Documento
    legal_representative VARCHAR(100),           -- Nome do Responsável Legal
    
    -- Contatos
    phone_whatsapp VARCHAR(20) NOT NULL,         -- WhatsApp Principal (Nível 1 - Obrigatório Imediato)
    phone_landline VARCHAR(20),                  -- Telefone Fixo (Nível 3 - Opcional)
    email VARCHAR(120) NOT NULL,                 -- E-mail comercial
    
    -- Localização e GIS
    address TEXT NOT NULL,
    neighborhood VARCHAR(80) NOT NULL,
    city VARCHAR(80) NOT NULL,
    state VARCHAR(2) DEFAULT 'SP',
    postal_code VARCHAR(15),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    geom GEOMETRY(Point, 4326),                  -- PostGIS Point para raio em KM
    
    -- Theming e Identidade Visual (White-Label Dinâmico)
    logo_url TEXT,
    banner_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#10B981',  -- Cor de destaque (default Emerald)
    secondary_color VARCHAR(7) DEFAULT '#0F172A',
    custom_domain VARCHAR(150) UNIQUE,           -- Domínio próprio (ex: agende.salaodazil.com.br)
    
    -- Governança de Cadastro & Status
    registration_level INT DEFAULT 1,            -- 1: Básico, 2: Em Prazo, 3: Completo / Verificado
    registration_due_date TIMESTAMPTZ,           -- Prazo limite para envio dos dados do Nível 2
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Configuração de Repasses e Faturamento Vagou
    commission_type VARCHAR(20) DEFAULT 'FIXED', -- 'FIXED' (R$ por agendamento) ou 'PERCENTAGE'
    commission_value NUMERIC(10,2) DEFAULT 2.50, -- Ex: R$ 2,50 por agendamento
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índice espacial para busca ultra-rápida por raio de KM
CREATE INDEX IF NOT EXISTS salons_geom_idx ON public.salons USING GIST (geom);

-- Trigger para manter geom atualizado automaticamente quando latitude/longitude mudarem
CREATE OR REPLACE FUNCTION update_salon_geom()
RETURNS TRIGGER AS $$
BEGIN
    NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_salon_geom ON public.salons;
CREATE TRIGGER trg_update_salon_geom
BEFORE INSERT OR UPDATE OF latitude, longitude ON public.salons
FOR EACH ROW EXECUTE FUNCTION update_salon_geom();


-- 3. Tabela de Profissionais da Equipe
CREATE TABLE IF NOT EXISTS public.professionals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(60) NOT NULL,                   -- ex: "Master Barber", "Colorista"
    avatar_url TEXT,
    phone VARCHAR(20),
    specialties TEXT[] NOT NULL DEFAULT '{}',    -- ex: {'cabelo', 'barba'}
    color_hex VARCHAR(7) DEFAULT '#10B981',
    slot_duration_minutes INT DEFAULT 45,
    is_active BOOLEAN DEFAULT TRUE,
    schedule_config JSONB DEFAULT '[]'::jsonb,   -- Expediente semanal e intervalos
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 4. Tabela de Serviços Ofertados (Com foto e detalhes)
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
    title VARCHAR(120) NOT NULL,
    description TEXT,
    category VARCHAR(40) NOT NULL,               -- 'cabelo' | 'barba' | 'unhas' | 'estetica' | 'beleza'
    price NUMERIC(10,2) NOT NULL,
    promotional_price NUMERIC(10,2),
    duration_minutes INT DEFAULT 45,
    image_url TEXT,
    video_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 5. Biblioteca de Mídias de Impacto (Regra dos 5 Slots Máximos)
CREATE TABLE IF NOT EXISTS public.salon_media_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
    slot_number INT CHECK (slot_number BETWEEN 1 AND 5), -- Máximo 5 slots por salão!
    media_type VARCHAR(10) NOT NULL,             -- 'video' (5s) ou 'image'
    media_url TEXT NOT NULL,
    thumbnail_url TEXT,
    title VARCHAR(100),
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(salon_id, slot_number)
);


-- 6. Tabela de Vagas Relâmpago do Radar
CREATE TABLE IF NOT EXISTS public.service_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    service_title VARCHAR(120) NOT NULL,
    category VARCHAR(40) NOT NULL,
    original_price NUMERIC(10,2) NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    date_str DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Mídia associada
    media_level INT DEFAULT 1,                   -- 1: Fallback animado, 2: Carrossel, 3: Vídeo 5s
    video_url TEXT,
    gallery_images TEXT[] DEFAULT '{}',
    
    -- Máquina de Estados da Vaga
    status VARCHAR(20) DEFAULT 'AVAILABLE',      -- 'AVAILABLE', 'BOOKED', 'EXPIRED', 'CANCELLED'
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS offers_status_expires_idx ON public.service_offers (status, expires_at);


-- 7. Tabela de Usuários / Clientes Finais
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE,                    -- Vinculado ao Supabase Auth
    name VARCHAR(120) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    phone_whatsapp VARCHAR(20),                  -- Coletado pós-login / na reserva
    phone_verified BOOLEAN DEFAULT FALSE,
    push_token TEXT,                             -- Token para Notificação Push no celular
    push_enabled BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    favorite_salon_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 8. Tabela Central de Agendamentos Efetivados
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    protocol_code VARCHAR(16) UNIQUE NOT NULL,    -- ex: 'VG-9482'
    offer_id UUID REFERENCES public.service_offers(id) ON DELETE SET NULL,
    salon_id UUID NOT NULL REFERENCES public.salons(id),
    professional_id UUID NOT NULL REFERENCES public.professionals(id),
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    
    client_name VARCHAR(120) NOT NULL,
    client_phone VARCHAR(20) NOT NULL,
    client_email VARCHAR(120),
    
    service_title VARCHAR(120) NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    date_str DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Estados do Atendimento
    status VARCHAR(30) DEFAULT 'CONFIRMADO',     -- 'CONFIRMADO', 'EM_ATENDIMENTO', 'CONCLUIDO', 'CANCELADO', 'NO_SHOW'
    
    -- Controle de Faturamento e Comissão Vagou
    commission_fee NUMERIC(10,2) NOT NULL DEFAULT 2.50,
    billed_in_invoice_id UUID,
    
    booked_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS appts_salon_status_idx ON public.appointments (salon_id, status, date_str);


-- 9. Tabela de Faturamento / Fechamento Mensal dos Parceiros (Painel Admin Vagou)
CREATE TABLE IF NOT EXISTS public.billing_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
    month_reference VARCHAR(7) NOT NULL,         -- 'YYYY-MM', ex: '2026-09'
    total_appointments INT DEFAULT 0,
    total_gmv NUMERIC(12,2) DEFAULT 0.00,        -- Volume Bruto Transacionado
    vagou_commission_total NUMERIC(10,2) DEFAULT 0.00, -- Valor a ser faturado pelo Vagou
    status VARCHAR(20) DEFAULT 'PENDING',        -- 'PENDING', 'PAID', 'OVERDUE'
    due_date DATE NOT NULL,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(salon_id, month_reference)
);


-- ==============================================================================
-- 🚀 FUNÇÕES GEOGRÁFICAS (POSTGIS) — RADAR POR RAIO DE KM
-- ==============================================================================

-- Função para buscar vagas e salões dentro de um raio de KM do usuário
CREATE OR REPLACE FUNCTION public.get_offers_in_radius(
    user_lat DOUBLE PRECISION,
    user_lng DOUBLE PRECISION,
    radius_km DOUBLE PRECISION DEFAULT 5.0,
    filter_category VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    offer_id UUID,
    salon_id UUID,
    salon_name VARCHAR,
    salon_logo TEXT,
    professional_name VARCHAR,
    professional_avatar TEXT,
    service_title VARCHAR,
    category VARCHAR,
    price NUMERIC,
    original_price NUMERIC,
    media_level INT,
    video_url TEXT,
    distance_meters INT,
    distance_km NUMERIC,
    expires_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id AS offer_id,
        s.id AS salon_id,
        s.trade_name AS salon_name,
        s.logo_url AS salon_logo,
        p.name AS professional_name,
        p.avatar_url AS professional_avatar,
        o.service_title,
        o.category,
        o.price,
        o.original_price,
        o.media_level,
        o.video_url,
        ROUND(ST_Distance(s.geom, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography))::INT AS distance_meters,
        ROUND((ST_Distance(s.geom, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography) / 1000.0)::NUMERIC, 1) AS distance_km,
        o.expires_at
    FROM public.service_offers o
    JOIN public.salons s ON o.salon_id = s.id
    JOIN public.professionals p ON o.professional_id = p.id
    WHERE o.status = 'AVAILABLE'
      AND o.expires_at > NOW()
      AND (filter_category IS NULL OR o.category = filter_category)
      AND ST_DWithin(s.geom, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography, radius_km * 1000)
    ORDER BY distance_meters ASC, o.expires_at ASC;
END;
$$ LANGUAGE plpgsql;
