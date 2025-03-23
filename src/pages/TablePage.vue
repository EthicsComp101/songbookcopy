<template>
  <q-page>
    <div class="q-pa-md">
      <q-input v-model="filter_string" label="Search" clearable />
      <div class="filters">
        <q-select
          v-model="singers_filter"
          multiple
          :options="singers"
          label="Singers"
          style="flex-grow: 1"
          behavior="menu"
          clearable
        />
        <div class="filters" style="width: 45%; max-width: 50%">
          <q-toggle v-model="acc_filter" size="xl" icon="piano" />
          <q-toggle v-model="unacc_filter" size="xl" icon="piano_off" />
        </div>
      </div>
      <div class="filters">
        <q-field
          ref="tagSelector"
          label="Tags"
          style="flex-grow: 1"
          v-model="tags_filter"
          clearable
          @clear="clearTags"
        >
          <template v-slot:control>
            <div
              style="width: 100%; height: 100%; position: absolute"
              @click="selectTags = true"
            />
            <div
              class="self-center full-width no-outline"
              tabindex="0"
              v-if="tags_filter"
            >
              {{
                Object.values(tags_filter)
                  .map((o) => o.selections.join(o.all ? ' + ' : ' | '))
                  .filter((s) => s.length > 0)
                  .join(', ')
              }}
            </div>
          </template>
          <q-dialog v-model="selectTags" @hide="updateTagFilters">
            <q-card class="tag-selection">
              <q-tabs
                v-model="tab"
                dense
                class="text-grey"
                active-color="primary"
                indicator-color="primary"
                align="justify"
                narrow-indicator
              >
                <q-tab name="categories" label="Categories" />
                <q-tab name="themes" label="Themes" />
                <q-tab name="purposes" label="Purposes" />
              </q-tabs>

              <q-separator />

              <q-tab-panels v-model="tab" animated>
                <q-tab-panel name="categories">
                  <TagTab v-model="category_selections" :options="categories" />
                </q-tab-panel>
                <q-tab-panel name="themes">
                  <TagTab v-model="theme_selections" :options="themes" />
                </q-tab-panel>
                <q-tab-panel name="purposes">
                  <TagTab
                    v-model="purpose_selections"
                    :options="purposes"
                    default-all
                  />
                </q-tab-panel>
              </q-tab-panels>
            </q-card>
          </q-dialog>
        </q-field>
        <q-range
          v-model="refrain_filter"
          :min="1"
          :max="3"
          :step="1"
          markers
          marker-labels
          style="width: 45%; max-width: 50%"
        >
          <template v-slot:marker-label-group="{ markerList }">
            <q-icon
              :key="0"
              :class="(<any>markerList[0]).classes"
              :style="(<any>markerList[0]).style"
              size="xs"
              name="person"
            />
            <q-icon
              :key="1"
              :class="(<any>markerList[1]).classes"
              :style="(<any>markerList[1]).style"
              size="xs"
              name="group"
            />
            <q-icon
              :key="2"
              :class="(<any>markerList[2]).classes"
              :style="(<any>markerList[2]).style"
              size="xs"
              name="groups"
            />
          </template>
        </q-range>
      </div>
      <q-range
        v-model="happiness_filter"
        :min="1"
        :max="5"
        :step="1"
        markers
        marker-labels
      >
        <template v-slot:marker-label-group="{ markerList }">
          <q-icon
            v-for="val in [0, 1, 2, 3, 4]"
            :key="val"
            :class="(<any>markerList[val]).classes"
            :style="(<any>markerList[val]).style"
            size="xs"
            :name="getIconName(val)"
          />
        </template>
      </q-range>
    </div>
    <Suspense>
      <template #fallback>
        <div class="notice">Loading...</div>
      </template>
      <SongTable
        :filter_string="filter_string"
        :happiness_filter="happiness_filter"
        :refrain_filter="refrain_filter"
        :singers_filter="singers_filter"
        :tags_filter="tags_filter"
        :acc_filter="acc_filter"
        :unacc_filter="unacc_filter"
        @updateSingers="(map) => doUpdate(singers, map)"
        @updateCategories="(map) => doOptionsUpdate(categories, map)"
        @updateThemes="(map) => doOptionsUpdate(themes, map)"
        @updatePurposes="(map) => doOptionsUpdate(purposes, map)"
      />
    </Suspense>
    <q-page-scroller
      position="bottom-right"
      :scroll-offset="150"
      :offset="[18, 36]"
    >
      <q-btn fab icon="keyboard_arrow_up" color="accent-clear" />
    </q-page-scroller>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import SongTable from 'src/components/SongTable.vue';
import { QField } from 'quasar';
import type { TagFilterModel, Option } from 'src/components/TagTab.vue';
import TagTab from 'src/components/TagTab.vue';

const categories = ref(new Array<Option>());
const themes = ref(new Array<Option>());
const purposes = ref(new Array<Option>());

const tagSelector = ref<QField | null>(null);
const selectTags = ref<boolean>(false);
const tab = ref<string>('categories');

const category_selections = ref<TagFilterModel>({ selections: [] });
const theme_selections = ref<TagFilterModel>({ selections: [] });
const purpose_selections = ref<TagFilterModel>({ selections: [], all: true });
const tags_filter = ref<{
  categories: TagFilterModel;
  themes: TagFilterModel;
  purposes: TagFilterModel;
} | null>(null);

function updateTagFilters() {
  if (
    category_selections.value.selections.length == 0 &&
    theme_selections.value.selections.length == 0 &&
    purpose_selections.value.selections.length == 0
  ) {
    tags_filter.value = null;
    return;
  }
  tags_filter.value = {
    categories: category_selections.value,
    themes: theme_selections.value,
    purposes: purpose_selections.value,
  };
}

function clearTags() {
  category_selections.value.selections.splice(0);
  theme_selections.value.selections.splice(0);
  purpose_selections.value.selections.splice(0);
  tags_filter.value = null;
}

const singers = ref(new Array<string>());

const filter_string = ref(null);
const happiness_filter = ref({ min: 1, max: 5 });
const refrain_filter = ref({ min: 1, max: 3 });
const singers_filter = ref(Array<string>());
const acc_filter = ref(true);
const unacc_filter = ref(true);

function getIconName(index: number): string {
  switch (index) {
    case 0:
      return 'sentiment_very_dissatisfied';
    case 1:
      return 'sentiment_dissatisfied';
    case 3:
      return 'sentiment_satisfied';
    case 4:
      return 'sentiment_very_satisfied';
    default:
    case 2:
      return 'sentiment_neutral';
  }
}
function doUpdate(destination: Array<string>, map: Map<string, number>) {
  destination.splice(0);
  destination.push(...map.keys());
  destination.sort((a, b) => (map.get(b) ?? 0) - (map.get(a) ?? 0));
}
function doOptionsUpdate(destination: Array<Option>, map: Map<string, number>) {
  destination.splice(0);
  destination.push(
    ...Array.from(map.keys()).map((s) => {
      return { label: s, value: s };
    }),
  );
  destination.sort((a, b) => (map.get(b.value) ?? 0) - (map.get(a.value) ?? 0));
}
</script>
