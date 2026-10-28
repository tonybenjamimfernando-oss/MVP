<template>
  <button class="badge-wrapper" :class="{ 'is-visible': count > 0 }" :aria-label="`${count} notificações`" type="button">
    <svg viewBox="0 0 24 24" class="badge-icon" aria-hidden="true"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
    <span v-if="count > 0" class="badge-count">{{ count > 99 ? '99+' : count }}</span>
  </button>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { eventBus } from '@core/services/eventBus';
const count = ref(0);
const increment = (p: unknown) => {
  const amount = Number((p as { count?: unknown } | null)?.count ?? 1);
  if (Number.isFinite(amount) && amount > 0) count.value = Math.min(9999, count.value + Math.floor(amount));
};
const reset = () => { count.value = 0; };
onMounted(() => { eventBus.on('ui:notification-badge-update', increment); eventBus.on('ui:notification-badge-reset', reset); });
onUnmounted(() => { eventBus.off('ui:notification-badge-update', increment); eventBus.off('ui:notification-badge-reset', reset); });
</script>
<style scoped>
.badge-wrapper{position:relative;width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;border:0;background:transparent;color:inherit;border-radius:8px}
.badge-wrapper:hover{background:var(--hover)}.badge-icon{width:22px;height:22px;fill:currentColor}
.badge-count{position:absolute;top:-2px;right:-5px;background:#f85149;color:white;font-size:10px;padding:2px 5px;border-radius:10px;font-weight:700;min-width:18px;text-align:center}
</style>