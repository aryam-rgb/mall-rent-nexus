-- Update existing auth.users passwords to "password123"
-- This will allow login with the assumed password

UPDATE auth.users 
SET encrypted_password = crypt('password123', gen_salt('bf')),
    updated_at = now()
WHERE email IN ('jeffaryam@gmail.com', 'dennis.okot@outlook.com', 'esther.namuyomba@outlook.com');