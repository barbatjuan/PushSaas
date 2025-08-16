# NotiFly - Sesión 2025-08-15: Correcciones SW/Plugin y Plan de Pruebas

## Objetivo
Asegurar entrega de notificaciones push en Android (tablet) y mantener compatibilidad en escritorio, resolviendo problemas de iconos, payload y Service Worker desactualizado. Además, mantener instalabilidad PWA.

## Cambios aplicados en este repo

- public/sw.js
  - Mapear `message -> body` en las notificaciones: si el backend manda `message`, se usa como `body` para Web Notifications (mejora compatibilidad Android).
  - Iconos por defecto apuntan a `/notifly/icon-192.png` para `icon` y `badge` (compatibles con WordPress).

- wordpress-plugin/notifly-push-notifications.php
  - Cache-busting del Service Worker central: `importScripts('.../sw.js?site=...&v=<version>')` para forzar actualización de SW en clientes (especialmente Android).
  - Script de diagnóstico/fallback del manifest: si `GET /notifly/manifest.json` falla (404), cambia automáticamente el `<link rel="manifest">` a `/?notifly_manifest=1`.

## Contexto de errores observados
- En el dominio `skyblue-toad-123619.hostingersite.com`, `GET /notifly/manifest.json` devolvía 404, lo que impedía la “instalación” PWA.
- En escritorio se veía Edge/Windows Push (endpoint WNS), confirmando que ese log no era Android. 
- El SW se registró primero vía `/sw.js?site=...` (404) y luego por fallback dinámico `/?pushsaas-worker&site=...` (ok), gracias al SDK.

## Qué debe hacerse en el sitio WordPress
1) Actualizar el plugin NotiFly en el sitio:
   - Opción ZIP: crear ZIP con carpeta del plugin y subir desde WP (Plugins > Añadir nuevo > Subir plugin > Reemplazar).
   - Opción FTP/SFTP: reemplazar `wp-content/plugins/notifly-push-notifications/notifly-push-notifications.php`.
2) Verificaciones HTTP (todas deben devolver 200):
   - `GET /sw.js` (debe contener `importScripts('https://www.adioswifi.es/sw.js?site=...&v=2.2.0')`).
   - `GET /?notifly_manifest=1` (manifest JSON de NotiFly).
   - `GET /notifly/icon-192.png` y `GET /notifly/icon-512.png`.
3) (Opcional) Enlaces permanentes bonitos en WP para que `/notifly/manifest.json` responda 200. Si sigue 404, el fallback a `/?notifly_manifest=1` quedará activo gracias al script.
4) Limpiar cachés (plugin/CDN) si aplica.

## Pasos de actualización en el navegador (tablet/PC)
- Cerrar todas las pestañas del dominio.
- Reabrir el sitio para que el SW con `&v=2.2.0` se instale/active.
- En Android: Chrome > Ajustes del sitio > Borrar datos del sitio (si persisten versiones viejas).

## Prueba rápida de notificaciones
- Desde el dashboard, enviar notificación con:
  - title: corto.
  - message: texto simple (sin HTML).
  - icon: vacío (para que use `/notifly/icon-192.png`).
  - url: opcional.
- En SW deben verse logs: `Push received` y `Showing notification`.

## Diagnóstico de PWA (instalación)
- DevTools > Application > Manifest: sin errores de “Installability”.
- Si `GET /notifly/manifest.json` sigue 404, el `<link rel="manifest">` pasará automáticamente a `/?notifly_manifest=1`.

## Posibles causas restantes si Android no muestra notificaciones
- SW sin actualizar en el dispositivo (solucionado con `&v=` y cierre/reapertura de pestañas).
- Iconos inaccesibles (comprobar 200 en `/notifly/icon-192.png`, `/notifly/icon-512.png`).
- Payload sin `body` (solucionado mapeando `message -> body`).
- Canal de notificaciones silenciado en Android (ajustes del sistema).
- Suscripción de otro `siteId` (verificar que envías al mismo `siteId` de la tablet).

## Comandos útiles
- Generar ZIP del plugin (Windows PowerShell):
```
Compress-Archive -Path "wordpress-plugin/*" -DestinationPath "notifly-push-notifications.zip" -Force
```
- Git (si procede):
```
git add .
git commit -m "SW: iconos /notifly/* y message->body; WP plugin: SW cache-busting y fallback de manifest"
git push origin develop
```

## Siguientes pasos sugeridos
- Actualizar plugin en el/los sitios WP.
- Validar manifest/icons/SW en el dominio.
- Probar en Android (tablet) y confirmar recepción de notificaciones y opción de “Instalar app”.

---
Notas: Las modificaciones no deberían romper lo que funcionaba en escritorio. Los problemas observados se debían a manifest 404 y SW desactualizado; ambos cubiertos por los cambios.
