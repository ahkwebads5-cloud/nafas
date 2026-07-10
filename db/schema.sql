-- ============================================================
--  نَفَس — Database schema (Supabase / Postgres)
--  نموذج: دفعة لمرة واحدة (one-time unlock)
--  الاستخدام: انسخ الملف ده كله والصقه في Supabase → SQL Editor → Run
-- ============================================================

-- 1) جدول العملاء / الـleads — كل عملية حساب بتتسجّل هنا
create table if not exists public.leads (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  name           text,
  contact        text,                 -- إيميل أو موبايل
  sector         text,
  stage          text,
  country        text,
  cash           numeric,
  expenses       numeric,
  revenue        numeric,
  growth         numeric,
  target_months  int,
  runway_months  int,                  -- 999 = مؤمّن
  amount_needed  numeric
);

create index if not exists leads_contact_idx    on public.leads (contact);
create index if not exists leads_created_at_idx  on public.leads (created_at desc);

-- 2) جدول المدفوعات / الفتح — كل دفعة "برو" ناجحة
create table if not exists public.unlocks (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  lead_id        uuid references public.leads (id) on delete set null,
  contact        text not null,        -- بنربط الفتح بالعميل عن طريق ده
  payment_id     text,                 -- رقم فاتورة/دفعة MyFatoorah
  amount         numeric,
  currency       text default 'EGP',
  status         text not null default 'pending'  -- pending | paid | failed
);

create index if not exists unlocks_contact_idx    on public.unlocks (contact);
create index if not exists unlocks_payment_id_idx  on public.unlocks (payment_id);

-- 3) أمان الصفوف (Row Level Security)
alter table public.leads   enable row level security;
alter table public.unlocks enable row level security;

-- الواجهة (anon key) مسموح لها تضيف lead بس — مش تقرأ بيانات غيرها
create policy "anon can insert leads"
  on public.leads for insert
  to anon
  with check (true);

-- لا سياسات قراءة/تعديل للـanon على unlocks:
-- كل الكتابة والتأكيد بيتم من Vercel Function بمفتاح service_role (بيتخطى RLS بأمان)

-- ملاحظة (المرحلة الجاية): جدول funding_sources عشان تفاصيل "برو"
-- تتخزن في قاعدة البيانات وتتعدّل من غير ما نلمس الكود.
