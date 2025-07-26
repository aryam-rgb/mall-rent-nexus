-- Create demo users in auth.users table
-- These will automatically trigger profile creation

-- First, let's clean up any existing profiles without auth users
DELETE FROM public.profiles WHERE email IN ('admin@mall.com', 'landlord1@mall.com', 'tenant1@mall.com');

-- Insert users into auth.users (this is the proper way)
-- Note: We need to insert into auth.users with encrypted passwords
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  aud,
  role,
  raw_user_meta_data,
  confirmation_token,
  email_change_token_new,
  recovery_token,
  raw_app_meta_data
) VALUES 
(
  '5f37d250-5ce9-4c47-8934-9344fda52520'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'admin@mall.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated',
  '{"name": "Mall Admin", "role": "superadmin", "username": "admin"}',
  '',
  '',
  '',
  '{"provider": "email", "providers": ["email"]}'
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000'::uuid,
  'landlord1@mall.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated',
  '{"name": "John Landlord", "role": "landlord", "username": "landlord1"}',
  '',
  '',
  '',
  '{"provider": "email", "providers": ["email"]}'
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000'::uuid,
  'tenant1@mall.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated',
  '{"name": "Jane Tenant", "role": "tenant", "username": "tenant1"}',
  '',
  '',
  '',
  '{"provider": "email", "providers": ["email"]}'
);