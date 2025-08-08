const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3001; // Puerto diferente para HTTPS

// Crear certificados auto-firmados si no existen
const certDir = path.join(__dirname, '..', 'certs');
const keyPath = path.join(certDir, 'localhost-key.pem');
const certPath = path.join(certDir, 'localhost.pem');

// Función para crear certificados auto-firmados
function createSelfSignedCert() {
  const { execSync } = require('child_process');
  
  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true });
  }

  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.log('🔐 Creando certificados SSL auto-firmados...');
    
    try {
      // Crear certificado auto-firmado usando OpenSSL
      execSync(`openssl req -x509 -out ${certPath} -keyout ${keyPath} -newkey rsa:2048 -nodes -sha256 -subj "/CN=localhost" -extensions EXT -config <(printf "[dn]\\nCN=localhost\\n[req]\\ndistinguished_name = dn\\n[EXT]\\nsubjectAltName=DNS:localhost\\nkeyUsage=digitalSignature\\nextendedKeyUsage=serverAuth")`, {
        shell: '/bin/bash'
      });
      console.log('✅ Certificados SSL creados exitosamente');
    } catch (error) {
      console.error('❌ Error creando certificados SSL:', error.message);
      console.log('💡 Alternativa: Instala mkcert para certificados confiables:');
      console.log('   npm install -g mkcert');
      console.log('   mkcert -install');
      console.log('   mkcert localhost');
      process.exit(1);
    }
  }
}

// Crear certificados si no existen
createSelfSignedCert();

// Configuración HTTPS
const httpsOptions = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
};

// Crear app Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`🚀 Servidor HTTPS ejecutándose en https://${hostname}:${port}`);
      console.log(`🔒 Certificado SSL: ${certPath}`);
      console.log(`🔑 Clave privada: ${keyPath}`);
      console.log('');
      console.log('📱 Para probar notificaciones push:');
      console.log(`   1. Abre https://${hostname}:${port}`);
      console.log('   2. Acepta el certificado auto-firmado');
      console.log('   3. Instala la PWA desde el navegador');
      console.log('   4. Prueba las notificaciones');
    });
});
