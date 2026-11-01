-- Read-only demo account for showing the admin to prospective clients.
-- It can open every page and see live data, but the database refuses any change it tries.
--
-- 1. Authentication → Users → Add user: an address like demo@yourdomain.com (it doesn't have to
--    receive mail), a password you're happy to share, tick "Auto confirm user".
-- 2. Change the email below to match, then run this.
-- 3. To show a one-click "Explore the demo" button on the admin sign-in page, add these to the
--    admin's Vercel environment variables and redeploy:
--      VITE_DEMO_EMAIL=demo@yourdomain.com
--      VITE_DEMO_PASSWORD=the password from step 1
--    They end up in the admin's public code, which is fine: this account can't change anything.
insert into public.staff (id, full_name, role)
select id, 'Demo', 'demo'
from auth.users
where email = 'demo@yourdomain.com'
on conflict (id) do update set role = 'demo';

-- Check: should list the demo account with role = demo
select s.full_name, s.role, u.email
from public.staff s
join auth.users u on u.id = s.id;
