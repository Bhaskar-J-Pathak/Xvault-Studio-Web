create table public.orders (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  product_id text not null,
  plan_purchased text not null check (plan_purchased = any (array['scribe'::text, 'pro'::text])),
  status text not null default 'pending' check (status = any (array['pending'::text, 'paid'::text, 'failed'::text])),
  checkout_url text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint orders_pkey primary key (id),
  constraint orders_user_id_fkey foreign key (user_id) references public.profiles(id)
);

create table if not exists public.webhook_events (
  event_id text primary key,
  type text not null,
  received_at timestamptz not null default now()
);


