# 🚀 SaaS de Notificaciones Push Web

Una plataforma SaaS white-label para que pequeños negocios puedan reconectar con visitantes de su sitio web mediante notificaciones push.

*Proyecto migrado a Supabase Auth (se eliminó Clerk)*

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14 + React + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Autenticación**: Supabase Auth
- **Base de datos**: Supabase (PostgreSQL)
- **Push Notifications**: Web Push nativo (VAPID)
- **Deployment**: Vercel

## 🚀 Configuración Inicial

### 1. Instalar dependencias

```bash
npm install --legacy-peer-deps
```

### 2. Configurar variables de entorno

Copia `.env.example` a `.env.local` y completa las siguientes variables:

#### Supabase Auth (Autenticación)
Crea un proyecto en Supabase y usa las claves a continuación. La autenticación se gestiona con `@supabase/auth-helpers-nextjs` (App Router y Middleware).

#### Supabase (Base de datos)
1. Ve a [supabase.com](https://supabase.com) y crea un proyecto
2. Ve a Settings > API y copia las claves:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

3. Ejecuta el SQL del archivo `supabase/schema.sql` en el SQL Editor de Supabase

#### Web Push (VAPID)
Las claves VAPID se gestionan por sitio en la base de datos (tabla `vapid_keys`). Asegúrate de tener configuradas estas variables globales para la app:
```env
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

### 3. Configurar la base de datos

1. Ve a tu proyecto de Supabase
2. Abre el SQL Editor
3. Ejecuta todo el contenido del archivo `supabase/schema.sql`

### 4. Ejecutar el proyecto

```bash
npm run dev
```

El proyecto estará disponible en [http://localhost:3000](http://localhost:3000)

## 📁 Estructura del Proyecto

```
├── app/                    # App Router de Next.js
│   ├── api/               # API Routes
│   │   ├── sites/         # Gestión de sitios
│   │   ├── subscribers/   # Gestión de suscriptores
│   │   └── notifications/ # Envío de notificaciones
│   ├── dashboard/         # Panel de usuario
│   ├── auth/sign-in/      # Página de login
│   └── auth/sign-up/      # Página de registro
├── components/ui/         # Componentes de UI (shadcn/ui)
├── lib/                   # Utilidades y configuración
│   ├── supabase.ts       # Cliente de Supabase
│   ├── database.types.ts # Tipos de la base de datos
│   └── hooks/            # Custom hooks
├── public/
│   └── sdk.js            # SDK embebible para sitios web
└── supabase/
    └── schema.sql        # Esquema de la base de datos
```

## 🔧 Funcionalidades Implementadas

### ✅ Autenticación
- Registro e inicio de sesión con Supabase Auth (email+password y Magic Link)
- Roles de usuario (user/admin)
- Middleware de protección de rutas (refresco de sesión Supabase)

### ✅ Gestión de Sitios
- Registro de sitios web
- Generación de códigos JavaScript únicos
- Integración automática con Web Push (VAPID)

### ✅ Recolección de Suscriptores
- SDK JavaScript embebible
- Registro automático de tokens de push
- Conteo de suscriptores en tiempo real

### ✅ Envío de Notificaciones
- Interfaz para crear notificaciones
- Envío con Web Push nativo
- Métricas básicas (enviados, entregados, clics)

### ✅ Restricciones de Plan
- Plan gratuito: 500 suscriptores
- Plan pago: 10,000 suscriptores
- Bloqueo automático al superar límites

### ✅ Dashboard
- Resumen de estadísticas
- Gestión de sitios
- Historial de notificaciones

## 🎯 Cómo usar el sistema

### Para el administrador de la plataforma:

1. **Configurar las cuentas de servicio**:
   - Supabase (auth + base de datos)
   - Web Push nativo para notificaciones

2. **Desplegar la aplicación** en Vercel o similar

### Para los clientes (pequeños negocios):

1. **Registrarse** en la plataforma
2. **Agregar su sitio web** con nombre y URL
3. **Instalar el código JavaScript** en su sitio:
   ```html
   <script src="https://tu-dominio.com/sdk.js" data-site="abc123"></script>
   ```
4. **Esperar a que lleguen suscriptores** (visitantes que acepten notificaciones)
5. **Enviar notificaciones** desde el panel de control

## 🚀 Deployment

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en Vercel
3. Deploy automático

### Variables de entorno para producción:
- Todas las de `.env.local`
- `NEXT_PUBLIC_APP_URL` debe apuntar a tu dominio de producción

## 🔮 Funcionalidades Futuras (No MVP)

- [ ] Integración con Stripe para pagos
- [ ] Programación de notificaciones
- [ ] Segmentación por país/navegador
- [ ] App embed para Shopify
- [ ] Branding personalizado avanzado
- [ ] Métricas más detalladas
- [ ] A/B testing de notificaciones

## 🐛 Troubleshooting

### Error de Supabase
Si hay problemas con la base de datos:
- Verifica que el esquema SQL se haya ejecutado
- Revisa las políticas RLS en Supabase

### Error de Web Push
Para problemas con notificaciones:
- Verifica las claves VAPID
- Revisa que las suscripciones existan para el sitio

## 📞 Soporte

Para problemas técnicos o preguntas sobre el código, revisa:
1. Los logs del servidor (`npm run dev`)
2. La consola del navegador
3. Los logs de Supabase
4. Los logs del endpoint `/api/notifications`

## 📄 Licencia

Este proyecto es privado y propietario.
