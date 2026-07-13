/**
 * One-off import: Google Sheet -> Supabase.
 *
 * Fetches the same published sheet the app currently reads (see
 * src/util/load-table.ts), inserts one `songs` row per sheet row, then one
 * `versions` row carrying the sheet's lyrics/info. `added_by` stays null.
 *
 * Run with: yarn dlx tsx scripts/import-from-sheet.ts
 */
import { createClient } from '@supabase/supabase-js';

process.loadEnvFile(new URL('../.env', import.meta.url).pathname);

// This script deliberately uses the SECRET key (no VITE_ prefix — it must
// never reach the browser bundle). RLS only allows authenticated users to
// write, and these seed rows have added_by = null, so the import needs to
// bypass RLS. The app client (src/util/supabase.ts) stays on the
// publishable key.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SECRET_KEY in .env');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

// Parsing helpers copied from src/util/load-table.ts (kept in sync by hand —
// this script is throwaway once the app reads from Supabase directly).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function get(row: any[], i: number): string {
  const item = row[i];
  if (item == null) return '';
  if (item.f != null) return item.f;
  return item.v;
}

function makeList(value: string | null, separator = ';'): string[] {
  if (value == null) return [];
  return value
    .split(new RegExp(' *' + separator + ' *'))
    .filter((s) => s.trim().length > 0);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function sanitize(strings: string[]): string[] {
  return strings.map((s) => capitalize(s));
}

function intOrNull(value: string): number | null {
  if (value.trim() === '') return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

async function main() {
  const res = await fetch(
    'https://docs.google.com/spreadsheets/d/19_AunvMQBWfs3G91r23vIwdEyqy4g9r2p5I7zGPfWvc/gviz/tq?tqx=out:json&sheet=Responses',
  );
  if (!res.ok) throw new Error('Failed to fetch spreadsheet: ' + res.status);
  const text = await res.text();
  const sheet = JSON.parse(text.substring(47, text.length - 2));

  let songsInserted = 0;
  let versionsInserted = 0;
  const skipped: { title: string; reason: string }[] = [];

  for (const row_obj of sheet.table.rows) {
    const row = row_obj.c;
    const title = get(row, 0).trim();
    if (title === '') {
      skipped.push({ title: '(untitled row)', reason: 'empty title cell' });
      continue;
    }

    const song = {
      title,
      alt_titles: makeList(get(row, 2)),
      roud: intOrNull(get(row, 3)),
      composer: get(row, 4),
      themes: sanitize(makeList(get(row, 7), '[,;]')),
      categories: sanitize(makeList(get(row, 8), '[,;]')),
      purposes: sanitize(makeList(get(row, 16), '[,;]')),
      singers: makeList(get(row, 13)),
      refrain: get(row, 6),
      unaccompanied: row[5] == null || get(row, 5).includes('Unaccompanied'),
      accompanied: row[5] == null || get(row, 5).includes('Accompanied'),
      happiness: intOrNull(get(row, 9)) ?? 0,
      reference: get(row, 10),
    };

    const { data: inserted, error: songError } = await supabase
      .from('songs')
      .insert(song)
      .select('id')
      .single();
    if (songError) {
      skipped.push({ title, reason: 'songs insert failed: ' + songError.message });
      continue;
    }
    songsInserted++;

    const lyrics = get(row, 11);
    const notes = get(row, 15);
    const { error: versionError } = await supabase.from('versions').insert({
      song_id: inserted.id,
      added_by: null,
      lyrics: lyrics === '' ? null : lyrics,
      notes: notes === '' ? null : notes,
    });
    if (versionError) {
      skipped.push({
        title,
        reason: 'song inserted but versions insert failed: ' + versionError.message,
      });
      continue;
    }
    versionsInserted++;
  }

  console.log('--- Import summary ---');
  console.log('Songs inserted:    ' + songsInserted);
  console.log('Versions inserted: ' + versionsInserted);
  console.log('Skipped:           ' + skipped.length);
  for (const s of skipped) {
    console.log('  - ' + s.title + ': ' + s.reason);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
