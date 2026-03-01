-- 1. Criar Tabela de Perfis (Profiles)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'client')) DEFAULT 'client',
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar Tabela de Salões (Salons)
CREATE TABLE salons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  phone TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar Tabela de Serviços (Services)
CREATE TABLE services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  duration INTEGER NOT NULL, -- em minutos
  is_active BOOLEAN DEFAULT TRUE,
  image_url TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar Tabela de Agendamentos (Appointments)
CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE RESTRICT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'pending',
  notes TEXT,
  professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Habilitar Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- 6. Políticas de Segurança (RLS Policies)

-- Perfis: Usuários podem ler qualquer perfil, mas só editar o seu próprio
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Salões: Qualquer um pode ver, apenas admins podem criar/editar
CREATE POLICY "Salons are viewable by everyone" ON salons FOR SELECT USING (true);
CREATE POLICY "Admins can manage their own salons" ON salons FOR ALL USING (auth.uid() = owner_id);

-- Serviços: Qualquer um pode ver, apenas donos do salão podem gerenciar
CREATE POLICY "Services are viewable by everyone" ON services FOR SELECT USING (true);
CREATE POLICY "Admins can manage services of their salons" ON services FOR ALL USING (
  EXISTS (SELECT 1 FROM salons WHERE salons.id = services.salon_id AND salons.owner_id = auth.uid())
);

-- Agendamentos: Clientes veem os seus, Admins veem os do seu salão
CREATE POLICY "Clients can view own appointments" ON appointments FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Admins can view salon appointments" ON appointments FOR SELECT USING (
  EXISTS (SELECT 1 FROM salons WHERE salons.id = appointments.salon_id AND salons.owner_id = auth.uid())
);
CREATE POLICY "Clients can create appointments" ON appointments FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update own appointments" ON appointments FOR UPDATE 
USING (auth.uid() = client_id)
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Admins can update salon appointments" ON appointments FOR UPDATE 
USING (EXISTS (SELECT 1 FROM salons WHERE salons.id = appointments.salon_id AND salons.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM salons WHERE salons.id = appointments.salon_id AND salons.owner_id = auth.uid()));

-- 8. Criar Tabela de Avaliações (Reviews)
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are viewable by everyone" ON reviews FOR SELECT USING (true);
CREATE POLICY "Clients can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = client_id);

-- 10. Criar Tabela de Profissionais (Professionals)
CREATE TABLE professionals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  specialty TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Professionals are viewable by everyone" ON professionals FOR SELECT USING (true);
CREATE POLICY "Admins can manage professionals of their salons" ON professionals FOR ALL USING (
  EXISTS (SELECT 1 FROM salons WHERE salons.id = professionals.salon_id AND salons.owner_id = auth.uid())
);

-- 9. Trigger para criar perfil automaticamente no Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', COALESCE(new.raw_user_meta_data->>'role', 'client'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
