-- ============================================================
-- add_song: insert a song and its first version atomically.
--
-- A song must never exist without a version (a song without
-- anyone's words is useless), and RLS deliberately provides no
-- delete policy on songs, so client-side compensation is
-- impossible. A single function body = a single transaction:
-- if the versions insert fails, the songs insert rolls back.
--
-- SECURITY INVOKER: runs with the caller's permissions, so the
-- existing RLS policies still decide who may insert. Signed-out
-- callers are refused by the policies themselves.
--
-- Paste this file into the Supabase SQL Editor and run it.
-- ============================================================

create or replace function public.add_song(
  p_title         text,
  p_alt_titles    text[]  default '{}',
  p_roud          integer default null,
  p_composer      text    default null,
  p_themes        text[]  default '{}',
  p_categories    text[]  default '{}',
  p_refrain       text    default null,
  p_accompanied   boolean default true,
  p_unaccompanied boolean default true,
  p_reference     text    default null,
  p_lyrics        text    default null,
  p_notes         text    default null,
  p_source        text    default null
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_song_id uuid;
begin
  -- "title text not null" doesn't prevent '', and a blank title breaks
  -- the /lyrics/:song_name route.
  if p_title is null or trim(p_title) = '' then
    raise exception 'A song needs a title';
  end if;

  insert into public.songs
    (title, alt_titles, roud, composer, themes, categories, refrain,
     accompanied, unaccompanied, reference, created_by)
  values
    (p_title, p_alt_titles, p_roud, p_composer, p_themes, p_categories,
     p_refrain, p_accompanied, p_unaccompanied, p_reference, auth.uid())
  returning id into new_song_id;

  insert into public.versions (song_id, added_by, lyrics, notes, source)
  values (new_song_id, auth.uid(), p_lyrics, p_notes, p_source);

  return new_song_id;
end;
$$;

revoke execute on function public.add_song from public, anon;
grant execute on function public.add_song to authenticated;
