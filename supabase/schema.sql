-- Mon Opticien — full database schema.
-- Run once in the Supabase SQL editor of a new project, then `npm run seed`.
-- Safe to re-run: every statement is idempotent.

-- ─── Products ────────────────────────────────────────────────────────────────
create table if not exists public.products (
  id              text primary key,
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_fr         text not null,
  name_en         text not null,
  description_fr  text not null default '',
  description_en  text not null default '',
  category        text not null check (category in ('sunglasses', 'eyeglasses', 'contact_lenses')),
  brand           text not null,
  price           numeric(10, 3) not null check (price >= 0),
  currency        text not null default 'TND' check (currency = 'TND'),
  image           text not null,
  gallery         text[] not null default '{}',
  gender          text not null check (gender in ('men', 'women', 'unisex')),
  frame_color     text not null default '',
  lens_color      text not null default '',
  frame_material  text not null default '',
  uv_protection   boolean not null default false,
  polarized       boolean not null default false,
  availability    boolean not null default true,
  is_featured     boolean not null default false,
  frame_shape     text check (frame_shape in ('round', 'rectangle', 'square', 'aviator', 'cat_eye', 'browline', 'wayfarer')),
  tryon_image     text,
  created_at      timestamptz not null default now()
);

-- Upgrading an existing products table (pre try-on):
alter table public.products add column if not exists frame_shape text
  check (frame_shape in ('round', 'rectangle', 'square', 'aviator', 'cat_eye', 'browline', 'wayfarer'));
alter table public.products add column if not exists tryon_image text;

-- ─── Fitting reservations ("try-on tray") ────────────────────────────────────
create table if not exists public.reservations (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null check (char_length(name) between 2 and 80),
  phone       text check (phone is null or char_length(phone) <= 30),
  note        text check (note is null or char_length(note) <= 300),
  visit_at    timestamptz not null,
  items       jsonb not null,           -- server-side snapshot: [{id, slug, name, brand, price}]
  locale      text not null check (locale in ('fr', 'en')),
  status      text not null default 'new'
              check (status in ('new', 'confirmed', 'visited', 'no_show', 'cancelled')),
  created_at  timestamptz not null default now()
);
create index if not exists reservations_visit_at_idx on public.reservations (visit_at);

-- ─── Row Level Security ──────────────────────────────────────────────────────
-- The app only talks to the database from the server with the service-role key, which bypasses
-- RLS. Enabling RLS with no policies means the public anon key can read/write NOTHING —
-- reservations contain names and phone numbers and must never be exposed.
alter table public.products     enable row level security;
alter table public.reservations enable row level security;

-- ─── Storage bucket for product photos ───────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;
