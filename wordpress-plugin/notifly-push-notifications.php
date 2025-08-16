<?php
/*
Plugin Name: NotiFly Push Notifications
Plugin URI: https://notifly.com
Description: Integra NotiFly en WordPress con mínimo esfuerzo. Solo introduce tu Site ID y listo.
Version: 2.2.1
Author: NotiFly Team
Author URI: https://notifly.com
License: GPL v2 or later
Text Domain: notifly
*/

if (!defined('ABSPATH')) exit; // Evita acceso directo

class NotiFlyPlugin {
    
    private $option_name = 'notifly_site_id';
    private $cdn_base = 'https://www.adioswifi.es';
    private $logo_option = 'notifly_pwa_logo_id'; // attachment ID opcional del logo
    
    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('wp_head', array($this, 'insert_notifly_scripts'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
        add_action('init', array($this, 'handle_notifly_requests'));
        // Regenerar archivos cuando cambie el Site ID
        add_action('update_option_' . $this->option_name, array($this, 'on_site_id_updated'), 10, 3);
    }

    /**
     * Sirve iconos PWA 192/512 desde el mismo dominio.
     * Si existe un logo del cliente (attachment ID en option), genera PNG redimensionado y lo cachea en uploads.
     * Si no, hace proxy de los iconos por defecto desde el CDN.
     */
    private function serve_icon($size) {
        header('Content-Type: image/png');
        $cache_path = $this->get_icons_dir() . "/notifly-{$size}.png";
        if (file_exists($cache_path)) {
            readfile($cache_path);
            return;
        }

        // Intentar generar desde logo del cliente
        $attachment_id = intval(get_option($this->logo_option));
        if ($attachment_id) {
            $generated = $this->generate_icon_from_attachment($attachment_id, $size, $cache_path);
            if ($generated && file_exists($cache_path)) {
                readfile($cache_path);
                return;
            }
        }

        // Fallback: proxy icono por defecto desde CDN
        $src = $this->cdn_base . ($size === 192 ? '/icon-192.png' : '/icon-512.png');
        $this->proxy_binary($src, $cache_path);
        if (file_exists($cache_path)) {
            readfile($cache_path);
            return;
        }
        // Último recurso: redirigir
        header("Location: $src", true, 302);
    }

    private function get_icons_dir() {
        $upload_dir = wp_upload_dir();
        $dir = trailingslashit($upload_dir['basedir']) . 'notifly-icons';
        if (!file_exists($dir)) {
            wp_mkdir_p($dir);
        }
        return $dir;
    }

    private function proxy_binary($url, $save_path) {
        $response = wp_remote_get($url, array('timeout' => 15));
        if (is_wp_error($response)) return false;
        $code = wp_remote_retrieve_response_code($response);
        if ($code !== 200) return false;
        $body = wp_remote_retrieve_body($response);
        if (!$body) return false;
        $this->put_file($save_path, $body);
        return true;
    }

    private function generate_icon_from_attachment($attachment_id, $size, $save_path) {
        $path = get_attached_file($attachment_id);
        if (!$path || !file_exists($path)) return false;
        $editor = wp_get_image_editor($path);
        if (is_wp_error($editor)) return false;
        // Hacer cuadrado: recorte centrado
        $info = getimagesize($path);
        if (!$info) return false;
        $w = $info[0];
        $h = $info[1];
        $side = min($w, $h);
        $x = max(0, intval(($w - $side) / 2));
        $y = max(0, intval(($h - $side) / 2));
        $editor->crop($x, $y, $side, $side);
        $editor->resize($size, $size, true);
        $saved = $editor->save($save_path, 'image/png');
        return !is_wp_error($saved);
    }
    
    /**
     * Añade el menú de administración
     */
    public function add_admin_menu() {
        add_options_page(
            'NotiFly Settings',
            'NotiFly',
            'manage_options',
            'notifly-settings',
            array($this, 'settings_page')
        );
    }
    
    /**
     * Registra las configuraciones
     */
    public function register_settings() {
        register_setting('notifly_options', $this->option_name, array(
            'sanitize_callback' => array($this, 'sanitize_site_id')
        ));
    }
    
    /**
     * Sanitiza el Site ID
     */
    public function sanitize_site_id($input) {
        return sanitize_text_field(trim($input));
    }
    
    /**
     * Encola scripts del admin
     */
    public function enqueue_admin_scripts($hook) {
        if ($hook !== 'settings_page_notifly-settings') return;
        
        wp_enqueue_style('notifly-admin', plugin_dir_url(__FILE__) . 'admin-style.css', array(), '2.0.0');
    }
    
    /**
     * Página de configuración del plugin
     */
    public function settings_page() {
        $site_id = esc_attr(get_option($this->option_name));
        $is_configured = !empty($site_id);
        ?>
        <div class="wrap notifly-admin">
            <div class="notifly-header">
                <h1>
                    <span class="notifly-logo">🔔</span>
                    NotiFly Push Notifications
                </h1>
                <p class="notifly-subtitle">Reconecta con tus visitantes mediante notificaciones push inteligentes</p>
            </div>

            <div class="notifly-container">
                <!-- Configuración Principal -->
                <div class="notifly-card">
                    <h2>⚙️ Configuración</h2>
                    <form method="post" action="options.php">
                        <?php
                        settings_fields('notifly_options');
                        do_settings_sections('notifly-settings');
                        ?>
                        <table class="form-table">
                            <tr valign="top">
                                <th scope="row">
                                    <label for="notifly_site_id">Site ID</label>
                                </th>
                                <td>
                                    <input 
                                        type="text" 
                                        id="notifly_site_id"
                                        name="<?php echo $this->option_name; ?>" 
                                        value="<?php echo $site_id; ?>" 
                                        placeholder="Ej: abc123def456"
                                        class="regular-text"
                                    />
                                    <p class="description">
                                        Obtén tu Site ID desde tu <a href="https://www.adioswifi.es/dashboard" target="_blank">dashboard de NotiFly</a>
                                    </p>
                                </td>
                            </tr>
                        </table>
                        <?php submit_button('Guardar Configuración', 'primary', 'submit', false); ?>
                    </form>
                </div>

                <?php if ($is_configured): ?>
                <!-- Estado de Integración -->
                <div class="notifly-card">
                    <h2>🔍 Verificación de Integración</h2>
                    <div id="notifly-checker">
                        <div class="notifly-loading">
                            <span class="spinner"></span>
                            Verificando integración...
                        </div>
                    </div>
                    
                    <script>
                        (async function() {
                            const siteId = '<?php echo $site_id; ?>';
                            const cdnBase = '<?php echo $this->cdn_base; ?>';
                            const checker = document.getElementById('notifly-checker');
                            
                            try {
                                // URLs a verificar
                                const urls = {
                                    sdk: `${cdnBase}/sdk.js`,
                                    sw: `${window.location.origin}/sw.js`,
                                    manifest: `${window.location.origin}/notifly/manifest.json`
                                };
                                
                                // Verificar cada URL
                                const results = {};
                                for (const [key, url] of Object.entries(urls)) {
                                    try {
                                        const response = await fetch(url, { method: 'HEAD' });
                                        results[key] = {
                                            status: response.ok,
                                            code: response.status
                                        };
                                    } catch (error) {
                                        results[key] = {
                                            status: false,
                                            error: error.message
                                        };
                                    }
                                }
                                
                                // Mostrar resultados
                                const statusHTML = `
                                    <div class="notifly-status">
                                        <div class="status-item ${results.sdk.status ? 'success' : 'error'}">
                                            <span class="status-icon">${results.sdk.status ? '✅' : '❌'}</span>
                                            <span class="status-text">SDK Script</span>
                                            <span class="status-detail">${results.sdk.status ? 'Cargando correctamente' : 'Error: ' + (results.sdk.error || results.sdk.code)}</span>
                                        </div>
                                        <div class="status-item ${results.sw.status ? 'success' : 'error'}">
                                            <span class="status-icon">${results.sw.status ? '✅' : '❌'}</span>
                                            <span class="status-text">Service Worker</span>
                                            <span class="status-detail">${results.sw.status ? 'Disponible en CDN' : 'Error: ' + (results.sw.error || results.sw.code)}</span>
                                        </div>
                                        <div class="status-item ${results.manifest.status ? 'success' : 'error'}">
                                            <span class="status-icon">${results.manifest.status ? '✅' : '❌'}</span>
                                            <span class="status-text">Web App Manifest</span>
                                            <span class="status-detail">${results.manifest.status ? 'Disponible en CDN' : 'Error: ' + (results.manifest.error || results.manifest.code)}</span>
                                        </div>
                                    </div>
                                `;
                                
                                // Verificar si todo está OK
                                const allOk = Object.values(results).every(r => r.status);
                                
                                if (allOk) {
                                    checker.innerHTML = `
                                        <div class="notifly-success">
                                            <h3>🎉 ¡Integración Completa!</h3>
                                            <p>NotiFly está correctamente configurado en tu sitio web.</p>
                                        </div>
                                        ${statusHTML}
                                    `;
                                } else {
                                    checker.innerHTML = `
                                        <div class="notifly-warning">
                                            <h3>⚠️ Problemas Detectados</h3>
                                            <p>Algunos componentes no están disponibles. Contacta soporte si persiste.</p>
                                        </div>
                                        ${statusHTML}
                                    `;
                                }
                                
                            } catch (error) {
                                checker.innerHTML = `
                                    <div class="notifly-error">
                                        <h3>❌ Error de Verificación</h3>
                                        <p>No se pudo verificar la integración: ${error.message}</p>
                                    </div>
                                `;
                            }
                        })();
                    </script>
                </div>

                <!-- Información Adicional -->
                <div class="notifly-card">
                    <h2>📊 Información del Sitio</h2>
                    <div class="notifly-info">
                        <div class="info-row">
                            <strong>Site ID:</strong> 
                            <code><?php echo $site_id; ?></code>
                        </div>
                        <div class="info-row">
                            <strong>URL del Sitio:</strong> 
                            <code><?php echo home_url(); ?></code>
                        </div>
                        <div class="info-row">
                            <strong>Estado HTTPS:</strong> 
                            <span class="<?php echo is_ssl() ? 'success' : 'warning'; ?>">
                                <?php echo is_ssl() ? '✅ Habilitado' : '⚠️ Requerido para notificaciones'; ?>
                            </span>
                        </div>
                    </div>
                    
                    <div class="notifly-actions">
                        <a href="https://www.adioswifi.es/dashboard" target="_blank" class="button button-primary">
                            📊 Ver Dashboard
                        </a>
                        <a href="https://www.adioswifi.es/dashboard/notifications/new?site=<?php echo $site_id; ?>" target="_blank" class="button">
                            📤 Enviar Notificación
                        </a>
                    </div>
                </div>
                <?php else: ?>
                <!-- Guía de Configuración -->
                <div class="notifly-card">
                    <h2>🚀 Primeros Pasos</h2>
                    <div class="notifly-steps">
                        <div class="step">
                            <div class="step-number">1</div>
                            <div class="step-content">
                                <h3>Crea tu cuenta en NotiFly</h3>
                                <p>Regístrate gratis en <a href="https://www.adioswifi.es/sign-up" target="_blank">www.adioswifi.es</a></p>
                            </div>
                        </div>
                        <div class="step">
                            <div class="step-number">2</div>
                            <div class="step-content">
                                <h3>Agrega tu sitio web</h3>
                                <p>Desde el dashboard, agrega tu sitio: <code><?php echo home_url(); ?></code></p>
                            </div>
                        </div>
                        <div class="step">
                            <div class="step-number">3</div>
                            <div class="step-content">
                                <h3>Copia tu Site ID</h3>
                                <p>Pega el Site ID generado en el campo de arriba y guarda.</p>
                            </div>
                        </div>
                        <div class="step">
                            <div class="step-number">4</div>
                            <div class="step-content">
                                <h3>¡Listo! 🎉</h3>
                                <p>El plugin se encarga del resto automáticamente.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <?php endif; ?>
            </div>
        </div>

        <style>
            .notifly-admin {
                max-width: 1200px;
            }
            .notifly-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 12px;
                margin-bottom: 30px;
                text-align: center;
            }
            .notifly-header h1 {
                color: white;
                font-size: 2.5em;
                margin: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 15px;
            }
            .notifly-logo {
                font-size: 1.2em;
            }
            .notifly-subtitle {
                margin: 10px 0 0 0;
                opacity: 0.9;
                font-size: 1.1em;
            }
            .notifly-container {
                display: grid;
                gap: 30px;
            }
            .notifly-card {
                background: white;
                border: 1px solid #e0e0e0;
                border-radius: 12px;
                padding: 30px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .notifly-card h2 {
                margin-top: 0;
                color: #333;
                border-bottom: 2px solid #f0f0f0;
                padding-bottom: 15px;
            }
            .notifly-loading {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 8px;
            }
            .spinner {
                width: 20px;
                height: 20px;
                border: 2px solid #f3f3f3;
                border-top: 2px solid #667eea;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .notifly-status {
                display: grid;
                gap: 15px;
            }
            .status-item {
                display: grid;
                grid-template-columns: 40px 200px 1fr;
                align-items: center;
                padding: 15px;
                border-radius: 8px;
                border: 1px solid #e0e0e0;
            }
            .status-item.success {
                background: #f0f9f0;
                border-color: #4caf50;
            }
            .status-item.error {
                background: #fff5f5;
                border-color: #f44336;
            }
            .status-icon {
                font-size: 1.5em;
            }
            .status-text {
                font-weight: 600;
                color: #333;
            }
            .status-detail {
                color: #666;
                font-size: 0.9em;
            }
            .notifly-success {
                background: #e8f5e8;
                border: 1px solid #4caf50;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 20px;
            }
            .notifly-success h3 {
                color: #2e7d32;
                margin: 0 0 10px 0;
            }
            .notifly-warning {
                background: #fff8e1;
                border: 1px solid #ff9800;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 20px;
            }
            .notifly-warning h3 {
                color: #f57c00;
                margin: 0 0 10px 0;
            }
            .notifly-error {
                background: #ffebee;
                border: 1px solid #f44336;
                padding: 20px;
                border-radius: 8px;
            }
            .notifly-error h3 {
                color: #c62828;
                margin: 0 0 10px 0;
            }
            .notifly-info {
                display: grid;
                gap: 15px;
                margin-bottom: 25px;
            }
            .info-row {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 10px;
                background: #f8f9fa;
                border-radius: 6px;
            }
            .info-row code {
                background: #e9ecef;
                padding: 4px 8px;
                border-radius: 4px;
                font-family: 'Courier New', monospace;
            }
            .info-row .success {
                color: #4caf50;
                font-weight: 600;
            }
            .info-row .warning {
                color: #ff9800;
                font-weight: 600;
            }
            .notifly-actions {
                display: flex;
                gap: 15px;
                flex-wrap: wrap;
            }
            .notifly-steps {
                display: grid;
                gap: 20px;
            }
            .step {
                display: flex;
                align-items: flex-start;
                gap: 20px;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 10px;
                border-left: 4px solid #667eea;
            }
            .step-number {
                background: #667eea;
                color: white;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                flex-shrink: 0;
            }
            .step-content h3 {
                margin: 0 0 10px 0;
                color: #333;
            }
            .step-content p {
                margin: 0;
                color: #666;
            }
        </style>
        <?php
    }
    
    /**
     * Inserta los scripts de NotiFly en el head
     */
    public function insert_notifly_scripts() {
        $site_id = get_option($this->option_name);
        
        if (empty($site_id)) return;
        
        // Solo en HTTPS (requerido para notificaciones push)
        if (!is_ssl() && !is_admin()) {
            echo "\n<!-- NotiFly: HTTPS requerido para notificaciones push -->\n";
            return;
        }
        
        echo "\n<!-- NotiFly Push Notifications -->\n";
        
        // Configuración global
        echo "<script>
// Configurar NotiFly globalmente
window.NOTIFLY_SITE_ID = '{$site_id}';
window.NOTIFLY_API_BASE = 'https://www.adioswifi.es';
</script>\n";
        
        // SDK Principal desde CDN
        echo "<script src='{$this->cdn_base}/sdk.js' async></script>\n";
        
        // Web App Manifest: usar ruta limpia bajo /notifly para evitar bloqueos por query
        $manifest_url = home_url('/notifly/manifest.json');
        echo "<link rel='manifest' href='{$manifest_url}'>\n";
        // Script de diagnóstico PWA: valida manifest e iconos y elimina manifests conflictivos
        echo "<script>(function(){\n".
             "try {\n".
             "  const ourManifestHref = '{$manifest_url}';\n".
             "  const links = Array.from(document.querySelectorAll(\"link[rel='manifest']\"));\n".
             "  console.log('[NotiFly][PWA] Manifest links encontrados:', links.map(l=>l.href));\n".
             "  // No eliminar manifests existentes; solo asegurar que el nuestro esté presente\n".
             "  let manifestEl = links.find(l=>l.href === ourManifestHref);\n".
             "  if (!manifestEl) { manifestEl = document.createElement('link'); manifestEl.rel='manifest'; manifestEl.href=ourManifestHref; document.head.prepend(manifestEl); }\n".
             "  console.log('[NotiFly][PWA] Manifest asegurado:', manifestEl.href);\n".
             "  // Fetch del manifest\n".
             "  fetch(manifestEl.href, { cache: 'reload' }).then(async r=>{\n".
             "    console.log('[NotiFly][PWA] Manifest status:', r.status, 'content-type:', r.headers.get('content-type'));\n".
             "    const txt = await r.text();\n".
             "    let json = null;\n".
             "    try { json = JSON.parse(txt); } catch(e){ console.warn('[NotiFly][PWA] Manifest no es JSON válido:', e); }\n".
             "    if (json && Array.isArray(json.icons)) {\n".
             "      console.log('[NotiFly][PWA] Icons en manifest:', json.icons);\n".
             "      const has192 = json.icons.some(i=>String(i.sizes).includes('192'));\n".
             "      const has512 = json.icons.some(i=>String(i.sizes).includes('512'));\n".
             "      console.log('[NotiFly][PWA] Icons 192/512 presentes:', has192, has512);\n".
             "    } else {\n".
             "      console.warn('[NotiFly][PWA] Manifest sin icons o estructura inesperada');\n".
             "    }\n".
             "  }).catch(err=>{ console.error('[NotiFly][PWA] Error al obtener manifest:', err); });\n".
             "  // Probar endpoints de iconos 192/512\n".
             "  function testIcon(size){\n".
             "    const iconUrl = new URL('/notifly/icon-' + size + '.png', window.location.origin).href;\n".
             "    fetch(iconUrl, { cache: 'reload' }).then(r=>{\n".
             "      console.log(`[NotiFly][PWA] Icon ${size} status:`, r.status, 'content-type:', r.headers.get('content-type'));\n".
             "      const img = new Image();\n".
             "      img.onload = function(){ console.log(`[NotiFly][PWA] Icon ${size} dimensiones:`, img.naturalWidth+'x'+img.naturalHeight); }\n".
             "      img.onerror = function(){ console.warn(`[NotiFly][PWA] Icon ${size} no carga como imagen`); }\n".
             "      img.src = iconUrl + '?_=' + Date.now();\n".
             "    }).catch(err=>{ console.error(`[NotiFly][PWA] Error fetch icon ${size}:`, err); });\n".
             "  }\n".
             "  testIcon(192);\n".
             "  testIcon(512);\n".
             "  // Capturar beforeinstallprompt (Chromium)\n".
             "  window.addEventListener('beforeinstallprompt', (e)=>{\n".
             "    e.preventDefault();\n".
             "    window.notiflyDeferredPrompt = e;\n".
             "    console.log('[NotiFly][PWA] beforeinstallprompt capturado. Instalabilidad OK. Llama notiflyDeferredPrompt.prompt() tras una acción del usuario.');\n".
             "  });\n".
             "} catch(ex){ console.error('[NotiFly][PWA] Error script diagnóstico:', ex); }\n".
             "})();</script>\n";
        
        // Service Worker desde raíz (virtual si no existe archivo físico) para obtener scope '/'
        $sw_url = home_url('/sw.js');
        echo "<script>
if ('serviceWorker' in navigator && 'PushManager' in window) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('{$sw_url}')
            .then(function(registration) {
                console.log('✅ NotiFly: Service Worker registrado exitosamente');
            })
            .catch(function(error) {
                console.error('❌ NotiFly: Error al registrar Service Worker:', error);
            });
    });
} else {
    console.warn('⚠️ NotiFly: Push notifications no soportadas en este navegador');
}
</script>\n";
        
        echo "<!-- /NotiFly Push Notifications -->\n\n";
    }
    
    /**
     * Maneja las solicitudes de archivos NotiFly (SW y Manifest)
     */
    public function handle_notifly_requests() {
        // Soporte por rutas limpias virtuales y archivos físicos (si existen)
        $req_path = isset($_SERVER['REQUEST_URI']) ? parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) : '';
        // Normalizar por si hay subpaths o index.php delante
        if ($req_path && (rtrim($req_path, '/') === '/sw.js' || substr($req_path, -6) === '/sw.js')) {
            $physical = ABSPATH . 'sw.js';
            if (!file_exists($physical)) {
                $this->serve_service_worker();
                exit;
            }
        }
        // Ruta limpia: /notifly/sw.js
        if ($req_path && (rtrim($req_path, '/') === '/notifly/sw.js' || substr($req_path, -14) === '/notifly/sw.js')) {
            $this->serve_service_worker();
            exit;
        }
        if ($req_path && (rtrim($req_path, '/') === '/manifest.json' || substr($req_path, -13) === '/manifest.json')) {
            $physical = ABSPATH . 'manifest.json';
            if (!file_exists($physical)) {
                $this->serve_manifest();
                exit;
            }
        }
        // Ruta limpia: /notifly/manifest.json
        if ($req_path && (rtrim($req_path, '/') === '/notifly/manifest.json' || substr($req_path, -20) === '/notifly/manifest.json')) {
            $this->serve_manifest();
            exit;
        }

        // Rutas limpias de iconos
        if ($req_path && (rtrim($req_path, '/') === '/notifly/icon-192.png' || substr($req_path, -20) === '/notifly/icon-192.png')) {
            $this->serve_icon(192);
            exit;
        }
        if ($req_path && (rtrim($req_path, '/') === '/notifly/icon-512.png' || substr($req_path, -20) === '/notifly/icon-512.png')) {
            $this->serve_icon(512);
            exit;
        }

        // Endpoints de iconos PWA servidos desde el mismo dominio
        if (isset($_GET['notifly_icon'])) {
            $size = intval($_GET['notifly_icon']);
            if (!in_array($size, array(192, 512), true)) {
                http_response_code(400);
                header('Content-Type: text/plain; charset=utf-8');
                echo 'Invalid icon size';
                exit;
            }
            $this->serve_icon($size);
            exit;
        }

        if (isset($_GET['notifly_sw']) || isset($_GET['pushsaas-worker']) || isset($_GET['pushsaas_worker'])) {
            $this->serve_service_worker();
            exit;
        }
        
        if (isset($_GET['notifly_manifest']) || isset($_GET['pushsaas_manifest'])) {
            $this->serve_manifest();
            exit;
        }
    }
    
    /**
     * Sirve el Service Worker localmente
     */
    private function serve_service_worker() {
        $site_id = get_option($this->option_name);
        if (empty($site_id)) {
            http_response_code(404);
            exit;
        }
        
        header('Content-Type: application/javascript; charset=utf-8');
        header('Service-Worker-Allowed: /');
        
        // Service Worker local mínimo: delega toda la lógica al SW centralizado
        echo "
// NotiFly Service Worker (local minimo) - Generado dinamicamente\n".
             "const SITE_ID = '" . addslashes($site_id) . "';\n".
             "// Importa el SW centralizado desde CDN con el Site ID del cliente (cache-busting)\n".
             "importScripts('" . addslashes($this->cdn_base) . "/sw.js?site=' + SITE_ID + '&_cb=' + Date.now());\n".
             "console.log('[NotiFly][SW] Importando SW central para site:', SITE_ID);\n";
    }

    /**
     * Genera sw.js en la raíz de WordPress con SW local mínimo
     */
    public function generate_service_worker($site_id) {
        if (empty($site_id)) return false;
        $content = "// NotiFly Service Worker (local mínimo) - Generado por plugin\n" .
                   "const SITE_ID = '" . esc_js($site_id) . "';\n" .
                   "// Cache-busting para asegurar actualización del SW centralizado\n" .
                   "importScripts('" . esc_url($this->cdn_base) . "/sw.js?site=' + SITE_ID + '&_cb=' + Date.now());\n" .
                   "console.log('✅ NotiFly SW local importando SW central para site:', SITE_ID);\n";

        return $this->put_file(ABSPATH . 'sw.js', $content);
    }

    /**
     * Genera manifest.json en la raíz de WordPress
     */
    public function generate_manifest() {
        $site_name = get_bloginfo('name');
        $site_desc = get_bloginfo('description');
        $site_url  = home_url();
        $manifest  = array(
            'name' => $site_name,
            'short_name' => $site_name,
            'description' => $site_desc,
            'start_url' => $site_url,
            'scope' => $site_url,
            'display' => 'standalone',
            'background_color' => '#ffffff',
            'theme_color' => '#000000',
            'icons' => array(
                array(
                    'src' => home_url('/notifly/icon-192.png'),
                    'sizes' => '192x192',
                    'type' => 'image/png',
                    'purpose' => 'any maskable'
                ),
                array(
                    'src' => home_url('/notifly/icon-512.png'),
                    'sizes' => '512x512',
                    'type' => 'image/png',
                    'purpose' => 'any maskable'
                )
            )
        );
        $content = json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        return $this->put_file(ABSPATH . 'manifest.json', $content);
    }

    /**
     * Callback al actualizar el Site ID: regenerar archivos en raíz
     */
    public function on_site_id_updated($old_value, $new_value, $option) {
        $new_value = sanitize_text_field(trim((string)$new_value));
        if (!empty($new_value)) {
            $this->generate_service_worker($new_value);
            $this->generate_manifest();
        }
    }

    /**
     * Helpers de archivos con WP_Filesystem y fallback a file_put_contents
     */
    private function ensure_filesystem() {
        if (!function_exists('WP_Filesystem')) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
        }
        $creds = request_filesystem_credentials(site_url());
        if (!WP_Filesystem($creds)) {
            // Puede fallar silenciosamente si no requiere credenciales
        }
        global $wp_filesystem;
        return isset($wp_filesystem) && $wp_filesystem ? $wp_filesystem : null;
    }

    private function put_file($path, $content) {
        $fs = $this->ensure_filesystem();
        if ($fs && is_object($fs)) {
            return (bool) $fs->put_contents($path, $content, FS_CHMOD_FILE);
        }
        // Fallback directo
        return (bool) @file_put_contents($path, $content);
    }
    
    /**
     * Sirve el Web App Manifest localmente
     */
    private function serve_manifest() {
        $site_id = get_option($this->option_name);
        if (empty($site_id)) {
            http_response_code(404);
            exit;
        }
        
        // Cabeceras recomendadas para manifest
        header('Content-Type: application/manifest+json; charset=utf-8');
        header('Cache-Control: public, max-age=300');
        
        $site_name = get_bloginfo('name');
        $site_desc = get_bloginfo('description');
        $site_url  = home_url();
        
        $manifest  = array(
            'name' => $site_name,
            'short_name' => $site_name,
            'description' => $site_desc,
            'start_url' => $site_url,
            'scope' => $site_url,
            'display' => 'standalone',
            'background_color' => '#ffffff',
            'theme_color' => '#000000',
            'icons' => array(
                array(
                    'src' => home_url('/notifly/icon-192.png'),
                    'sizes' => '192x192',
                    'type' => 'image/png',
                    'purpose' => 'any maskable'
                ),
                array(
                    'src' => home_url('/notifly/icon-512.png'),
                    'sizes' => '512x512',
                    'type' => 'image/png',
                    'purpose' => 'any maskable'
                )
            )
        );
        
        echo json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    }
}

// Inicializar el plugin
new NotiFlyPlugin();

// Hook de activación
register_activation_hook(__FILE__, function() {
    // Mensaje de bienvenida
    add_option('notifly_show_welcome', true);
});

// Hook de desactivación
register_deactivation_hook(__FILE__, function() {
    // Limpiar opciones si es necesario
    delete_option('notifly_show_welcome');
});

// Mostrar mensaje de bienvenida
add_action('admin_notices', function() {
    if (get_option('notifly_show_welcome')) {
        echo '<div class="notice notice-success is-dismissible">
            <p><strong>🔔 NotiFly activado!</strong> Ve a <a href="' . admin_url('options-general.php?page=notifly-settings') . '">Configuración → NotiFly</a> para configurar tu Site ID.</p>
        </div>';
        delete_option('notifly_show_welcome');
    }
});
