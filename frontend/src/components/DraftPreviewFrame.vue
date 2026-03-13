<template>
  <iframe v-if="src" :src="src" class="draft-frame" :title="title" />
  <iframe v-else :srcdoc="html" class="draft-frame" :title="title" />
</template>

<script setup>
defineProps({
  src: {
    type: String,
    default: "",
  },
  html: {
    type: String,
    default: "",
  },
  title: {
    type: String,
    required: true,
  },
});
</script>

<style scoped>
.draft-frame {
  width: 100%;
  min-height: calc(100vh - 72px);
  border: 0;
  border-radius: 18px;
  background: #fff;
}
</style>
