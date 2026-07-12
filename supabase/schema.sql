-- ============================================================
-- Folkbook schema
-- Paste this whole file into the Supabase SQL Editor and run it.
-- ============================================================


-- ------------------------------------------------------------
-- PROFILES
-- Supabase keeps user accounts in a private table the app can't
-- read. This is a public mirror holding just a display name, so
-- we can show "Bevan's version" next to a set of lyrics.
-- ------------------------------------------------------------
create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  display_name text not null,
  created_at  timestamptz not null default now()
);

-- When someone signs up, make them a profile automatically.
create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- ------------------------------------------------------------
-- SONGS
-- The canonical song. Facts true of the song itself, not of any
-- one person's rendition of it. No lyrics here — those belong
-- to a version.
-- ------------------------------------------------------------
create table songs (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  alt_titles  text[] not null default '{}',
  roud        integer,
  composer    text,

  -- Dylan's classification fields, carried over so the existing
  -- filters keep working. Revisit these later.
  themes      text[] not null default '{}',
  categories  text[] not null default '{}',
  purposes    text[] not null default '{}',
  singers     text[] not null default '{}',
  refrain     text,
  accompanied   boolean not null default true,
  unaccompanied boolean not null default true,
  happiness   integer,
  reference   text,

  created_at  timestamptz not null default now(),
  created_by  uuid references profiles(id) on delete set null
);

create index songs_title_idx on songs (title);


-- ------------------------------------------------------------
-- VERSIONS
-- The heart of it. One song, many versions — because in folk,
-- the version IS the thing. Bevan's words are not Jon's words.
-- ------------------------------------------------------------
create table versions (
  id          uuid primary key default gen_random_uuid(),
  song_id     uuid not null references songs(id) on delete cascade,
  added_by    uuid references profiles(id) on delete set null,

  lyrics      text,
  notes       text,          -- "learned this off my grandmother"
  source      text,          -- where they got it: a record, a person, a book

  created_at  timestamptz not null default now()
);

create index versions_song_id_idx on versions (song_id);


-- ------------------------------------------------------------
-- SAVES
-- Note this points at a VERSION, not a song. "Learn later" means
-- learn Bevan's, specifically.
-- ------------------------------------------------------------
create table saves (
  person_id   uuid not null references profiles(id) on delete cascade,
  version_id  uuid not null references versions(id) on delete cascade,
  status      text not null check (status in ('learning', 'know')),
  created_at  timestamptz not null default now(),
  primary key (person_id, version_id)
);


-- ============================================================
-- ROW LEVEL SECURITY
-- The rules the database itself enforces, on every query, no
-- matter how it arrives. This is what makes "mine" mean mine.
-- ============================================================

alter table profiles enable row level security;
alter table songs    enable row level security;
alter table versions enable row level security;
alter table saves    enable row level security;


-- PROFILES: names are public (we show them on versions).
-- You may only edit your own.
create policy "profiles are readable by everyone"
  on profiles for select using (true);

create policy "you can update your own profile"
  on profiles for update using (auth.uid() = id);


-- SONGS: the catalogue is public. Anyone signed in may add.
-- Nobody may delete — songs are shared property.
create policy "songs are readable by everyone"
  on songs for select using (true);

create policy "signed-in users can add songs"
  on songs for insert with check (auth.uid() is not null);

create policy "signed-in users can edit songs"
  on songs for update using (auth.uid() is not null);


-- VERSIONS: public to read. You may add your own, and edit or
-- delete only your own. Nobody can touch anyone else's words.
create policy "versions are readable by everyone"
  on versions for select using (true);

create policy "you can add your own versions"
  on versions for insert with check (auth.uid() = added_by);

create policy "you can edit your own versions"
  on versions for update using (auth.uid() = added_by);

create policy "you can delete your own versions"
  on versions for delete using (auth.uid() = added_by);


-- SAVES: entirely private. You can only ever see, create, or
-- remove your own. Nobody else can see what you're learning.
create policy "you can read your own saves"
  on saves for select using (auth.uid() = person_id);

create policy "you can create your own saves"
  on saves for insert with check (auth.uid() = person_id);

create policy "you can update your own saves"
  on saves for update using (auth.uid() = person_id);

create policy "you can delete your own saves"
  on saves for delete using (auth.uid() = person_id);
