<template>
  <div class="terminal-layout">
    <header class="terminal-layout__header"><button class="btn-icon" @click="$router.back()" aria-label="Voltar">←</button><span class="terminal-layout__title">terminal@hybridapp</span></header>
    <pre ref="outputEl" class="terminal-layout__output">{{ output || 'Aguardando tarefas…' }}</pre>
    <form class="terminal-layout__input" @submit.prevent="run"><span class="prompt">$</span><input v-model="command" placeholder="echo:Olá ou sleep:2000" autocomplete="off" /><button type="submit" :disabled="!command.trim() || running">▶</button></form>
    <p v-if="error" class="terminal-error">{{ error }}</p>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { backgroundTaskService } from '@modules/termux/service';
import { eventBus } from '@core/services/eventBus';
const command = ref(''), output = ref(''), error = ref(''), running = ref(false), outputEl = ref<HTMLElement | null>(null);
function append(line: string) { output.value = (output.value + (output.value ? '\n' : '') + line).slice(-30000); }
const onEnqueued = (t: any) => append(`[enqueued] ${t?.command ?? ''}`);
const onStarted = (t: any) => append(`[running]  ${t?.command ?? ''}`);
const onCompleted = (t: any) => append(`[done]     ${t?.output ?? ''}`);
const onFailed = (t: any) => append(`[failed]   ${t?.error ?? 'erro desconhecido'}`);
onMounted(() => {
  eventBus.on('termux:task-enqueued', onEnqueued); eventBus.on('termux:task-started', onStarted);
  eventBus.on('termux:task-completed', onCompleted); eventBus.on('termux:task-failed', onFailed);
});
onUnmounted(() => {
  eventBus.off('termux:task-enqueued', onEnqueued); eventBus.off('termux:task-started', onStarted);
  eventBus.off('termux:task-completed', onCompleted); eventBus.off('termux:task-failed', onFailed);
});
watch(output, async () => { await nextTick(); if (outputEl.value) outputEl.value.scrollTop = outputEl.value.scrollHeight; });
async function run() {
  const value = command.value.trim(); if (!value || running.value) return;
  error.value = ''; running.value = true;
  try { await backgroundTaskService.enqueue(value); command.value = ''; }
  catch (e: any) { error.value = e?.message || 'Não foi possível executar a tarefa.'; append(`[error]    ${error.value}`); }
  finally { running.value = false; }
}
</script>
<style scoped>
.terminal-layout{min-height:100vh;display:flex;flex-direction:column;background:#0d1117;color:#c9d1d9;font-family:'JetBrains Mono','Courier New',monospace}
.terminal-layout__header{display:flex;align-items:center;gap:12px;padding:12px 16px;background:#161b22;border-bottom:1px solid #30363d}.terminal-layout__title{font-size:13px;color:#8b949e}
.btn-icon{background:none;border:0;color:#c9d1d9;cursor:pointer;font-size:18px}.terminal-layout__output{flex:1;min-height:50vh;padding:16px;overflow-y:auto;font-size:13px;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere}
.terminal-layout__input{display:flex;align-items:center;gap:8px;padding:12px 16px;background:#161b22;border-top:1px solid #30363d}.prompt{color:#7ee787;font-weight:700}
.terminal-layout__input input{flex:1;min-width:0;background:transparent;border:0;outline:none;color:#c9d1d9;font-family:inherit;font-size:14px}.terminal-layout__input button{background:#238636;color:white;border:0;border-radius:6px;padding:6px 12px;cursor:pointer;font-weight:700}.terminal-layout__input button:disabled{opacity:.4;cursor:not-allowed}.terminal-error{color:#ff7b72;padding:0 16px 12px;font-size:12px}
</style>