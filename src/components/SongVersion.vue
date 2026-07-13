<template>
  <q-card flat bordered class="version-card">
    <q-card-section class="q-pb-none">
      <div class="row items-center justify-between q-col-gutter-sm">
        <div class="col">
          <div class="text-subtitle1 text-weight-medium">
            {{ attribution }}
          </div>
          <div v-if="version.source" class="source row items-center q-mt-xs">
            <q-icon name="menu_book" size="1.2em" class="q-mr-sm" />
            <span>{{ version.source }}</span>
          </div>
        </div>
        <div class="col-auto" v-if="auth.signedIn">
          <q-btn-toggle
            :model-value="saves.statusOf(version.id)"
            @update:model-value="setStatus"
            clearable
            dense
            no-caps
            unelevated
            toggle-color="primary"
            :options="[
              { label: 'Learning', value: 'learning' },
              { label: 'Know it', value: 'know' },
            ]"
          />
        </div>
      </div>
      <div v-if="version.notes" class="notes text-italic q-mt-sm">
        {{ version.notes }}
      </div>
    </q-card-section>
    <q-card-section v-if="sections" class="lyrics q-pt-none">
      <div
        class="section"
        v-for="(section, index) in sections"
        :key="index"
        @click="scrollTo($event)"
      >
        {{ section }}
      </div>
    </q-card-section>
    <q-card-section v-else class="text-italic">
      No lyrics for this version.
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import type { Version } from 'src/components/models';
import { useAuthStore } from 'src/stores/auth-store';
import { useSavesStore, type SaveStatus } from 'src/stores/saves-store';

const props = defineProps<{ version: Version }>();

const $q = useQuasar();
const auth = useAuthStore();
const saves = useSavesStore();

// Imported catalogue versions have no author (added_by null) — and some of
// them explicitly aren't the importer's own words, so don't invent one.
const attribution = computed(
  () => props.version.authorName ?? 'From the original catalogue',
);

const sections = computed(() => {
  const lyrics = props.version.lyrics;
  if (!lyrics) return null;
  return lyrics.split(/\n *\n/);
});

async function setStatus(status: SaveStatus | null) {
  try {
    await saves.setStatus(props.version.id, status);
  } catch (e) {
    $q.notify({
      type: 'negative',
      message:
        'Could not update your list: ' +
        (e instanceof Error ? e.message : String(e)),
    });
  }
}

function scrollTo(event: MouseEvent) {
  const target_obj = event.target;
  if (!(target_obj instanceof Element)) return;
  target_obj.scrollIntoView({ behavior: 'smooth' });
}
</script>

<style lang="scss" scoped>
.version-card {
  margin-bottom: 16px;

  .source {
    font-size: 1em;
    opacity: 0.9;
  }

  .notes {
    opacity: 0.7;
  }
}
</style>
