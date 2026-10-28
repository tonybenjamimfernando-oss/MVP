import { Plugins } from '@capacitor/core';
import { eventBus } from '@core/services/eventBus';
import { registerEventHandlers } from '@glue/events/handlers';

const { PushNotifications, BiometricAuth, App } = Plugins;

export const NativeBridge = {
  async init() {
    registerEventHandlers();

    // Deep Links (App URL Open)
    App.addListener('appUrlOpen', (data) => {
      eventBus.emit('deeplink:received', data.url);
    });

    // Push
    await PushNotifications.requestPermissions();
    PushNotifications.addListener('pushNotificationReceived', (n) => {
      eventBus.emit('notification:received', n);
    });

    // Biometria
    const bio = await BiometricAuth.verify({ reason: 'Desbloquear App' });
    if (bio.verified) eventBus.emit('auth:success', true);

    // Dispara boot
    eventBus.emit('app:boot', {});
  },
};
