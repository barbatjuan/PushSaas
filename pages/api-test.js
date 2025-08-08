import { useState, useEffect } from 'react';

export default function ApiTest() {
  const [activeTab, setActiveTab] = useState('sites');
  const [siteId, setSiteId] = useState('');
  const [siteName, setSiteName] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [sites, setSites] = useState([]);
  const [result, setResult] = useState(null);
  const [resultJson, setResultJson] = useState('');
  const [notificationTitle, setNotificationTitle] = useState('Nueva notificación');
  const [notificationBody, setNotificationBody] = useState('Este es el cuerpo de la notificación');
  const [notificationUrl, setNotificationUrl] = useState('/dashboard');
  const [subscription, setSubscription] = useState(null);
  const [testEndpoint, setTestEndpoint] = useState('');

  // Funciones auxiliares
  const formatJson = (data) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch (e) {
      return String(data);
    }
  };

  const handleResult = (res) => {
    setResult(res);
    setResultJson(formatJson(res));
  };

  // Solicitar permiso de notificaciones y obtener suscripción
  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        handleResult({ error: 'Permiso de notificaciones denegado' });
        return;
      }

      // Registrar Service Worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      // Esperar a que esté activo
      await navigator.serviceWorker.ready;
      
      // Obtener suscripción existente o crear nueva
      let sub = await registration.pushManager.getSubscription();
      
      if (!sub) {
        // Necesitamos las claves VAPID para crear suscripción
        // En producción, estas vendrían del backend
        // Obtener clave VAPID dinámica del endpoint API
        const response = await fetch('/api/sites/y70tplqd4an');
        const siteData = await response.json();
        const vapidPublicKey = siteData.vapidPublicKey;
        
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
        
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
      }
      
      setSubscription(sub.toJSON());
      handleResult({ success: true, subscription: sub.toJSON() });
    } catch (error) {
      handleResult({ error: error.message });
    }
  };

  // Función para convertir VAPID key
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // PRUEBAS DE ENDPOINTS

  // Listar sitios
  const fetchSites = async () => {
    try {
      const res = await fetch('/api/sites');
      const data = await res.json();
      handleResult(data);
      if (data.sites) {
        setSites(data.sites);
      }
    } catch (error) {
      handleResult({ error: error.message });
    }
  };

  // Crear sitio
  const createSite = async () => {
    try {
      if (!siteName || !siteUrl) {
        handleResult({ error: 'Nombre y URL son obligatorios' });
        return;
      }

      const res = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteName, siteUrl })
      });
      const data = await res.json();
      handleResult(data);
      
      // Refrescar lista de sitios
      fetchSites();
    } catch (error) {
      handleResult({ error: error.message });
    }
  };

  // Obtener detalles de un sitio
  const getSiteDetails = async (id) => {
    try {
      const res = await fetch(`/api/sites/${id || siteId}`);
      const data = await res.json();
      handleResult(data);
    } catch (error) {
      handleResult({ error: error.message });
    }
  };

  // Actualizar sitio
  const updateSite = async () => {
    try {
      if (!siteId) {
        handleResult({ error: 'Selecciona un ID de sitio' });
        return;
      }

      const updates = {};
      if (siteName) updates.siteName = siteName;
      if (siteUrl) updates.siteUrl = siteUrl;

      const res = await fetch(`/api/sites/${siteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      handleResult(data);
    } catch (error) {
      handleResult({ error: error.message });
    }
  };

  // Desactivar sitio
  const deactivateSite = async () => {
    try {
      if (!siteId) {
        handleResult({ error: 'Selecciona un ID de sitio' });
        return;
      }

      const res = await fetch(`/api/sites/${siteId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      handleResult(data);
      
      // Refrescar lista de sitios
      fetchSites();
    } catch (error) {
      handleResult({ error: error.message });
    }
  };

  // Suscribirse a notificaciones push
  const subscribeToPush = async () => {
    try {
      if (!siteId || !subscription) {
        handleResult({ 
          error: 'Se requiere ID del sitio y suscripción. Solicita permiso primero.' 
        });
        return;
      }

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          siteId, 
          subscription,
          userAgent: navigator.userAgent
        })
      });
      const data = await res.json();
      handleResult(data);
    } catch (error) {
      handleResult({ error: error.message });
    }
  };

  // Cancelar suscripción
  const unsubscribe = async () => {
    try {
      if (!siteId || !subscription) {
        handleResult({ 
          error: 'Se requiere ID del sitio y suscripción. Solicita permiso primero.' 
        });
        return;
      }

      const res = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          siteId, 
          endpoint: subscription.endpoint
        })
      });
      const data = await res.json();
      handleResult(data);
    } catch (error) {
      handleResult({ error: error.message });
    }
  };

  // Enviar notificación
  const sendNotification = async () => {
    try {
      if (!siteId) {
        handleResult({ error: 'Selecciona un ID de sitio' });
        return;
      }

      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          siteId, 
          title: notificationTitle,
          body: notificationBody,
          url: notificationUrl,
          icon: '/icon-192.png'
        })
      });
      const data = await res.json();
      handleResult(data);
    } catch (error) {
      handleResult({ error: error.message });
    }
  };

  // Probar endpoint personalizado
  const testCustomEndpoint = async () => {
    try {
      if (!testEndpoint) {
        handleResult({ error: 'Ingresa un endpoint para probar' });
        return;
      }
      
      const res = await fetch(testEndpoint);
      const data = await res.json();
      handleResult(data);
    } catch (error) {
      handleResult({ error: error.message });
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6">PushSaaS API Test</h1>
      
      {/* Pestañas */}
      <div className="flex mb-4 border-b">
        <button 
          className={`py-2 px-4 ${activeTab === 'sites' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
          onClick={() => setActiveTab('sites')}>
          Sitios
        </button>
        <button 
          className={`py-2 px-4 ${activeTab === 'push' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
          onClick={() => setActiveTab('push')}>
          Notificaciones Push
        </button>
        <button 
          className={`py-2 px-4 ${activeTab === 'custom' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
          onClick={() => setActiveTab('custom')}>
          Endpoints Personalizados
        </button>
      </div>

      {/* Selección de sitio (común para todas las pestañas) */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Sitio Seleccionado</h2>
        <div className="flex flex-wrap gap-2">
          <select 
            className="border rounded p-2 flex-1"
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}>
            <option value="">Selecciona un sitio</option>
            {sites.map(site => (
              <option key={site.site_id} value={site.site_id}>
                {site.site_name} ({site.site_id})
              </option>
            ))}
          </select>
          <button 
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            onClick={fetchSites}>
            Cargar Sitios
          </button>
        </div>
      </div>

      {/* Contenido según la pestaña */}
      {activeTab === 'sites' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Panel izquierdo - Crear/Actualizar Sitio */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Crear/Actualizar Sitio</h2>
            
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Sitio</label>
                <input 
                  type="text" 
                  className="border w-full p-2 rounded"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="Mi Sitio Web" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL del Sitio</label>
                <input 
                  type="text" 
                  className="border w-full p-2 rounded"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  placeholder="https://ejemplo.com" 
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button 
                className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
                onClick={createSite}>
                Crear Sitio
              </button>
              <button 
                className="bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600"
                onClick={updateSite}>
                Actualizar Sitio
              </button>
              <button 
                className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
                onClick={deactivateSite}>
                Desactivar Sitio
              </button>
              <button 
                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                onClick={() => getSiteDetails(siteId)}>
                Ver Detalles
              </button>
            </div>
          </div>

          {/* Panel derecho - Visualización de sitios */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Sitios Disponibles</h2>
            <div className="overflow-auto max-h-64">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-2 px-3 text-left">ID</th>
                    <th className="py-2 px-3 text-left">Nombre</th>
                    <th className="py-2 px-3 text-left">URL</th>
                    <th className="py-2 px-3 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sites.map(site => (
                    <tr key={site.site_id} className="border-t">
                      <td className="py-2 px-3">{site.site_id}</td>
                      <td className="py-2 px-3">{site.site_name}</td>
                      <td className="py-2 px-3">{site.site_url}</td>
                      <td className="py-2 px-3">
                        <button 
                          className="text-blue-500 hover:underline"
                          onClick={() => {
                            setSiteId(site.site_id);
                            getSiteDetails(site.site_id);
                          }}>
                          Seleccionar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'push' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Panel izquierdo - Suscripción */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Suscripción Push</h2>
            
            <div className="mb-4">
              <button 
                className="bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600 w-full mb-3"
                onClick={requestNotificationPermission}>
                Solicitar Permiso de Notificaciones
              </button>
              
              <div className="space-y-3">
                <button 
                  className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 w-full"
                  onClick={subscribeToPush}
                  disabled={!subscription}>
                  Suscribirse
                </button>
                
                <button 
                  className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 w-full"
                  onClick={unsubscribe}
                  disabled={!subscription}>
                  Cancelar Suscripción
                </button>
              </div>
            </div>
            
            {subscription && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Suscripción Actual:</h3>
                <div className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                  <pre>{JSON.stringify(subscription, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
          
          {/* Panel derecho - Envío de Notificaciones */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Enviar Notificación</h2>
            
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input 
                  type="text" 
                  className="border w-full p-2 rounded"
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cuerpo</label>
                <textarea 
                  className="border w-full p-2 rounded"
                  value={notificationBody}
                  onChange={(e) => setNotificationBody(e.target.value)}
                  rows="3"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL de destino</label>
                <input 
                  type="text" 
                  className="border w-full p-2 rounded"
                  value={notificationUrl}
                  onChange={(e) => setNotificationUrl(e.target.value)}
                />
              </div>
            </div>
            
            <button 
              className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
              onClick={sendNotification}>
              Enviar Notificación
            </button>
          </div>
        </div>
      )}
      
      {activeTab === 'custom' && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Probar Endpoint Personalizado</h2>
          
          <div className="mb-4">
            <input 
              type="text" 
              className="border w-full p-2 rounded"
              value={testEndpoint}
              onChange={(e) => setTestEndpoint(e.target.value)}
              placeholder="/api/notifications/delivered" 
            />
          </div>
          
          <button 
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            onClick={testCustomEndpoint}>
            Probar Endpoint
          </button>
        </div>
      )}
      
      {/* Sección de resultados */}
      <div className="mt-6 bg-gray-50 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Resultado de la Operación</h2>
        <div className="bg-gray-100 p-3 rounded overflow-auto max-h-96">
          <pre className="text-sm">{resultJson || 'Sin resultados aún'}</pre>
        </div>
      </div>
    </div>
  );
}
