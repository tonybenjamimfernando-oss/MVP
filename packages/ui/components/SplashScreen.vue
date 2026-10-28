<template>
  <transition name="fade">
    <div v-if="visible" class="splash" :style="{ backgroundColor: bgColor }" role="status" aria-label="A iniciar aplicação">
      <div class="splash__content">
        <div class="splash__logo" :style="{ backgroundColor: accentColor }"><span class="splash__initials">H</span></div>
        <p class="splash__title">HybridApp</p>
        <div class="splash__loader" aria-hidden="true"><span></span><span></span><span></span></div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { eventBus } from '@core/services/eventBus';
const visible = ref(true);
const bgColor = ref('#0d1117');
const accentColor = ref('#488aff');
const media = window.matchMedia('(prefers-color-scheme: dark)');
let timer: number | undefined;
function detectTheme() {
  bgColor.value = media.matches ? '#0d1117' : '#ffffff';
  accentColor.value = media.matches ? '#488aff' : '#24292f';
}
function hide() { visible.value = false; }
onMounted(() => {
  detectTheme();
  media.addEventListener('change', detectTheme);
  eventBus.on('app:ready', hide);
  timer = window.setTimeout(hide, 3000);
});
onUnmounted(() => {
  media.removeEventListener('change', detectTheme);
  eventBus.off('app:ready', hide);
  if (timer !== undefined) window.clearTimeout(timer);
});
</script>

<style scoped>
.splash{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;transition:background-color .3s ease}
.splash__content{display:flex;flex-direction:column;align-items:center;gap:16px}
.splash__logo{width:80px;height:80px;border-radius:20px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px #0004}
.splash__initials{font-size:40px;font-weight:700;color:white}.splash__title{font-size:20px;font-weight:600;color:#888}
.splash__loader{display:flex;gap:6px}.splash__loader span{width:8px;height:8px;border-radius:50%;background:#488aff;animation:pulse 1.2s infinite ease-in-out}
.splash__loader span:nth-child(2){animation-delay:.15s}.splash__loader span:nth-child(3){animation-delay:.3s}
@keyframes pulse{0%,80%,100%{transform:scale(.6);opacity:.5}40%{transform:scale(1);opacity:1}}
.fade-leave-active{transition:opacity .5s ease}.fade-leave-to{opacity:0}
</style>