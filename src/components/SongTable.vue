<template>
  <q-table
    :rows="songs"
    :columns="COLUMNS"
    row-key="name"
    card-class="song-table"
    :rows-per-page-options="NO_ROWS"
    :filter="[
      filter_string,
      happiness_filter,
      refrain_filter,
      singers_filter,
      tags_filter,
      acc_filter,
      unacc_filter,
    ]"
    :filter-method="filter"
    hide-bottom
    :pagination="{ sortBy: 'date', descending: true }"
  >
    <template v-slot:header="props">
      <q-tr :props="props">
        <q-th auto-width />
        <q-th v-for="col in props.cols" :key="col.name" :props="props">
          {{ col.label }}
        </q-th>
      </q-tr>
    </template>
    <template v-slot:body="props">
      <q-tr :props="props">
        <q-td auto-width>
          <q-btn
            size="sm"
            color="accent"
            round
            dense
            @click="props.expand = !props.expand"
            :icon="props.expand ? 'expand_more' : 'chevron_right'"
          />
        </q-td>
        <q-td
          v-for="col in props.cols"
          :key="col.name"
          :props="props"
          class="table-cell"
          :class="{
            small:
              typeof col.value == 'string' &&
              col.value.includes('\n') &&
              col.name != 'name',
          }"
        >
          {{ col.value }}
          <div v-if="col.name == 'name'" class="composer">
            {{ props.row.composer }}
          </div>
        </q-td>
      </q-tr>
      <q-tr v-show="props.expand" :props="props" class="expand">
        <q-td colspan="100%" class="details-td">
          <SongDetails :song="props.row" :visible="props.expand" />
        </q-td>
      </q-tr>
    </template>
  </q-table>
</template>

<script setup lang="ts">
import type { QTableProps } from 'quasar';
import type { Song } from './models';
import { getSongs } from 'src/util/load-table';
import SongDetails from './SongDetails.vue';
import type { TagFilterModel } from './TagTab.vue';

const NO_ROWS = [0];

function removeThe(s: string): string {
  if (s.startsWith('The')) return s.substring(4);
  return s;
}

const COLUMNS: QTableProps['columns'] = [
  {
    name: 'name',
    label: 'Name',
    field: 'name',
    required: true,
    align: 'left',
    sortable: true,
    sort: (a, b /*, _rowA, _rowB*/) => {
      return removeThe(a).localeCompare(removeThe(b));
    },
  },
  {
    name: 'category',
    label: 'Category',
    field: (row: Song) => row.categories.join('\n'),
    required: true,
    align: 'center',
    sortable: true,
  },
  {
    name: 'date',
    label: 'Date Added',
    field: (row: Song) => {
      const options: Intl.DateTimeFormatOptions = {
        weekday: undefined,
        day: 'numeric',
        month: 'short',
        year: '2-digit',
      };
      return row.date.toLocaleDateString('en-GB', options);
    },
    required: true,
    align: 'center',
    sortable: true,
    sort: (_a, _b, rowA, rowB) =>
      rowA.date.getTime() > rowB.date.getTime() ? 1 : 0,
  },
];

const props = defineProps<{
  filter_string: string | null;
  happiness_filter: { min: number; max: number };
  refrain_filter: { min: number; max: number };
  singers_filter: Array<string>;
  tags_filter: {
    categories: TagFilterModel;
    themes: TagFilterModel;
    purposes: TagFilterModel;
  } | null;
  acc_filter: boolean;
  unacc_filter: boolean;
}>();

const { songs, singers, categories, themes, purposes } = await getSongs();

const emits = defineEmits<{
  updateSingers: [singers: Map<string, number>];
  updateCategories: [categories: Map<string, number>];
  updateThemes: [categories: Map<string, number>];
  updatePurposes: [categories: Map<string, number>];
}>();
emits('updateSingers', singers);
emits('updateCategories', categories);
emits('updateThemes', themes);
emits('updatePurposes', purposes);

function filter(
  rows: readonly Song[] /*,
      _terms: string,
      _cols: unknown,
      _getCellValue: (col: unknown, row: Song) => unknown*/,
) {
  const filter_string = props.filter_string
    ? props.filter_string.toLowerCase()
    : '';
  const filter_strings = filter_string.split(/,? +/gi);
  const p = (row: Song): boolean => {
    // Happiness check
    if (
      row.happiness != 0 &&
      (row.happiness < props.happiness_filter.min ||
        row.happiness > props.happiness_filter.max)
    )
      return false;
    // Singers check
    if (
      props.singers_filter &&
      props.singers_filter.length > 0 &&
      !props.singers_filter.some((singer: string) =>
        row.singers.includes(singer),
      )
    )
      return false;
    // Categories / Themes / Purposes check
    for (const [key, value] of Object.entries(props.tags_filter ?? {})) {
      const index = key as 'categories' | 'themes' | 'purposes';
      const match = (cat: string) => row[index].includes(cat);
      if (
        value.selections.length > 0 &&
        !(value.all
          ? value.selections.every(match)
          : value.selections.some(match))
      )
        return false;
    }
    // Accompanied check
    if (
      !(
        (props.acc_filter && row.accompanied) ||
        (props.unacc_filter && row.unaccompanied)
      )
    )
      return false;
    // Refrain check
    if (
      row.refrain &&
      (props.refrain_filter.min > 1 || props.refrain_filter.max < 3)
    ) {
      switch (row.refrain.toLowerCase()) {
        case 'none':
          if (props.refrain_filter.min > 1) return false;
          break;
        case 'short':
          if (props.refrain_filter.min > 2 || props.refrain_filter.max < 2)
            return false;
          break;
        case 'long':
          if (props.refrain_filter.max < 3) return false;
          break;
      }
    }
    // Name check
    for (const keyword of filter_strings) {
      if (
        !row.name.toLowerCase().includes(keyword) &&
        !row.alt.some((altName) => altName.toLowerCase().includes(keyword)) &&
        !row.themes.some((themeName) =>
          themeName.toLowerCase().includes(keyword),
        )
      )
        return false;
    }
    return true;
  };

  return rows.filter(p);
}
</script>
