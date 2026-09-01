
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('consumer','provider','admin');
CREATE TYPE public.provider_category AS ENUM ('gym','salon','tuition','sports','dance_yoga');
CREATE TYPE public.booking_status AS ENUM ('confirmed','cancelled','completed');

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  city text DEFAULT 'Bengaluru',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile write" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'consumer',
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- new user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'consumer'))
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PROVIDERS
CREATE TABLE public.providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  category public.provider_category NOT NULL,
  description text,
  address text,
  area text NOT NULL,
  city text NOT NULL DEFAULT 'Bengaluru',
  cover_url text,
  phone text,
  rating numeric(2,1) NOT NULL DEFAULT 0,
  rating_count int NOT NULL DEFAULT 0,
  price_from int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.providers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.providers TO authenticated;
GRANT ALL ON public.providers TO service_role;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "providers public read" ON public.providers FOR SELECT USING (true);
CREATE POLICY "owner insert provider" ON public.providers FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner update provider" ON public.providers FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "owner delete provider" ON public.providers FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- SERVICES
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  duration_min int NOT NULL DEFAULT 60,
  price int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "services public read" ON public.services FOR SELECT USING (true);
CREATE POLICY "owner manage services" ON public.services FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND p.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND p.owner_id = auth.uid()));

-- PLANS
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  sessions int NOT NULL DEFAULT 8,
  validity_days int NOT NULL DEFAULT 30,
  price int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plans TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plans TO authenticated;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans public read" ON public.plans FOR SELECT USING (true);
CREATE POLICY "owner manage plans" ON public.plans FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND p.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND p.owner_id = auth.uid()));

-- SLOTS
CREATE TABLE public.slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  capacity int NOT NULL DEFAULT 10,
  booked_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX slots_provider_start_idx ON public.slots (provider_id, starts_at);
GRANT SELECT ON public.slots TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.slots TO authenticated;
GRANT ALL ON public.slots TO service_role;
ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "slots public read" ON public.slots FOR SELECT USING (true);
CREATE POLICY "owner manage slots" ON public.slots FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND p.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND p.owner_id = auth.uid()));

-- SUBSCRIPTIONS
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  sessions_total int NOT NULL,
  sessions_remaining int NOT NULL,
  amount_paid int NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own subs read" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND p.owner_id = auth.uid()));
CREATE POLICY "own subs insert" ON public.subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own subs update" ON public.subscriptions FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- BOOKINGS
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  slot_id uuid NOT NULL REFERENCES public.slots(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  amount int NOT NULL DEFAULT 0,
  status public.booking_status NOT NULL DEFAULT 'confirmed',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, slot_id)
);
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings read" ON public.bookings FOR SELECT TO authenticated USING (auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND p.owner_id = auth.uid()));
CREATE POLICY "bookings insert own" ON public.bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookings update" ON public.bookings FOR UPDATE TO authenticated USING (auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND p.owner_id = auth.uid()));

-- REVIEWS
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  author_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider_id)
);
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews public read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews insert own" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews update own" ON public.reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "reviews delete own" ON public.reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.refresh_provider_rating()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pid uuid;
BEGIN
  pid := COALESCE(NEW.provider_id, OLD.provider_id);
  UPDATE public.providers p SET
    rating = COALESCE((SELECT ROUND(AVG(r.rating)::numeric,1) FROM public.reviews r WHERE r.provider_id = pid),0),
    rating_count = (SELECT COUNT(*) FROM public.reviews r WHERE r.provider_id = pid)
  WHERE p.id = pid;
  RETURN NULL;
END;
$$;
CREATE TRIGGER reviews_rating_sync AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.refresh_provider_rating();

-- CAPACITY-SAFE BOOKING
CREATE OR REPLACE FUNCTION public.book_slot(p_slot_id uuid, p_subscription_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_slot public.slots%ROWTYPE;
  v_user uuid := auth.uid();
  v_amount int := 0;
  v_booking_id uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_slot FROM public.slots WHERE id = p_slot_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Slot not found'; END IF;
  IF v_slot.starts_at < now() THEN RAISE EXCEPTION 'This slot has already started'; END IF;
  IF v_slot.booked_count >= v_slot.capacity THEN RAISE EXCEPTION 'This slot is full'; END IF;
  IF EXISTS (SELECT 1 FROM public.bookings b WHERE b.slot_id = p_slot_id AND b.user_id = v_user AND b.status <> 'cancelled') THEN
    RAISE EXCEPTION 'You already booked this slot';
  END IF;

  IF p_subscription_id IS NOT NULL THEN
    UPDATE public.subscriptions s SET sessions_remaining = s.sessions_remaining - 1,
      status = CASE WHEN s.sessions_remaining - 1 <= 0 THEN 'exhausted' ELSE s.status END
    WHERE s.id = p_subscription_id AND s.user_id = v_user AND s.provider_id = v_slot.provider_id
      AND s.sessions_remaining > 0 AND s.expires_at > now() AND s.status = 'active';
    IF NOT FOUND THEN RAISE EXCEPTION 'Membership is not valid for this booking'; END IF;
  ELSE
    SELECT COALESCE(price,0) INTO v_amount FROM public.services WHERE id = v_slot.service_id;
  END IF;

  UPDATE public.slots SET booked_count = booked_count + 1 WHERE id = p_slot_id;

  INSERT INTO public.bookings (user_id, provider_id, slot_id, service_id, subscription_id, amount)
  VALUES (v_user, v_slot.provider_id, p_slot_id, v_slot.service_id, p_subscription_id, COALESCE(v_amount,0))
  RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.book_slot(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.cancel_booking(p_booking_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_b public.bookings%ROWTYPE;
BEGIN
  SELECT * INTO v_b FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found'; END IF;
  IF v_b.user_id <> auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.providers p WHERE p.id = v_b.provider_id AND p.owner_id = auth.uid()
  ) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF v_b.status = 'cancelled' THEN RETURN; END IF;

  UPDATE public.bookings SET status = 'cancelled' WHERE id = p_booking_id;
  UPDATE public.slots SET booked_count = GREATEST(booked_count - 1, 0) WHERE id = v_b.slot_id;
  IF v_b.subscription_id IS NOT NULL THEN
    UPDATE public.subscriptions SET sessions_remaining = sessions_remaining + 1, status = 'active'
    WHERE id = v_b.subscription_id;
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.cancel_booking(uuid) TO authenticated;

-- ============ SEED ============
INSERT INTO public.providers (name, category, description, address, area, city, cover_url, phone, price_from) VALUES
('Iron Forge Gym','gym','Strength-first neighbourhood gym with Olympic platforms, free weights and daily coached HIIT.','12 MG Road','Indiranagar','Bengaluru','https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80','+91 98450 11001',999),
('Pulse Fitness Studio','gym','Boutique studio focused on functional training, spin and recovery.','44 100ft Road','Koramangala','Bengaluru','https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&q=80','+91 98450 11002',1299),
('Titan Strength Club','gym','Powerlifting and bodybuilding club with certified coaches.','7 Sarjapur Main Rd','HSR Layout','Bengaluru','https://images.unsplash.com/photo-1637430308606-86576d8fdb9a?w=800&q=80','+91 98450 11003',899),
('CrossPoint Athletic','gym','WOD-style group classes, mobility and conditioning.','21 Old Airport Rd','Domlur','Bengaluru','https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80','+91 98450 11004',1499),
('Luxe Hair & Beauty','salon','Unisex premium salon for cuts, colour, keratin and bridal styling.','3 Church Street','MG Road','Bengaluru','https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80','+91 98450 11005',399),
('The Groom Room','salon','Men''s grooming lounge — fades, beard sculpting and facials.','88 5th Block','Jayanagar','Bengaluru','https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80','+91 98450 11006',299),
('Glow Skin & Spa','salon','Advanced facials, hydra glow and full body spa therapies.','16 Whitefield Main Rd','Whitefield','Bengaluru','https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800&q=80','+91 98450 11007',799),
('Bloom Nail Bar','salon','Gel extensions, nail art and express manicures.','9 CMH Road','Indiranagar','Bengaluru','https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=800&q=80','+91 98450 11008',499),
('Vidya Coaching Centre','tuition','CBSE & ICSE tuition for classes 8–12 in Maths and Science.','5 BTM 2nd Stage','BTM Layout','Bengaluru','https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80','+91 98450 11009',2500),
('NextStep JEE Academy','tuition','IIT-JEE and NEET intensive batches with weekly mocks.','32 Rajajinagar','Rajajinagar','Bengaluru','https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80','+91 98450 11010',4500),
('Little Scholars Hub','tuition','Primary school homework help, phonics and spoken English.','14 Banashankari 3rd','Banashankari','Bengaluru','https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80','+91 98450 11011',1800),
('CodeCraft Kids','tuition','Coding, robotics and maths olympiad classes for ages 8–16.','2 Marathahalli Bridge','Marathahalli','Bengaluru','https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80','+91 98450 11012',3200),
('Smash Badminton Academy','sports','Six wooden courts, coached batches and league play.','18 Hennur Main Rd','Hennur','Bengaluru','https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80','+91 98450 11013',1200),
('Ace Cricket Academy','sports','Turf nets, bowling machines and BCCI-certified coaching.','60 Kanakapura Rd','JP Nagar','Bengaluru','https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80','+91 98450 11014',2200),
('Bangalore Swim Club','sports','Heated semi-Olympic pool, learn-to-swim and squad training.','25 Bellandur Gate','Bellandur','Bengaluru','https://images.unsplash.com/photo-1600965962361-9035dbfd1c50?w=800&q=80','+91 98450 11015',1800),
('Nrityam Dance Studio','dance_yoga','Bharatanatyam, contemporary and Bollywood batches for all ages.','11 Malleshwaram 8th Cross','Malleshwaram','Bengaluru','https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80','+91 98450 11016',1500),
('Sthira Yoga Shala','dance_yoga','Ashtanga, Hatha and pranayama in a calm shala setting.','4 Cooke Town','Cooke Town','Bengaluru','https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80','+91 98450 11017',1100),
('Groove Hip Hop Crew','dance_yoga','Hip hop, popping and crew choreography sessions.','77 Kalyan Nagar','Kalyan Nagar','Bengaluru','https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&q=80','+91 98450 11018',900);

-- services
INSERT INTO public.services (provider_id, name, description, duration_min, price)
SELECT p.id, s.name, s.descr, s.dur, s.price
FROM public.providers p
CROSS JOIN LATERAL (
  VALUES
    (CASE p.category WHEN 'gym' THEN 'Group Strength Class' WHEN 'salon' THEN 'Signature Haircut' WHEN 'tuition' THEN 'Weekday Batch' WHEN 'sports' THEN 'Coached Session' ELSE 'Group Class' END,
     'Drop-in session with the resident coach or stylist.', 60, p.price_from/3),
    (CASE p.category WHEN 'gym' THEN 'Personal Training' WHEN 'salon' THEN 'Colour & Styling' WHEN 'tuition' THEN 'Doubt Clearing 1:1' WHEN 'sports' THEN 'Private Coaching' ELSE 'Private Session' END,
     'One-on-one attention, personalised to your goals.', 45, p.price_from/2)
) AS s(name, descr, dur, price);

-- plans
INSERT INTO public.plans (provider_id, name, description, sessions, validity_days, price)
SELECT p.id, x.name, x.descr, x.sessions, x.days, x.price FROM public.providers p
CROSS JOIN LATERAL (VALUES
  ('Starter Pack','8 sessions to try things out.',8,30,p.price_from),
  ('Monthly Unlimited','30 sessions in 30 days.',30,30,p.price_from*2),
  ('Quarterly Pro','90 sessions across 3 months.',90,90,p.price_from*5)
) AS x(name,descr,sessions,days,price);

-- slots: next 7 days
INSERT INTO public.slots (provider_id, service_id, starts_at, ends_at, capacity, booked_count)
SELECT sv.provider_id, sv.id,
  (date_trunc('day', now()) + (d || ' day')::interval + (h || ' hour')::interval) AS starts_at,
  (date_trunc('day', now()) + (d || ' day')::interval + (h || ' hour')::interval + (sv.duration_min || ' minute')::interval),
  CASE WHEN sv.name ILIKE '%Private%' OR sv.name ILIKE '%Personal%' OR sv.name ILIKE '%1:1%' THEN 1 ELSE 8 + (h % 5) END,
  0
FROM public.services sv
CROSS JOIN generate_series(0,6) AS d
CROSS JOIN unnest(ARRAY[7,9,11,17,19]) AS h
WHERE (date_trunc('day', now()) + (d || ' day')::interval + (h || ' hour')::interval) > now();
