-- Script para asegurar que ambos site_id (y70tplqd4an y c670c8bcd133)
-- estén asociados al usuario usuario8f81263a-b753-4c62-a504-14dee864c957

-- Primero verificamos que exista el registro
SELECT id, site_id, user_id, name, url 
FROM sites 
WHERE user_id = 'usuario8f81263a-b753-4c62-a504-14dee864c957';

-- Verificamos si existe el site_id c670c8bcd133
SELECT id, site_id, user_id, name, url 
FROM sites 
WHERE site_id = 'c670c8bcd133';

-- Si no existe el site_id c670c8bcd133, lo creamos como una copia de y70tplqd4an
INSERT INTO sites (user_id, name, url, site_id, status, subscriber_count, created_at, updated_at)
SELECT 
    'usuario8f81263a-b753-4c62-a504-14dee864c957', 
    name || ' (Copia)', 
    url, 
    'c670c8bcd133', 
    status, 
    0, -- comenzamos con 0 suscriptores 
    NOW(), 
    NOW()
FROM sites 
WHERE site_id = 'y70tplqd4an' AND user_id = 'usuario8f81263a-b753-4c62-a504-14dee864c957'
ON CONFLICT (site_id) DO NOTHING; -- Si ya existe, no hacemos nada

-- Si c670c8bcd133 existe pero tiene otro usuario, actualizamos
UPDATE sites 
SET user_id = 'usuario8f81263a-b753-4c62-a504-14dee864c957' 
WHERE site_id = 'c670c8bcd133' AND user_id != 'usuario8f81263a-b753-4c62-a504-14dee864c957';

-- Verificamos que se haya actualizado correctamente
SELECT id, site_id, user_id, name, url 
FROM sites 
WHERE user_id = 'usuario8f81263a-b753-4c62-a504-14dee864c957';
