# admin_users表
```sql
create table public.admin_users (
  id bigserial primary key,
  user_id uuid not null unique,
  role varchar(20) not null default 'admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_users_user_id_fkey
    foreign key (user_id) references auth.users(id)
    on delete cascade
);

create index if not exists idx_admin_users_user_id
  on public.admin_users(user_id);
```
#  工具提交表
```sql
create table public.tool_submissions (
  id bigserial not null,
  user_id uuid not null,
  category_id bigint not null,
  name character varying(200) not null,
  slug character varying(200) not null,
  website_url text not null,
  logo_url text null,
  cover_image_url text null,
  short_description character varying(300) not null,
  content text null,
  status character varying(20) not null default 'pending'::character varying,
  review_notes text null,
  reviewed_at timestamp with time zone null,
  approved_tool_id bigint null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint tool_submissions_pkey primary key (id),
  constraint tool_submissions_approved_tool_id_fkey foreign KEY (approved_tool_id) references ai_tools (id),
  constraint tool_submissions_category_id_fkey foreign KEY (category_id) references tool_categories (id),
  constraint tool_submissions_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint chk_tool_submissions_status check (
    (
      (status)::text = any (
        (
          array[
            'pending'::character varying,
            'approved'::character varying,
            'rejected'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_tool_submissions_user_id on public.tool_submissions using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_tool_submissions_category_id on public.tool_submissions using btree (category_id) TABLESPACE pg_default;

create index IF not exists idx_tool_submissions_status on public.tool_submissions using btree (status) TABLESPACE pg_default;

create index IF not exists idx_tool_submissions_created_at on public.tool_submissions using btree (created_at desc) TABLESPACE pg_default;

create trigger trg_tool_submissions_updated_at BEFORE
update on tool_submissions for EACH row
execute FUNCTION set_updated_at ();
```
# 工具分类表

```sql
create table public.tool_categories (
  id bigserial not null,
  slug character varying(50) not null,
  name character varying(100) not null,
  icon text null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint tool_categories_pkey primary key (id),
  constraint tool_categories_slug_key unique (slug)
) TABLESPACE pg_default;

create index IF not exists idx_tool_categories_sort_order on public.tool_categories using btree (sort_order) TABLESPACE pg_default;

create trigger trg_tool_categories_updated_at BEFORE
update on tool_categories for EACH row
execute FUNCTION set_updated_at ();
```
# ai工具表
```sql
create table public.ai_tools (
  id bigserial not null,
  category_id bigint not null,
  name character varying(200) not null,
  slug character varying(200) not null,
  website_url text not null,
  logo_url text null,
  cover_image_url text null,
  short_description character varying(300) not null,
  content text null,
  is_hot boolean not null default false,
  is_new boolean not null default false,
  status character varying(20) not null default 'published'::character varying,
  published_at timestamp with time zone null,
  source_submission_id bigint null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint ai_tools_pkey primary key (id),
  constraint ai_tools_slug_key unique (slug),
  constraint ai_tools_category_id_fkey foreign KEY (category_id) references tool_categories (id),
  constraint chk_ai_tools_status check (
    (
      (status)::text = any (
        (
          array[
            'published'::character varying,
            'hidden'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_ai_tools_category_id on public.ai_tools using btree (category_id) TABLESPACE pg_default;

create index IF not exists idx_ai_tools_status on public.ai_tools using btree (status) TABLESPACE pg_default;

create index IF not exists idx_ai_tools_is_hot on public.ai_tools using btree (is_hot) TABLESPACE pg_default;

create index IF not exists idx_ai_tools_is_new on public.ai_tools using btree (is_new) TABLESPACE pg_default;

create trigger trg_ai_tools_updated_at BEFORE
update on ai_tools for EACH row
execute FUNCTION set_updated_at ();


```