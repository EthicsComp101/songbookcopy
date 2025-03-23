<template>
  <div
    style="
      width: 100%;
      display: flex;
      justify-content: center;
      font-size: 0.7em;
    "
  >
    <q-toggle v-model="all">
      <template v-slot>
        <i>{{ all ? 'Match ALL selected tags' : 'Match ANY selected tag' }}</i>
      </template>
    </q-toggle>
  </div>
  <q-option-group
    v-model="selections"
    type="checkbox"
    :options="options"
    color="primary"
    inline
  >
    <template v-slot:label="opt">
      <span
        :style="
          opt.label.length <= 9 ? '' : 'font-size:.8em; display: inline-block'
        "
        >{{ opt.label }}</span
      >
    </template>
  </q-option-group>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue';

export type Option = { label: string; value: string };
const { options, defaultAll } = defineProps<{
  options: Option[];
  defaultAll?: boolean;
}>();
export type TagFilterModel = { selections: string[]; all?: boolean };
const model = defineModel<TagFilterModel>();
const selections = ref<string[]>(model.value?.selections ?? []);
const all = ref<boolean>(model.value?.all ?? defaultAll);
watch(all, (v) => {
  if (!model.value) {
    model.value = { selections: selections.value, all: v };
    return;
  }
  model.value.all = v;
});
watch(selections, (v) => {
  if (!model.value) {
    model.value = { selections: v, all: all.value };
    return;
  }
  model.value.selections = v;
});
watch(model, (v) => {
  if (v == null) {
    selections.value.splice(0);
    all.value = defaultAll;
    return;
  }
  selections.value = v.selections;
  all.value = v.all ?? false;
});
</script>
