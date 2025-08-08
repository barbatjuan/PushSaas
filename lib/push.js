import webpush from 'web-push';

// Configurar Web Push con las claves VAPID
export function configurePushService() {
  webpush.setVapidDetails(
    `mailto:contact@${process.env.NEXT_PUBLIC_APP_URL.replace(/^https?:\/\//, '')}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// Enviar notificación push a un endpoint específico
export async function sendPushNotification(subscription, payload) {
  try {
    configurePushService();
    const result = await webpush.sendNotification(
      subscription,
      typeof payload === 'string' ? payload : JSON.stringify(payload)
    );
    return { success: true, result };
  } catch (error) {
    console.error('Error enviando notificación push:', error);
    return { 
      success: false, 
      error: error.message,
      statusCode: error.statusCode
    };
  }
}

// Generar nuevas claves VAPID (útil para nuevos sitios)
export function generateVAPIDKeys() {
  return webpush.generateVAPIDKeys();
}
