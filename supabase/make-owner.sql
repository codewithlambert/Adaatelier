-- Make an existing Supabase user the store owner.
-- Run AFTER schema.sql, and after adding the user in
-- Authentication → Users → Add user (tick "Auto confirm user").
insert into public.staff (id, full_name, role)
select id, 'Lambert', 'owner'
from auth.users
where email = 'igweajurijosph@gmail.com'
on conflict (id) do update set role = 'owner';

-- Check it worked: should return one row with role = owner
select s.full_name, s.role, u.email
from public.staff s
join auth.users u on u.id = s.id;
