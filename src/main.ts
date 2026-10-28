import { createApp } from 'vue';
import { router } from '@ui/router';
import App from './App.vue';
import '@ui/styles/theme.css';
import { eventBus } from '@core/services/eventBus';

const app = createApp(App);
app.use(router);
app.mount('#app');

router.isReady().then(() => {
  eventBus.emit('app:ready');
});