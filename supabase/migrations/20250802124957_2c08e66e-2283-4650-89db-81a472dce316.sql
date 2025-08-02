-- Create demo profiles for testing
-- Using existing system to ensure they work with the app

-- Create demo users by inserting directly into profiles
-- This will create users that can be looked up but can't actually log in
-- since they don't exist in auth.users
INSERT INTO public.profiles (user_id, email, name, role, username) VALUES 
  (gen_random_uuid(), 'admin@mall.com', 'Mall Admin', 'superadmin', 'admin'),
  (gen_random_uuid(), 'landlord1@mall.com', 'John Landlord', 'landlord', 'landlord1'),
  (gen_random_uuid(), 'tenant1@mall.com', 'Jane Tenant', 'tenant', 'tenant1')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  username = EXCLUDED.username;