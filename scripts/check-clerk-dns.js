const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// Registros DNS que Clerk requiere
const clerkDNSRecords = [
  {
    name: 'Frontend API',
    subdomain: 'clerk.adioswifi.es',
    expectedTarget: 'frontend-api.clerk.services',
    type: 'CNAME'
  },
  {
    name: 'Account Portal',
    subdomain: 'accounts.adioswifi.es',
    expectedTarget: 'accounts.clerk.services',
    type: 'CNAME'
  },
  {
    name: 'Email',
    subdomain: 'clkmail.adioswifi.es',
    expectedTarget: 'mail.xgqulzgz1vj0.clerk.services',
    type: 'CNAME'
  },
  {
    name: 'DKIM 1',
    subdomain: 'clk._domainkey.adioswifi.es',
    expectedTarget: 'dkim1.xgqulzgz1vj0.clerk.services',
    type: 'CNAME'
  },
  {
    name: 'DKIM 2',
    subdomain: 'clk2._domainkey.adioswifi.es',
    expectedTarget: 'dkim2.xgqulzgz1vj0.clerk.services',
    type: 'CNAME'
  }
];

async function checkDNSRecord(record) {
  try {
    console.log(`\n🔍 Verificando ${record.name}: ${record.subdomain}`);
    
    // Usar nslookup para verificar el registro
    const { stdout, stderr } = await execAsync(`nslookup ${record.subdomain}`);
    
    if (stderr) {
      console.log(`❌ Error: ${stderr}`);
      return false;
    }
    
    console.log(`📋 Respuesta DNS:`);
    console.log(stdout);
    
    // Verificar si apunta al target correcto
    if (stdout.includes(record.expectedTarget)) {
      console.log(`✅ CORRECTO: Apunta a ${record.expectedTarget}`);
      return true;
    } else {
      console.log(`❌ INCORRECTO: Debería apuntar a ${record.expectedTarget}`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Error verificando ${record.subdomain}: ${error.message}`);
    return false;
  }
}

async function checkAllClerkDNS() {
  console.log('🚀 Verificando configuración DNS de Clerk para adioswifi.es\n');
  console.log('=' .repeat(60));
  
  let allCorrect = true;
  const results = [];
  
  for (const record of clerkDNSRecords) {
    const isCorrect = await checkDNSRecord(record);
    results.push({ ...record, isCorrect });
    allCorrect = allCorrect && isCorrect;
    
    // Pausa entre verificaciones
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 RESUMEN DE VERIFICACIÓN DNS');
  console.log('=' .repeat(60));
  
  results.forEach(result => {
    const status = result.isCorrect ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.subdomain}`);
    if (!result.isCorrect) {
      console.log(`   → Debe apuntar a: ${result.expectedTarget}`);
    }
  });
  
  console.log('\n' + '=' .repeat(60));
  if (allCorrect) {
    console.log('🎉 ¡TODOS LOS REGISTROS DNS ESTÁN CORRECTOS!');
    console.log('Si Clerk sigue sin funcionar, el problema puede ser:');
    console.log('• Propagación DNS (esperar hasta 48 horas)');
    console.log('• Configuración de Cloudflare (debe ser "DNS only")');
    console.log('• Certificados SSL pendientes en Clerk');
  } else {
    console.log('⚠️  ALGUNOS REGISTROS DNS NECESITAN CORRECCIÓN');
    console.log('Configura los registros marcados con ❌ en tu proveedor DNS');
  }
  console.log('=' .repeat(60));
}

// Ejecutar verificación
checkAllClerkDNS().catch(console.error);
