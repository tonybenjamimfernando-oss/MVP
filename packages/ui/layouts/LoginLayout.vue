<template>
  <div class="login-layout"><div class="login-layout__card">
    <div class="login-layout__logo">H</div><h1>Bem-vindo</h1><p class="muted">Inicia sessão com o GitHub para começar.</p>
    <button class="btn btn-primary" @click="login" :disabled="loading">{{ loading ? 'A redirecionar…' : 'Entrar com GitHub' }}</button>
    <button v-if="biometricReason" class="btn" @click="verifyBiometric">🔒 Desbloquear com biometria</button>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </div></div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { githubService } from '@modules/github/service';
import { BiometricAuth } from '@capacitor-community/biometric-auth';
const route = useRoute(), router = useRouter();
const loading = ref(false), error = ref('');
const biometricReason = computed(() => route.query.reason === 'biometric');
async function login() {
  loading.value = true; error.value = '';
  try {
    const state = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    sessionStorage.setItem('oauth_state', state);
    window.location.href = githubService.getAuthUrl(state);
  } catch (e: any) { error.value = e?.message || 'Não foi possível iniciar a autenticação.'; }
  finally { loading.value = false; }
}
async function verifyBiometric() {
  try {
    const res = await BiometricAuth.verify({ reason: 'Desbloquear HybridApp' });
    if (res.verified) { sessionStorage.setItem('auth', '1'); await router.push(typeof route.query.redirect === 'string' ? route.query.redirect : '/'); }
  } catch { error.value = 'Falha na biometria. Tenta novamente.'; }
}
</script>
<style scoped>
.login-layout{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:var(--bg)}.login-layout__card{max-width:360px;width:100%;background:var(--card-bg);border:1px solid var(--border);border-radius:16px;padding:32px;display:flex;flex-direction:column;gap:16px;text-align:center}
.login-layout__logo{width:64px;height:64px;border-radius:16px;margin:0 auto;background:var(--accent);color:white;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:700}
.error{color:#f85149;font-size:13px}.muted{color:var(--muted);font-size:14px}.btn{padding:10px 16px;border-radius:8px;border:1px solid var(--border);background:var(--card-bg);color:var(--fg);cursor:pointer;font-weight:500}.btn-primary{background:#238636;color:white;border-color:#238636}.btn:disabled{opacity:.5;cursor:not-allowed}
</style>