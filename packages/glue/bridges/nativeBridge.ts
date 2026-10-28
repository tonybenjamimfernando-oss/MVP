import { App } from '@capacitor/app';
import { PushNotifications } from '@capacitor/push-notifications';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { eventBus } from '@core/services/eventBus';
import { registerEventHandlers } from '@glue/events/handlers';

let initialized = false;

export const NativeBridge = {
  async init() {
    if (initialized) return;
    initialized = true;
    registerEventHandlers();

    await App.addListener('appUrlOpen', (data) => {
      eventBus.emit('deeplink:received', data.url);
    });

    const permission = await PushNotifications.requestPermissions();
    if (permission.receive === 'granted') {
      await PushNotifications.register();
    }
    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      eventBus.emit('notification:received', notification);
    });

    // A biometria é solicitada apenas quando a aplicação pede um desbloqueio,
    // nunca automaticamente durante o arranque.
    eventBus.emit('app:boot', {});
  },
  async verifyBiometric(): Promise<boolean> {
    await BiometricAuth.authenticate({ reason: 'Desbloquear HybridApp', allowDeviceCredential: true });
    eventBus.emit('auth:success', true);
    return true;
  },
};
