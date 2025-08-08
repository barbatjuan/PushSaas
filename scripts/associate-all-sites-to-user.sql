-- Script para asociar todos los sitios al usuario 8f81263a-b753-4c62-a504-14dee864c957

-- Primero hacemos una copia de seguridad de la tabla sites para mayor seguridad
-- Si prefieres no hacer backup, puedes comentar estas líneas
CREATE TABLE IF NOT EXISTS sites_backup AS SELECT * FROM sites;

-- Verificamos cuántos sitios existen en total
SELECT COUNT(*) AS total_sites FROM sites;

-- Verificamos cuántos sitios ya están asociados a este usuario
SELECT COUNT(*) AS already_associated_sites 
FROM sites 
WHERE user_id = 'usuario8f81263a-b753-4c62-a504-14dee864c957';

-- Listamos los sitios que vamos a modificar (todos los que no están ya asociados al usuario)
SELECT id, site_id, user_id, name, url 
FROM sites 
WHERE user_id != 'usuario8f81263a-b753-4c62-a504-14dee864c957' OR user_id IS NULL;

-- Actualizamos todos los sitios para asociarlos al usuario especificado
UPDATE sites 
SET 
  user_id = 'usuario8f81263a-b753-4c62-a504-14dee864c957', 
  updated_at = NOW()
WHERE user_id != 'usuario8f81263a-b753-4c62-a504-14dee864c957' OR user_id IS NULL;

-- Verificamos el resultado final
SELECT id, site_id, user_id, name, url, status, subscriber_count
FROM sites 
ORDER BY updated_at DESC;

-- Verificamos que todos los sitios ahora pertenecen al usuario correcto
SELECT COUNT(*) AS total_sites_after_update FROM sites;
SELECT COUNT(*) AS correctly_associated_sites 
FROM sites 
WHERE user_id = 'usuario8f81263a-b753-4c62-a504-14dee864c957';

-- Si todo está correcto, deberías ver que total_sites_after_update = correctly_associated_sites
