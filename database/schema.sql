-- Schema para Steam Compass
-- Ejecutar en el SQL Editor de Supabase

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;

-- Tabla de usuarios (extiende auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  steam_id TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de juegos del usuario
CREATE TABLE IF NOT EXISTS public.user_games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  appid INTEGER NOT NULL,
  name TEXT NOT NULL,
  cover_url TEXT,
  playtime_forever INTEGER DEFAULT 0, -- en minutos
  hours_to_beat INTEGER, -- horas estimadas para completar
  metacritic_score INTEGER,
  positive_reviews INTEGER,
  negative_reviews INTEGER,
  stars_rating DECIMAL(3,2), -- de 0.00 a 5.00
  last_played TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, appid)
);

-- Tabla de lista de deseados
CREATE TABLE IF NOT EXISTS public.user_wishlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  appid INTEGER NOT NULL,
  name TEXT NOT NULL,
  cover_url TEXT,
  price DECIMAL(10,2),
  discount_percent INTEGER DEFAULT 0,
  release_date DATE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, appid)
);

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wishlist ENABLE ROW LEVEL SECURITY;

-- Policies para profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies para user_games
CREATE POLICY "Users can view own games" ON public.user_games
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own games" ON public.user_games
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own games" ON public.user_games
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own games" ON public.user_games
  FOR DELETE USING (auth.uid() = user_id);

-- Policies para user_wishlist
CREATE POLICY "Users can view own wishlist" ON public.user_wishlist
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wishlist" ON public.user_wishlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wishlist" ON public.user_wishlist
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wishlist" ON public.user_wishlist
  FOR DELETE USING (auth.uid() = user_id);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_games_updated_at
  BEFORE UPDATE ON public.user_games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_user_games_user_id ON public.user_games(user_id);
CREATE INDEX IF NOT EXISTS idx_user_games_appid ON public.user_games(appid);
CREATE INDEX IF NOT EXISTS idx_user_wishlist_user_id ON public.user_wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wishlist_appid ON public.user_wishlist(appid);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_steam_id ON public.profiles(steam_id);
