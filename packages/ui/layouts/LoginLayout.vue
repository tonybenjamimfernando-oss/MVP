<template>
  <div class="login-layout"><div class="login-layout__card">
    <div class="login-layout__logo">H</div><h1>Bem-vindo</h1><p class="muted">Inicia sessão com o GitHub para começar.</p>
    <button class="btn btn-primary" @click="login" :disabled="loading || polling">{{ loading ? 'A preparar autorização…' : 'Entrar com GitHub' }}</button>
    <div v-if="deviceFlow" class="device-flow" aria-live="polite">
      <p>1. Abre o GitHub e introduz este código:</p>
      <strong class="user-code">{{ deviceFlow.userCode }}</strong>
      <a class="btn verification-link" :href="deviceFlow.verificationUri" target="_blank" rel="noopener noreferrer">Abrir página de autorização do GitHub</a>
      <p class="muted">2. Depois de autorizares, volta aqui e confirma.</p>
      <button class="btn btn-primary" @click="completeLogin" :disabled="polling">{{ polling ? 'A aguardar confirmação…' : 'Já autorizei — continuar' }}</button>
      <button class="btn" @click="cancelDeviceFlow" :disabled="polling">Cancelar</button>
    </div>
    <button v-if="biometricReason" class="btn" @click="verifyBiometric">🔒 Desbloquear com biometria</button>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </div></div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { githubService, type GitHubDeviceFlow } from '@modules/github/service';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
const route = useRoute(), router = useRouter();
const loading = ref(false), polling = ref(false), error = ref('');
const deviceFlow = ref<GitHubDeviceFlow | null>(null);
const biometricReason = computed(() => route.query.reason === 'biometric');

async function login() {
  loading.value = true;
  error.value = '';
  deviceFlow.value = null;
  try {
    deviceFlow.value = await githubService.startDeviceFlow();
  } catch (e: any) {
    error.value = e?.message || 'Não foi possível iniciar a autenticação GitHub.';
  } finally {
    loading.value = false;
  }
}

async function completeLogin() {
  if (!deviceFlow.value || polling.value) return;
  polling.value = true;
  error.value = '';
  try {
    await githubService.pollDeviceFlow(
      deviceFlow.value.deviceCode,
      deviceFlow.value.interval,
      deviceFlow.value.expiresIn,
    );
    await githubService.loadProfile();
    sessionStorage.setItem('auth', '1');
    const destination = typeof route.query.redirect === 'string' ? route.query.redirect : '/';
    await router.replace(destination);
  } catch (e: any) {
    error.value = e?.message || 'Não foi possível concluir a autenticação. Tenta novamente.';
  } finally {
    polling.value = false;
  }
}

function cancelDeviceFlow() {
  deviceFlow.value = null;
  error.value = '';
}

async function verifyBiometric() {
  try {
    await BiometricAuth.authenticate({ reason: 'Desbloquear HybridApp', allowDeviceCredential: true });
    sessionStorage.setItem('auth', '1');
    await router.push(typeof route.query.redirect === 'string' ? route.query.redirect : '/');
  } catch {
    error.value = 'Falha na biometria. Tenta novamente.';
  }
}
</script>
<style scoped>
.login-layout{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:var(--bg)}.login-layout__card{max-width:360px;width:100%;background:var(--card-bg);border:1px solid var(--border);border-radius:16px;padding:32px;display:flex;flex-direction:column;gap:16px;text-align:center}
.login-layout__logo{width:64px;height:64px;border-radius:16px;margin:0 auto;background:var(--accent);color:white;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:700}
.error{color:#f85149;font-size:13px}.muted{color:var(--muted);font-size:14px}.btn{padding:10px 16px;border-radius:8px;border:1px solid var(--border);background:var(--card-bg);color:var(--fg);cursor:pointer;font-weight:500;text-decoration:none;display:block}.btn-primary{background:#238636;color:white;border-color:#238636}.btn:disabled{opacity:.5;cursor:not-allowed}.device-flow{display:flex;flex-direction:column;gap:12px}.user-code{font-size:28px;letter-spacing:3px;padding:12px;background:var(--bg);border:1px dashed var(--border);border-radius:8px}.verification-link{overflow-wrap:anywhere}
</style>