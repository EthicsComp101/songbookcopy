<template>
  <q-page>
    <div class="q-pa-md">
      <q-input v-model="filter_string" label="Search" clearable />
      <div class="filters">
        <q-select v-model="singers_filter" multiple :options="singers" label="Singers" style="flex-grow: 1"
          behavior="menu" clearable />
        <div class="filters" style="width: 45%; max-width: 50%">
          <q-toggle v-model="acc_filter" size="xl" icon="piano" />
          <q-toggle v-model="unacc_filter" size="xl" icon="piano_off" />
        </div>
      </div>
      <div class="filters">
        <q-select v-model="cat_filter" multiple :options="categories" label="Categories" style="flex-grow: 1"
          behavior="menu" clearable />
        <q-range v-model="refrain_filter" :min=1 :max=3 :step=1 markers marker-labels
          style="width: 45%; max-width: 50%">
          <template v-slot:marker-label-group="{ markerList }">
            <q-icon :key="0" :class="(<any>markerList[0]).classes" :style="(<any>markerList[0]).style" size="xs"
              name="person" />
            <q-icon :key="1" :class="(<any>markerList[1]).classes" :style="(<any>markerList[1]).style" size="xs"
              name="group" />
            <q-icon :key="2" :class="(<any>markerList[2]).classes" :style="(<any>markerList[2]).style" size="xs"
              name="groups" />
          </template>
        </q-range>
      </div>
      <q-range v-model="happiness_filter" :min=1 :max=5 :step=1 markers marker-labels>
        <template v-slot:marker-label-group="{ markerList }">

          <q-icon v-for="val in [0, 1, 2, 3, 4]" :key="val" :class="(<any>markerList[val]).classes"
            :style="(<any>markerList[val]).style" size="xs" :name="getIconName(val)" />
        </template>
      </q-range>
    </div>
    <Suspense>
      <template #fallback>
        <div class="notice">Loading...</div>
      </template>
      <SongTable :filter_string="filter_string" :happiness_filter="happiness_filter" :refrain_filter="refrain_filter"
        :singers_filter="singers_filter" :cat_filter="cat_filter" :acc_filter="acc_filter" :unacc_filter="unacc_filter"
        @updateSingers="updateSingers" @updateCategories="updateCategories" />
    </Suspense>
    <q-page-scroller position="bottom-right" :scroll-offset="150" :offset="[18, 36]">
      <q-btn fab icon="keyboard_arrow_up" color="accent-clear" />
    </q-page-scroller>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import SongTable from 'src/components/SongTable.vue';

export default defineComponent({
  name: 'TablePage',
  components: { SongTable },
  setup: function () {
    return { singers: ref(new Array<string>()), categories: ref(new Array<string>()) };
  },
  data() {
    return {
      filter_string: ref(null),
      happiness_filter: ref({ min: 1, max: 5 }),
      refrain_filter: ref({ min: 1, max: 3 }),
      singers_filter: ref(null),
      cat_filter: ref(null),
      acc_filter: ref(true),
      unacc_filter: ref(true),
    }
  },
  methods: {
    getIconName(index: number): string {
      switch (index) {
        case 0: return 'sentiment_very_dissatisfied';
        case 1: return 'sentiment_dissatisfied';
        case 3: return 'sentiment_satisfied';
        case 4: return 'sentiment_very_satisfied';
        default:
        case 2: return 'sentiment_neutral';
      }
    },
    updateSingers(singers: Map<string, number>) {
      this.singers.length = 0;
      this.singers.push(...singers.keys());
      this.singers.sort((a, b) => (singers.get(b) ?? 0) - (singers.get(a) ?? 0));
    },
    updateCategories(categories: Map<string, number>) {
      this.categories.length = 0;
      this.categories.push(...categories.keys());
      this.categories.sort((a, b) => (categories.get(b) ?? 0) - (categories.get(a) ?? 0));
    }
  }
});
</script>
