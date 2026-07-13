/**
 * Backup: dump all rows from songs, versions, profiles and saves as JSON
 * into backups/<timestamp>/, one file per table.
 *
 * Uses SUPABASE_SECRET_KEY (RLS would hide other people's saves from any
 * lesser key, and a backup that silently misses rows is worse than none).
 *
 * The backups/ folder is gitignored and must stay that way: this repo is
 * public, profiles holds display names, and saves reveals what people are
 * privately learning.
 *
 * Does NOT capture auth.users — a true full restore needs pg_dump with the
 * database connection string. This covers the user-generated content only.
 *
 * Run with: yarn dlx tsx scripts/backup.ts
 */
import { mkdirSync, writeFileSync, statSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

process.loadEnvFile(new URL('../.env', import.meta.url).pathname);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SECRET_KEY in .env');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

const TABLES = ['songs', 'versions', 'profiles', 'saves'] as const;
const PAGE = 1000;

async function dumpTable(table: string): Promise<unknown[]> {
  const rows: unknown[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...data);
    if (data.length < PAGE) break;
  }
  return rows;
}

async function main() {
  const stamp = new Date().toISOString().replace(/:/g, '-').replace(/\..*$/, '');
  const dir = new URL(`../backups/${stamp}/`, import.meta.url).pathname;
  mkdirSync(dir, { recursive: true });

  for (const table of TABLES) {
    const rows = await dumpTable(table);
    const path = dir + table + '.json';
    writeFileSync(path, JSON.stringify(rows, null, 1));
    const kb = (statSync(path).size / 1024).toFixed(1);
    console.log(`${table.padEnd(9)} ${String(rows.length).padStart(5)} rows  ${kb.padStart(8)} KB`);
  }
  console.log('\nWritten to ' + dir);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
