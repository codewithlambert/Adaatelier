-- Adds the Ankara and mud cloth bags to a database that already ran schema.sql.
-- Run once in Supabase → SQL Editor. Safe to re-run.
-- (Printed bags come in one colourway, stored as 'onyx', the photographed original.)

insert into public.products (id, name, category, price, stock, sold, status, tagline, description, details, colors, focus, is_new, sort_order) values
  ('ankara-shopper-006', 'Ankara Shopper No. 006', 'Ankara', 64, 18, 0, 'active', 'Indigo wax print, sun rings in mustard and teal.',
   'Our everyday shopper in a heavy cotton wax print, the kind sold by the bolt in Lagos markets. Each panel is cut by hand, so the rings fall a little differently on every bag.',
   '{"100% cotton wax print, lined in canvas","Handmade in Lagos, Nigeria","Reinforced handles, fits a 14-inch laptop","W 38 × H 42 cm"}', '{onyx}', null, true, 6),
  ('ankara-tote-007', 'Ankara Tote No. 007', 'Ankara', 89, 10, 0, 'active', 'Plum print with nested diamonds, leather trim.',
   'The structured tote, wrapped in a plum wax print of nested diamonds and finished with leather edges. Bold enough for the weekend, neat enough for the office.',
   '{"Cotton wax print over a leather base","Handmade in Lagos, Nigeria","Angled side gussets, interior slip pocket","W 34 × H 28 × D 14 cm"}', '{onyx}', '50% 70%', true, 7),
  ('ankara-saddle-008', 'Ankara Saddle No. 008', 'Ankara', 79, 12, 0, 'active', 'Rainbow fans on cream, tan leather strap.',
   'Our signature saddle flap, made in a cream wax print of stacked fans. The tan strap and brushed-gold lock keep it grown-up.',
   '{"Cotton wax print, smooth leather trim","Handmade in Lagos, Nigeria","Adjustable tan strap, brushed-gold lock","W 26 × H 18 × D 8 cm"}', '{onyx}', null, false, 8),
  ('mudcloth-backpack-009', 'Mud Cloth Backpack No. 009', 'African Craft', 98, 6, 0, 'active', 'Hand-painted mud cloth from Mali.',
   'A daypack faced in bògòlanfini, the cotton cloth Malian artisans dye with leaves and paint with fermented river mud. No two bolts match, so no two bags do either.',
   '{"Hand-dyed cotton mud cloth, nylon lining","Cloth from Mali, sewn in Lagos","Padded 15-inch laptop sleeve","Capacity 18 L"}', '{onyx}', null, false, 9)
on conflict (id) do nothing;
