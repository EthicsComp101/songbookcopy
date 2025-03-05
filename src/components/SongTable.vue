<template>
  <q-table :rows="songs" :columns="COLUMNS" row-key="name" card-class="song-table" :rows-per-page-options="NO_ROWS"
    :filter="[filter_string, happiness_filter, refrain_filter, singers_filter, cat_filter, acc_filter, unacc_filter]"
    :filter-method="filter" hide-bottom :pagination="{ sortBy: 'date', descending: true }">
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
          <q-btn size="sm" color="accent" round dense @click="props.expand = !props.expand"
            :icon="props.expand ? 'expand_more' : 'chevron_right'" />
        </q-td>
        <q-td v-for="col in props.cols" :key="col.name" :props="props" class="table-cell" :class="{
          small: (typeof (col.value) == 'string') && col.value.includes('\n') && col.name != 'name'
        }">
          {{ col.value }}
          <div v-if="col.name == 'name'" class="composer">{{ props.row.composer }}</div>
        </q-td>
      </q-tr>
      <q-tr v-show="props.expand" :props="props" class="expand">
        <q-td colspan="100%">
          <div class="details">
            <div class="song-info">
              <div class="label">Other Names</div>
              <div class="info-items" v-if="props.row.alt.length > 0">
                <div class="info-item" v-for="(alt, index) in props.row.alt" :key="index"> {{ alt }} </div>
              </div>
            </div>
            <div class="song-info">
              <div class="label">Themes</div>
              <div class="info-items">
                {{ props.row.themes.join(", ") }}
              </div>
            </div>
            <div class="song-lights">
              <div class="label">Tone</div>
              <div class="lights-icons">
                <q-icon name="sentiment_very_dissatisfied" size="sm" v-if="props.row.happiness == 1" />
                <q-icon name="sentiment_dissatisfied" size="sm" v-if="props.row.happiness == 2" />
                <q-icon name="sentiment_neutral" size="sm" v-if="props.row.happiness == 3" />
                <q-icon name="sentiment_satisfied" size="sm" v-if="props.row.happiness == 4" />
                <q-icon name="sentiment_very_satisfied" size="sm" v-if="props.row.happiness == 5" />
              </div>
            </div>
            <div class="song-lights">
              <div class="label">Refrain</div>
              <div class="lights-icons">
                <q-icon name="person" size="sm" v-if="props.row.refrain == 'None'" />
                <q-icon name="group" size="sm" v-if="props.row.refrain == 'Short'" />
                <q-icon name="groups" size="sm" v-if="props.row.refrain == 'Long'" />
              </div>
            </div>
            <div class="song-lights">
              <div class="label">Styles</div>
              <div class="lights-icons">
                <q-icon name="piano" size="sm" v-if="props.row.accompanied" />
                <q-icon name="piano_off" size="sm" v-if="props.row.unaccompanied" />
              </div>
            </div>
            <div class="song-buttons">
              <q-btn size="sm" color="accent" round dense :to="'/info/' + encodeURIComponent(props.row.name)"
                v-if="props.row.info || props.row.reference" icon='info' />
              <q-btn size="sm" color="accent" round dense :to="'/lyrics/' + encodeURIComponent(props.row.name)"
                icon='lyrics' v-if="props.row.lyrics" />
            </div>
          </div>
        </q-td>
      </q-tr>
    </template>
  </q-table>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import type { QTableProps } from 'quasar';
import type { Song } from './models';
import { getSongs } from 'src/util/table-utils';

const NO_ROWS = [0];

function removeThe(s: string): string {
  if (s.startsWith('The')) return s.substring(4);
  return s;
}

const COLUMNS: QTableProps['columns'] = [{
  name: 'name', label: 'Name', field: 'name', required: true, align: 'left', sortable: true,
  sort: (a, b/*, _rowA, _rowB*/) => {
    return removeThe(a).localeCompare(removeThe(b));
  }
}, {
  name:
    'category', label: 'Category', field: (row: Song) => row.categories.join('\n'), required: true, align:
    'center', sortable: true,
}, {
  name: 'date', label: 'Date Added', field: (row: Song) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: undefined,
      day: 'numeric',
      month: 'short',
      year: '2-digit'
    };
    return row.date.toLocaleDateString("en-GB", options);
  },
  required: true, align: 'center', sortable: true, sort: (_a, _b, rowA, rowB) => rowA.date.getTime() > rowB.date.getTime() ? 1 : 0
},];

export default defineComponent({
  name: 'SongTable',
  props: ['filter_string', 'happiness_filter', 'refrain_filter', 'singers_filter', 'cat_filter', 'acc_filter', 'unacc_filter'],
  async setup(_props, { emit }) {
    const songs: Song[] = await getSongs();
    const singers: Map<string, number> = new Map();
    const categories: Map<string, number> = new Map();
    for (const song of songs) {
      for (const singer of song.singers) {
        const count = singers.get(singer);
        singers.set(singer, 1 + (count ?? 0));
      }
      for (const cat of song.categories) {
        const count = categories.get(cat);
        categories.set(cat, 1 + (count ?? 0));
      }
    }
    emit('updateSingers', singers);
    emit('updateCategories', categories);
    return {
      songs: songs,
      COLUMNS: COLUMNS,
      NO_ROWS: NO_ROWS,
    };
  },
  methods: {
    filter(
      rows: readonly Song[]/*,
      _terms: string,
      _cols: unknown,
      _getCellValue: (col: unknown, row: Song) => unknown*/
    ) {
      const filter_string = this.filter_string ? this.filter_string.toLowerCase() : '';
      const filter_strings = filter_string.split(/,? +/gi);
      const p = (row: Song): boolean => {
        // Happiness check
        if (row.happiness != 0 && (row.happiness < this.happiness_filter.min || row.happiness > this.happiness_filter.max)) return false;
        // Singers check
        if (this.singers_filter && this.singers_filter.length > 0 &&
          !this.singers_filter.some((singer: string) => row.singers.includes(singer))) return false;
        // Categories check
        if (this.cat_filter && this.cat_filter.length > 0 &&
          !this.cat_filter.some((cat: string) => row.categories.includes(cat))) return false;
        // Accompanied check
        if (!((this.acc_filter && row.accompanied) || (this.unacc_filter && row.unaccompanied))) return false;
        // Refrain check
        if (row.refrain && (this.refrain_filter.min > 1 || this.refrain_filter.max < 3)) {
          switch (row.refrain.toLowerCase()) {
            case 'none':
              if (this.refrain_filter.min > 1) return false;
              break;
            case 'short':
              if (this.refrain_filter.min > 2 || this.refrain_filter.max < 2) return false;
              break;
            case 'long':
              if (this.refrain_filter.max < 3) return false;
              break;
          }
        }
        // Name check
        for (const keyword of filter_strings) {
          if (!row.name.toLowerCase().includes(keyword) && !
            row.alt.some((altName) =>
              altName.toLowerCase().includes(keyword)
            ) && !
            row.themes.some((themeName) =>
              themeName.toLowerCase().includes(keyword)
            )
          ) return false;
        }
        return true;
      };

      return rows.filter(p);
    },
  },
});
</script>
