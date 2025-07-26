-- Update existing users to have usernames
UPDATE public.profiles 
SET username = LOWER(REPLACE(name, ' ', ''))
WHERE username IS NULL;

-- Let's also add some demo users for testing
INSERT INTO public.profiles (email, name, role, username)
VALUES 
  ('admin@mall.com', 'Mall Admin', 'superadmin', 'admin'),
  ('landlord1@mall.com', 'John Landlord', 'landlord', 'landlord1'),
  ('tenant1@mall.com', 'Jane Tenant', 'tenant', 'tenant1')
ON CONFLICT (email) DO NOTHING;