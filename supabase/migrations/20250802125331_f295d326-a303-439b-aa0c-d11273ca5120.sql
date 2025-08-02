-- Create auth.users entries for existing profiles
-- This will allow the existing profiles to actually log in

-- Insert auth users that correspond to existing profiles
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud,
  confirmation_token,
  email_change_token_new,
  email_change_token_current,
  recovery_token
) VALUES 
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'esther.namuyomba@outlook.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Esther Namuyomba", "role": "tenant", "username": "esthernamuyomba"}',
    false,
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    ''
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'dennis.okot@outlook.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Dennis Okot", "role": "landlord", "username": "dennisokot"}',
    false,
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    ''
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'jeffaryam@gmail.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Jeff Aryam", "role": "superadmin", "username": "admin"}',
    false,
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    ''
  );

-- Update the profiles table to link to the newly created auth.users
UPDATE public.profiles 
SET user_id = (SELECT id FROM auth.users WHERE email = profiles.email)
WHERE email IN ('esther.namuyomba@outlook.com', 'dennis.okot@outlook.com', 'jeffaryam@gmail.com');