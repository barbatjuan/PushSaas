import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'
import { stat } from 'fs/promises'
import JSZip from 'jszip'

export async function GET(request: NextRequest) {
  try {
    // Rutas a los archivos del plugin
    const pluginDir = join(process.cwd(), 'wordpress-plugin')
    const pluginPath = join(pluginDir, 'notifly-push-notifications.php')
    const readmePath = join(pluginDir, 'README.md')
    
    // Verificar que los archivos existen
    try {
      await stat(pluginPath)
    } catch (error) {
      return NextResponse.json(
        { error: 'Plugin file not found' },
        { status: 404 }
      )
    }

    // Leer el contenido de los archivos
    const fs = require('fs')
    const pluginContent = fs.readFileSync(pluginPath, 'utf8')
    
    let readmeContent = ''
    try {
      readmeContent = fs.readFileSync(readmePath, 'utf8')
    } catch (error) {
      // README es opcional
      console.log('README.md not found, skipping...')
    }

    // Crear ZIP
    const zip = new JSZip()
    
    // Crear carpeta del plugin
    const pluginFolder = zip.folder('notifly-push-notifications')
    
    // Agregar archivos al ZIP
    pluginFolder?.file('notifly-push-notifications.php', pluginContent)
    
    if (readmeContent) {
      pluginFolder?.file('README.md', readmeContent)
    }
    
    // Agregar archivo readme.txt para WordPress.org
    const wordpressReadme = `=== NotiFly Push Notifications ===
Contributors: notifly
Tags: push notifications, web push, notifications, marketing, engagement
Requires at least: 5.0
Tested up to: 6.4
Requires PHP: 7.4
Stable tag: 2.0.0
License: GPL v2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Integra NotiFly en WordPress con mínimo esfuerzo. Solo introduce tu Site ID.

== Description ==

NotiFly es la solución más simple para agregar notificaciones push a tu sitio WordPress. Con nuestro plugin revolucionario, la integración toma solo 2 minutos.

**Características principales:**

* ✅ Configuración ultra-simple con solo tu Site ID
* ✅ CDN automático - sin archivos manuales
* ✅ Verificación visual de la integración
* ✅ Compatible con cualquier hosting (incluso WordPress.com)
* ✅ Sin necesidad de FTP o conocimientos técnicos

**¿Cómo funciona?**

1. Regístrate gratis en [notifly.com](https://notifly.com)
2. Agrega tu sitio y obtén tu Site ID
3. Instala este plugin y pega tu Site ID
4. ¡Listo! El plugin se encarga del resto automáticamente

**Automatización completa:**
- Script SDK se carga desde CDN
- Service Worker se registra automáticamente
- Web App Manifest se enlaza automáticamente
- Verificación en tiempo real del estado

== Installation ==

1. Descarga el plugin desde tu dashboard de NotiFly
2. Ve a Plugins → Añadir nuevo → Subir plugin
3. Sube el archivo ZIP y activa el plugin
4. Ve a Configuración → NotiFly
5. Pega tu Site ID y guarda
6. ¡El plugin verificará automáticamente la integración!

== Frequently Asked Questions ==

= ¿Necesito conocimientos técnicos? =
No. El plugin está diseñado para ser usado por cualquier persona. Solo necesitas tu Site ID.

= ¿Funciona en WordPress.com? =
Sí. A diferencia de otros plugins, este funciona incluso en WordPress.com porque no requiere subir archivos manualmente.

= ¿Es gratis? =
NotiFly tiene un plan gratuito generoso. El plugin es completamente gratuito.

= ¿Qué es un Site ID? =
Es un identificador único que obtienes al registrar tu sitio en NotiFly. Se ve así: abc123def456

== Screenshots ==

1. Panel de configuración simple - solo necesitas tu Site ID
2. Verificación visual automática de la integración
3. Dashboard de NotiFly mostrando estadísticas

== Changelog ==

= 2.0.0 =
* Automatización completa vía CDN
* Verificación visual de integración
* Compatible con WordPress.com
* Sin archivos manuales requeridos

= 1.0.0 =
* Versión inicial

== Upgrade Notice ==

= 2.0.0 =
Versión revolucionaria que elimina la necesidad de subir archivos manualmente. Actualiza para una experiencia plug-and-play.`

    pluginFolder?.file('readme.txt', wordpressReadme)

    // Generar el ZIP
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

    // Crear respuesta con headers para descarga
    const response = new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="notifly-push-notifications.zip"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

    return response

  } catch (error) {
    console.error('Error creating plugin ZIP:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
