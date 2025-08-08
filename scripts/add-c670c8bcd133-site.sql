-- Script para agregar el sitio c670c8bcd133 asociado al mismo usuario que y70tplqd4an
-- Sin afectar otros usuarios o sitios

-- Primero verificamos el sitio existente
SELECT id, site_id, user_id, name, url, subscriber_count
FROM sites 
WHERE site_id = 'y70tplqd4an';

-- Verificamos si ya existe el sitio c670c8bcd133
SELECT id, site_id, user_id, name, url, subscriber_count
FROM sites 
WHERE site_id = 'c670c8bcd133';

-- Insertamos el nuevo sitio c670c8bcd133 basado en el sitio existente y70tplqd4an
-- Solo lo insertamos si no existe ya
INSERT INTO sites (
    user_id, 
    name, 
    url, 
    site_id, 
    status, 
    subscriber_count, 
    created_at, 
    updated_at
)
SELECT 
    'usuario8f81263a-b753-4c62-a504-14dee864c957', -- Mismo usuario
    'Juano (Copia)', -- Nombre con indicador de copia
    'https://juanococina.uy', -- Misma URL
    'c670c8bcd133', -- Nuevo site_id
    'active', -- Mismo status
    0, -- Comenzamos con 0 suscriptores
    NOW(), 
    NOW()
WHERE 
    NOT EXISTS (SELECT 1 FROM sites WHERE site_id = 'c670c8bcd133');

-- Si el sitio ya existe pero tiene otro usuario, actualizamos
UPDATE sites 
SET user_id = 'usuario8f81263a-b753-4c62-a504-14dee864c957',
    updated_at = NOW()
WHERE site_id = 'c670c8bcd133' 
AND user_id != 'usuario8f81263a-b753-4c62-a504-14dee864c957';

-- Verificamos el resultado final
SELECT id, site_id, user_id, name, url, subscriber_count, status
FROM sites 
WHERE user_id = 'usuario8f81263a-b753-4c62-a504-14dee864c957';
