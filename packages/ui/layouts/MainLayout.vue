<template>
  <div class="main-layout">
    <header class="main-layout__header">
      <div class="main-layout__brand"><div class="main-layout__logo">H</div><span>HybridApp</span></div>
      <div class="main-layout__actions">
        <NotificationBadge aria-label="Notificações" @click="$router.push('/notifications')" />
        <button class="btn-icon" @click="$router.push('/terminal')" title="Terminal" aria-label="Abrir terminal">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6zm0 4h8v2H6zm10 0h2v2h-2zm-6-4h8v2h-8z"/></svg>
        </button>
      </div>
    </header>
    <main class="main-layout__content">
      <section class="card">
        <h2>👤 Perfil</h2>
        <p v-if="profile">Bem-vindo, <strong>{{ profile.login }}</strong></p>
        <p v-else class="muted">Perfil ainda não carregado. Inicia a ligação ao GitHub para continuar.</p>
        <button class="btn btn-primary" :disabled="loading" @click="loadRepos">{{ loading ? 'A carregar…' : 'Carregar repositórios' }}</button>
        <p v-if="error" class="error">{{ error }}</p>
      </section>
      <section class="card">
        <h2>📦 Repositórios</h2>
        <ul v-if="repos.length" class="repo-list"><li v-for="r in repos" :key="r.id" @click="$router.push(`/repo/${r.owner.login}/${r.name}`)"><strong>{{ r.name }}</strong><span class="muted">{{ r.description || 'Sem descrição' }}</span></li></ul>
        <p v-else class="muted">Nenhum repositório carregado.</p>
      </section>
    </main>
    <SplashScreen />
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { githubService } from '@modules/github/service';
import { eventBus } from '@core/services/eventBus';
import SplashScreen from '../components/SplashScreen.vue';
import NotificationBadge from '../components/NotificationBadge.vue';
const profile = ref<any>(null), repos = ref<any[]>([]), loading = ref(false), error = ref('');
const onProfile = (u: any) => { profile.value = u; };
const onRepos = (r: any[]) => { repos.value = Array.isArray(r) ? r : []; };
onMounted(() => { eventBus.on('github:profile-loaded', onProfile); eventBus.on('github:repos-loaded', onRepos); });
onUnmounted(() => { eventBus.off('github:profile-loaded', onProfile); eventBus.off('github:repos-loaded', onRepos); });
async function loadRepos() {
  loading.value = true; error.value = '';
  try { await githubService.listRepos(); } catch (e: any) { error.value = e?.message || 'Não foi possível carregar os repositórios.'; }
  finally { loading.value = false; }
}
</script>
<style scoped>
.main-layout{min-height:100vh;background:var(--bg);color:var(--fg)}.main-layout__header{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid var(--border);position:sticky;top:0;background:var(--bg);z-index:100}
.main-layout__brand{display:flex;align-items:center;gap:10px;font-weight:600}.main-layout__logo{width:32px;height:32px;border-radius:8px;background:var(--accent);color:white;display:flex;align-items:center;justify-content:center;font-weight:700}
.main-layout__actions{display:flex;align-items:center;gap:12px}.btn-icon{background:none;border:0;color:var(--fg);cursor:pointer;padding:6px;border-radius:8px}.btn-icon:hover{background:var(--hover)}
.main-layout__content{padding:16px;display:flex;flex-direction:column;gap:16px;max-width:720px;margin:0 auto}.card{background:var(--card-bg);border:1px solid var(--border);border-radius:12px;padding:16px}.card h2{margin-bottom:12px;font-size:16px}
.repo-list{list-style:none;display:flex;flex-direction:column;gap:8px}.repo-list li{padding:10px 12px;border-radius:8px;border:1px solid var(--border);display:flex;flex-direction:column;gap:4px;cursor:pointer;transition:background .2s}.repo-list li:hover{background:var(--hover)}
.muted{color:var(--muted);font-size:13px}.btn{padding:8px 16px;border-radius:8px;border:1px solid var(--border);background:var(--card-bg);color:var(--fg);cursor:pointer}.btn-primary{background:#238636;color:white;border-color:#238636}.btn:disabled{opacity:.55;cursor:wait}.error{color:#f85149;margin-top:10px;font-size:13px}
</style>