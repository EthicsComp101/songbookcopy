import type { Song, Version } from 'src/components/models';
import { supabase } from './supabase';
type Results = {
  songs: Song[];
  singers: Map<string, number>;
  categories: Map<string, number>;
  themes: Map<string, number>;
  purposes: Map<string, number>;
};
let songs_promise: Promise<Results> | null = null;

type VersionRow = {
  id: string;
  added_by: string | null;
  lyrics: string | null;
  notes: string | null;
  source: string | null;
  created_at: string;
  profiles: { display_name: string } | null;
};

type SongRow = {
  id: string;
  title: string;
  alt_titles: string[];
  roud: number | null;
  composer: string | null;
  themes: string[];
  categories: string[];
  purposes: string[];
  singers: string[];
  refrain: string | null;
  accompanied: boolean;
  unaccompanied: boolean;
  happiness: number | null;
  reference: string | null;
  created_at: string;
  versions: VersionRow[];
};

export async function getSongs(): Promise<Results> {
  if (songs_promise != null) return songs_promise;
  songs_promise = (async () => {
    const { data, error } = await supabase
      .from('songs')
      .select(
        'id, title, alt_titles, roud, composer, themes, categories, purposes, singers, refrain, accompanied, unaccompanied, happiness, reference, created_at, versions(id, added_by, lyrics, notes, source, created_at, profiles!added_by(display_name))',
      )
      .order('created_at', { ascending: true })
      .order('created_at', { referencedTable: 'versions', ascending: true })
      .limit(1000);
    if (error || data == null) {
      throw new Error('Failed to fetch songs: ' + (error?.message ?? 'no data'));
    }
      // Cast via unknown: without generated DB types the client guesses the
      // embedded `profiles` join is an array, but added_by -> profiles.id is
      // many-to-one, so PostgREST returns a single object at runtime.
      const songs: Song[] = (data as unknown as SongRow[]).map((row) => {
        const versions: Version[] = row.versions.map((v) => ({
          id: v.id,
          addedBy: v.added_by,
          authorName: v.profiles?.display_name ?? null,
          lyrics: v.lyrics ?? '',
          notes: v.notes ?? '',
          source: v.source ?? '',
          date: new Date(v.created_at),
        }));
        // The table's search/filter and the old single-lyrics fields keep
        // reading from the first (oldest) version, as before.
        const version = row.versions[0];
        return {
          id: row.id,
          versions,
          name: row.title,
          alt: row.alt_titles,
          roud: row.roud ?? 0,
          singers: row.singers,
          date: new Date(row.created_at),
          composer: row.composer ?? '',
          unaccompanied: row.unaccompanied,
          accompanied: row.accompanied,
          refrain: row.refrain ?? '',
          themes: row.themes,
          categories: row.categories,
          purposes: row.purposes,
          happiness: row.happiness ?? 0,
          reference: row.reference ?? '',
          lyrics: version?.lyrics ?? '',
          info: version?.notes ?? '',
        };
      });
      const singers: Map<string, number> = new Map();
      const categories: Map<string, number> = new Map();
      const themes: Map<string, number> = new Map();
      const purposes: Map<string, number> = new Map();
      for (const song of songs) {
        for (const singer of song.singers) {
          const count = singers.get(singer);
          singers.set(singer, 1 + (count ?? 0));
        }
        for (const cat of song.categories) {
          const count = categories.get(cat);
          categories.set(cat, 1 + (count ?? 0));
        }
        for (const theme of song.themes) {
          const count = themes.get(theme);
          themes.set(theme, 1 + (count ?? 0));
        }
        for (const purpose of song.purposes) {
          const count = purposes.get(purpose);
          purposes.set(purpose, 1 + (count ?? 0));
        }
      }
      return { songs, singers, categories, themes, purposes };
  })();
  return songs_promise;
}

/* ------------------------------------------------------------------
 * Old Google Sheet loader, kept until the Supabase path is confirmed.
 * ------------------------------------------------------------------
import { capitalize } from 'vue';

export async function getSongs(): Promise<Results> {
  if (songs_promise != null) return songs_promise;
  songs_promise = fetch(
    'https://docs.google.com/spreadsheets/d/19_AunvMQBWfs3G91r23vIwdEyqy4g9r2p5I7zGPfWvc/gviz/tq?tqx=out:json&sheet=Responses',
  )
    .then((res) => {
      if (!res.ok) {
        throw new Error('Failed to fetch spreadsheet!');
      }
      return res.text();
    })
    .then((text) => {
      return JSON.parse(text.substring(47, text.length - 2));
    })
    .then(async (songs_sheet) => {
      const songs: Song[] = [];
      for (const row_obj of songs_sheet.table.rows) {
        const row = row_obj.c;
        const song: Song = {
          name: get(row, 0),
          alt: makeList(get(row, 2)),
          roud: Number(get(row, 3)),
          singers: makeList(get(row, 13)),
          date: parseDate(get(row, 1).trim()),
          composer: get(row, 4),
          unaccompanied:
            row[5] == null || get(row, 5).includes('Unaccompanied'),
          accompanied: row[5] == null || get(row, 5).includes('Accompanied'),
          refrain: get(row, 6),
          themes: sanitize(makeList(get(row, 7), '[,;]')),
          categories: sanitize(makeList(get(row, 8), '[,;]')),
          purposes: sanitize(makeList(get(row, 16), '[,;]')),
          happiness: Number(get(row, 9)),
          reference: get(row, 10),
          lyrics: get(row, 11),
          info: get(row, 15),
        };
        if (song.date.getTime() == 0) {
          console.log(song);
        }
        songs.push(song);
      }
      const singers: Map<string, number> = new Map();
      const categories: Map<string, number> = new Map();
      const themes: Map<string, number> = new Map();
      const purposes: Map<string, number> = new Map();
      for (const song of songs) {
        for (const singer of song.singers) {
          const count = singers.get(singer);
          singers.set(singer, 1 + (count ?? 0));
        }
        for (const cat of song.categories) {
          const count = categories.get(cat);
          categories.set(cat, 1 + (count ?? 0));
        }
        for (const theme of song.themes) {
          const count = themes.get(theme);
          themes.set(theme, 1 + (count ?? 0));
        }
        for (const purpose of song.purposes) {
          const count = purposes.get(purpose);
          purposes.set(purpose, 1 + (count ?? 0));
        }
      }
      return { songs, singers, categories, themes, purposes };
    });
  return songs_promise;
}

function sanitize(strings: Array<string>) {
  return strings.map((s) => capitalize(s));
}

function makeList(value: string | null, separator = ';') {
  if (value == null) return [];
  return value
    .split(new RegExp(' *' + separator + ' *'))
    .filter((s) => s.trim().length > 0);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function get(row: any[], i: number): string {
  const item = row[i];
  if (item == null) return '';
  if (item.f != null) return item.f;
  return item.v;
}
function parseDate(dateTime: string): Date {
  const space = dateTime.indexOf(' ');
  const date = dateTime
    .substring(0, space)
    .split('/')
    .map((s) => parseInt(s));
  const time = dateTime
    .substring(space + 1)
    .split(':')
    .map((s) => parseInt(s));

  return new Date(
    date[2] ?? 0,
    (date[1] ?? 1) - 1,
    date[0] ?? 0,
    time[0] ?? 0,
    time[1] ?? 0,
    time[2] ?? 0,
  );
}
------------------------------------------------------------------ */
