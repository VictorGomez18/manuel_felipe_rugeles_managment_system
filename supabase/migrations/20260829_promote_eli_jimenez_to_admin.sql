-- Promote the existing user identified by email to admin
-- and align full_name in both auth.users metadata and public.profiles.

update public.profiles
set
  full_name = 'Eli Jimenez',
  role = 'admin',
  updated_at = now()
where id in (
  select id
  from auth.users
  where email = 'ceimanuelfeliperugelesve@gmail.com'
);

update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('full_name', 'Eli Jimenez')
where email = 'ceimanuelfeliperugelesve@gmail.com';
