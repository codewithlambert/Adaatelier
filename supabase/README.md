# Supabase

Run these in Supabase → SQL Editor → New query, in this order:

1. [`schema.sql`](schema.sql): every table, security rule, checkout function, realtime and storage. Safe to re-run.
2. [`make-owner.sql`](make-owner.sql): makes your account the store owner (add the user in Authentication → Users first).

The same `schema.sql` lives in the admin repo; keep the two copies identical when the schema changes.
