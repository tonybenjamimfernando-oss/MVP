import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { eventBus } from '@core/services/eventBus';

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('../layouts/MainLayout.vue'), meta: { requiresAuth: true } },
  { path: '/login', name: 'login', component: () => import('../layouts/LoginLayout.vue'), meta: { requiresAuth: false } },
  { path: '/repo/:owner/:name', name: 'repo', component: () => import('../layouts/RepoLayout.vue'), meta: { requiresAuth: true } },
  { path: '/notifications', name: 'notifications', component: () => import('../layouts/NotificationsLayout.vue'), meta: { requiresAuth: true } },
  { path: '/terminal', name: 'terminal', component: () => import('../layouts/TerminalLayout.vue'), meta: { requiresAuth: true } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

export const router = createRouter({ history: createWebHistory(), routes, scrollBehavior: () => ({ top: 0 }) });

router.beforeEach(async (to) => {
  const isAuthenticated = sessionStorage.getItem('auth') === '1';
  if (to.meta.requiresAuth && !isAuthenticated) return { name: 'login', query: { redirect: to.fullPath } };
  if (to.name === 'login' && isAuthenticated) return { name: 'home' };
  return true;
});

eventBus.on('navigate', (payload: unknown) => {
  const path = typeof payload === 'string' ? payload : (payload as { path?: string } | null)?.path;
  if (typeof path === 'string' && path.startsWith('/') && router.currentRoute.value.fullPath !== path) void router.push(path);
});
eventBus.on('auth:biometric-required', () => { void router.push({ name: 'login', query: { reason: 'biometric' } }); });
