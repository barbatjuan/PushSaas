# 🔒 Configuración HTTPS para Notificaciones Push

Las notificaciones push requieren **HTTPS obligatoriamente**. Aquí tienes varias opciones para probar en desarrollo:

## 🚀 Opción 1: Usar ngrok (Recomendado)

### Instalar ngrok:
```bash
# Opción A: Descargar desde https://ngrok.com/download
# Opción B: Con npm
npm install -g ngrok
```

### Ejecutar con HTTPS:
```bash
# Terminal 1: Ejecutar Next.js
npm run dev

# Terminal 2: Crear túnel HTTPS
ngrok http 3000
```

**Resultado:** Obtienes una URL como `https://abc123.ngrok.io` que funciona con notificaciones push.

## 🔧 Opción 2: Usar mkcert (Certificados locales confiables)

### Instalar mkcert:
```bash
# Windows (con Chocolatey)
choco install mkcert

# Windows (con Scoop)
scoop install mkcert

# macOS
brew install mkcert

# Linux
sudo apt install libnss3-tools
wget -O mkcert https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64
chmod +x mkcert
sudo mv mkcert /usr/local/bin/
```

### Configurar certificados:
```bash
# Instalar CA local
mkcert -install

# Crear certificados para localhost
mkcert localhost 127.0.0.1 ::1

# Esto crea:
# - localhost+2.pem (certificado)
# - localhost+2-key.pem (clave privada)
```

### Configurar Next.js con HTTPS:
```bash
# Instalar dependencias
npm install --save-dev local-ssl-proxy concurrently

# Ejecutar con HTTPS
npm run dev:https
```

## 🌐 Opción 3: Desplegar en Vercel/Netlify

### Desplegar rápidamente:
```bash
# Con Vercel
npm install -g vercel
vercel --prod

# Con Netlify
npm install -g netlify-cli
netlify deploy --prod
```

## 📱 Probar en Android

### Una vez que tengas HTTPS:

1. **Abre la URL HTTPS** en Chrome Android
2. **Instala como PWA:**
   - Menú → "Instalar app" o "Añadir a pantalla de inicio"
3. **Abre la app instalada** (no desde el navegador)
4. **Ve a Diagnóstico PWA** para verificar que todo esté correcto
5. **Prueba las notificaciones** desde el panel

### ✅ Verificaciones importantes:
- [ ] URL comienza con `https://`
- [ ] App instalada como PWA (modo standalone)
- [ ] Permisos de notificación concedidos
- [ ] Service Worker activo
- [ ] PushSaaS SDK cargado y suscrito

## 🔍 Debugging

### Si las notificaciones no llegan:
1. **Verifica en DevTools:**
   - F12 → Application → Service Workers
   - F12 → Application → Notifications
2. **Revisa la consola** para errores
3. **Usa la página de diagnóstico** en `/dashboard/diagnostics`

### Comandos útiles para debugging:
```javascript
// En la consola del navegador
console.log('🔔 Permisos:', Notification.permission);
console.log('🔧 Service Worker:', navigator.serviceWorker.controller);
console.log('📱 PWA Mode:', window.matchMedia('(display-mode: standalone)').matches);

// Si tienes PushSaaS cargado
window.pushSaaS?.debug?.status();
```

## 🎯 Solución Rápida para Probar AHORA

**La forma más rápida de probar:**

```bash
# 1. Instala ngrok
npm install -g ngrok

# 2. En una terminal, ejecuta tu app
npm run dev

# 3. En otra terminal, crea el túnel HTTPS
ngrok http 3000

# 4. Usa la URL https://xxx.ngrok.io en tu móvil Android
# 5. Instala como PWA y prueba las notificaciones
```

¡Con esto deberías poder probar las notificaciones push inmediatamente! 🚀
