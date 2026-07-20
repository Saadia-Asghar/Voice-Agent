create table if not exists public.approved_vendors (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  phone text,
  source text not null default 'approved_list',
  vertical text not null default 'laboratory_equipment_repair',
  site_region text,
  rating text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (display_name, vertical)
);

alter table public.approved_vendors enable row level security;
revoke all on public.approved_vendors from anon, authenticated;

insert into public.approved_vendors (display_name, phone, source, site_region, rating, notes)
select 'OEM Precision', '+1 (704) 555-0142', 'approved_list', 'Charlotte MSA', '4.8 · 126 reviews', 'Customer-approved OEM roster'
where not exists (select 1 from public.approved_vendors where display_name = 'OEM Precision');

insert into public.approved_vendors (display_name, phone, source, site_region, rating, notes)
select 'RapidBench', '+1 (704) 555-0198', 'yelp', 'Charlotte MSA', '4.5 · 89 reviews', 'Independent repair — hidden fee pattern'
where not exists (select 1 from public.approved_vendors where display_name = 'RapidBench');

insert into public.approved_vendors (display_name, phone, source, site_region, rating, notes)
select 'MetroLab Field', '+1 (980) 555-0133', 'google_maps', 'Charlotte MSA', '4.2 · 54 reviews', 'Regional field service'
where not exists (select 1 from public.approved_vendors where display_name = 'MetroLab Field');
