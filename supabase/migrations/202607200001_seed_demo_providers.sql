-- Demo providers for BenchDial Call Room (consenting role-play counterparties).
-- Safe to re-run: only inserts when display_name is missing.

insert into public.providers (display_name, negotiation_style, is_consented_demo_counterparty)
select 'OEM Precision', 'manufacturer_premium', true
where not exists (select 1 from public.providers where display_name = 'OEM Precision');

insert into public.providers (display_name, negotiation_style, is_consented_demo_counterparty)
select 'RapidBench', 'independent_hidden_fees', true
where not exists (select 1 from public.providers where display_name = 'RapidBench');

insert into public.providers (display_name, negotiation_style, is_consented_demo_counterparty)
select 'MetroLab Field', 'regional_stonewall', true
where not exists (select 1 from public.providers where display_name = 'MetroLab Field');
