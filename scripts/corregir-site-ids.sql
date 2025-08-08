-- Script corregido para asignar los sitios correctamente
-- Basado en la información correcta de users_rows

-- Verificamos los usuarios actuales
SELECT id, email, clerk_id
FROM users
WHERE id IN ('8f81263a-b753-4c62-a504-14dee864c957', '5703a897-7274-4574-882d-13e04344fe00');

-- Verificamos los sitios actuales y sus usuarios
SELECT id, site_id, user_id, name, url
FROM sites;

-- 1. Corregimos los sitios que tienen el prefijo "usuario" incorrecto
UPDATE sites
SET user_id = '8f81263a-b753-4c62-a504-14dee864c957',
    updated_at = NOW()
WHERE user_id = 'usuario8f81263a-b753-4c62-a504-14dee864c957';

-- 2. Verificamos si existe el sitio c670c8bcd133
SELECT id, site_id, user_id, name, url
FROM sites 
WHERE site_id = 'c670c8bcd133';

-- 3. Insertamos el nuevo sitio c670c8bcd133 basado en y70tplqd4an (si no existe)
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
    '8f81263a-b753-4c62-a504-14dee864c957', -- ID correcto
    'Juano (Copia)', 
    'https://juanococina.uy',
    'c670c8bcd133', 
    'active', 
    0,
    NOW(), 
    NOW()
FROM sites
WHERE site_id = 'y70tplqd4an'
AND NOT EXISTS (SELECT 1 FROM sites WHERE site_id = 'c670c8bcd133');

-- 4. Si el sitio c670c8bcd133 existe pero tiene otro usuario, corregimos
UPDATE sites 
SET user_id = '8f81263a-b753-4c62-a504-14dee864c957',
    updated_at = NOW()
WHERE site_id = 'c670c8bcd133' 
AND user_id != '8f81263a-b753-4c62-a504-14dee864c957';

-- 5. Resultado final - verificamos los sitios asignados a cada usuario
SELECT u.email, s.site_id, s.name, s.url, s.status
FROM sites s
JOIN users u ON s.user_id::uuid = u.id
ORDER BY u.email, s.site_id;

-- Alternativa si la conversión no funciona
SELECT s.user_id, s.site_id, s.name, s.url, s.status
FROM sites s
ORDER BY s.user_id, s.site_id;
