# NotiFly WordPress Plugin v2.0.0

🔔 **Plugin WordPress revolucionario que simplifica la integración de notificaciones push a solo 2 pasos.**

## 🚀 Características Principales

### ✅ **Configuración Ultra-Simple**
- Solo requiere tu **Site ID** de NotiFly
- No necesitas descargar ni subir archivos manualmente
- Funciona en cualquier hosting (WordPress.com, hosting compartido, VPS, etc.)

### ✅ **Automatización Completa**
- **Script SDK**: Se carga automáticamente desde CDN
- **Service Worker**: Se registra automáticamente desde `https://notifly.com/sw.js`
- **Web App Manifest**: Se enlaza automáticamente desde `https://notifly.com/manifest.json`

### ✅ **Verificación Visual**
- **Checker en tiempo real** que valida la integración
- Estados visuales claros (✅/❌) para cada componente
- Diagnóstico automático de problemas

### ✅ **Compatibilidad Total**
- ✅ WordPress.com (sin acceso FTP)
- ✅ Hosting compartido
- ✅ VPS y servidores dedicados
- ✅ Multisite
- ✅ Cualquier tema de WordPress

---

## 📦 Instalación

### Método 1: Subida Manual
1. Descarga el archivo `notifly-push-notifications.php`
2. Sube a `/wp-content/plugins/notifly/`
3. Activa el plugin desde **Plugins → Plugins Instalados**

### Método 2: ZIP (Recomendado)
1. Comprime el archivo en `notifly-push-notifications.zip`
2. Ve a **Plugins → Añadir nuevo → Subir plugin**
3. Sube el ZIP y activa

---

## ⚙️ Configuración (2 pasos)

### Paso 1: Obtén tu Site ID
1. Ve a [notifly.com](https://notifly.com) y regístrate gratis
2. Agrega tu sitio web desde el dashboard
3. Copia el **Site ID** generado (ej: `abc123def456`)

### Paso 2: Configura el Plugin
1. Ve a **Configuración → NotiFly** en tu WordPress
2. Pega tu **Site ID** en el campo
3. Haz clic en **Guardar Configuración**

**¡Listo!** 🎉 El plugin se encarga del resto automáticamente.

---

## 🔍 Verificación de Integración

Una vez configurado, el plugin muestra un **checker visual** que verifica:

- ✅ **SDK Script**: Carga correcta desde CDN
- ✅ **Service Worker**: Disponible y registrado
- ✅ **Web App Manifest**: Enlazado correctamente
- ✅ **HTTPS**: Verificación de SSL (requerido)

### Estados Posibles:
- 🟢 **Todo OK**: Integración completa y funcional
- 🟡 **Advertencias**: Algunos componentes con problemas menores
- 🔴 **Errores**: Problemas que requieren atención

---

## 📊 Panel de Control

El plugin incluye un panel completo con:

### 📈 **Información del Sitio**
- Site ID configurado
- URL del sitio
- Estado HTTPS
- Enlaces directos al dashboard

### 🔗 **Acciones Rápidas**
- **Ver Dashboard**: Acceso directo a NotiFly
- **Enviar Notificación**: Crear nueva notificación
- **Ver Estadísticas**: Métricas de suscriptores

---

## 🛠️ Cómo Funciona (Técnico)

### Automatización CDN
El plugin sirve todos los archivos desde el CDN de NotiFly:

```html
<!-- SDK Principal -->
<script src="https://notifly.com/sdk.js?site=TU_SITE_ID" async></script>

<!-- Web App Manifest -->
<link rel="manifest" href="https://notifly.com/manifest.json?site=TU_SITE_ID">

<!-- Service Worker -->
<script>
navigator.serviceWorker.register('https://notifly.com/sw.js?site=TU_SITE_ID');
</script>
```

### Ventajas del Enfoque CDN:
1. **Sin archivos locales**: No necesitas subir `sw.js` ni `manifest.json`
2. **Actualizaciones automáticas**: Siempre tienes la última versión
3. **Compatibilidad universal**: Funciona en cualquier hosting
4. **Menor mantenimiento**: NotiFly gestiona la infraestructura

---

## 🔧 Troubleshooting

### ❌ "Service Worker NO encontrado"
**Causa**: El Site ID es incorrecto o el sitio no existe en NotiFly.
**Solución**: Verifica el Site ID en tu dashboard de NotiFly.

### ⚠️ "HTTPS Requerido"
**Causa**: Las notificaciones push requieren HTTPS.
**Solución**: Activa SSL en tu hosting o usa Cloudflare.

### 🔴 "Error al verificar"
**Causa**: Problemas de conectividad o firewall.
**Solución**: Verifica que tu servidor puede acceder a `notifly.com`.

---

## 🆚 Comparación: Antes vs Después

### ❌ **Proceso Anterior (5 pasos)**
1. Registrarse en NotiFly
2. Crear sitio y obtener Site ID
3. Descargar `sw.js` y `manifest.json`
4. Subir archivos a la raíz del dominio vía FTP
5. Pegar script en `<head>`

### ✅ **Proceso Nuevo (2 pasos)**
1. Registrarse en NotiFly y obtener Site ID
2. Pegar Site ID en el plugin

**Reducción del 60% en pasos** y **eliminación total de tareas técnicas**.

---

## 🎯 Casos de Uso Ideales

### ✅ **Perfecto Para:**
- **WordPress.com**: Sin acceso FTP
- **Hosting compartido**: Limitaciones de archivos
- **Usuarios no técnicos**: Sin conocimientos de FTP
- **Agencias**: Instalación rápida para clientes
- **Multisite**: Configuración por sitio

### ⚠️ **Consideraciones:**
- Requiere **HTTPS** (estándar web moderno)
- Necesita **conectividad** a CDN de NotiFly
- **Site ID válido** de una cuenta activa

---

## 🔄 Actualizaciones

### Versión 2.0.0 (Actual)
- ✅ Automatización completa vía CDN
- ✅ Checker visual de integración
- ✅ Panel de control mejorado
- ✅ Compatibilidad universal

### Versión 1.x (Anterior)
- ❌ Requería subida manual de archivos
- ❌ Sin verificación automática
- ❌ Problemas en WordPress.com

---

## 🤝 Soporte

### 📧 **Contacto**
- **Email**: soporte@notifly.com
- **Website**: [notifly.com](https://notifly.com)
- **Dashboard**: [notifly.com/dashboard](https://notifly.com/dashboard)

### 📚 **Recursos**
- **Documentación**: [docs.notifly.com](https://docs.notifly.com)
- **API Reference**: [api.notifly.com](https://api.notifly.com)
- **Status Page**: [status.notifly.com](https://status.notifly.com)

---

## 📄 Licencia

GPL v2 or later - Compatible con WordPress.org

---

## 🎉 ¡Gracias por usar NotiFly!

Este plugin representa un **salto evolutivo** en la facilidad de integración de notificaciones push para WordPress. 

**De 5 pasos técnicos a 2 pasos simples.** 🚀
