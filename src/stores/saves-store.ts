import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { supabase } from 'src/util/supabase';
import { useAuthStore } from './auth-store';

export type SaveStatus = 'learning' | 'know';

// Saves change constantly, so they deliberately do NOT go through the
// app-lifetime getSongs() cache. This store is the single source of truth;
// every save control reads and writes it, so the UI updates immediately.
export const useSavesStore = defineStore('saves', () => {
  const auth = useAuthStore();

  // version_id -> status, for the signed-in user only (RLS enforces that
  // server-side regardless of what we ask for).
  const saves = ref(new Map<string, SaveStatus>());
  const loaded = ref(false);

  async function load() {
    if (auth.userId == null) {
      saves.value = new Map();
      loaded.value = false;
      return;
    }
    const { data, error } = await supabase
      .from('saves')
      .select('version_id, status')
      .limit(10000);
    if (error) {
      console.error('Failed to load saves: ' + error.message);
      return;
    }
    saves.value = new Map(
      data.map((row) => [row.version_id as string, row.status as SaveStatus]),
    );
    loaded.value = true;
  }

  // Reload on sign-in, clear on sign-out.
  watch(
    () => auth.userId,
    () => void load(),
    { immediate: true },
  );

  function statusOf(versionId: string): SaveStatus | null {
    return saves.value.get(versionId) ?? null;
  }

  async function setStatus(versionId: string, status: SaveStatus | null) {
    if (auth.userId == null) throw new Error('Not signed in');
    const previous = saves.value.get(versionId) ?? null;
    if (previous === status) return;

    // Optimistic update; rolled back if the database refuses.
    const next = new Map(saves.value);
    if (status == null) next.delete(versionId);
    else next.set(versionId, status);
    saves.value = next;

    try {
      if (status == null) {
        const { error } = await supabase
          .from('saves')
          .delete()
          .eq('person_id', auth.userId)
          .eq('version_id', versionId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from('saves').upsert(
          { person_id: auth.userId, version_id: versionId, status },
          { onConflict: 'person_id,version_id' },
        );
        if (error) throw new Error(error.message);
      }
    } catch (e) {
      const rollback = new Map(saves.value);
      if (previous == null) rollback.delete(versionId);
      else rollback.set(versionId, previous);
      saves.value = rollback;
      throw e;
    }
  }

  return { saves, loaded, load, statusOf, setStatus };
});
