-- Script para restaurar sitios al usuario info@webcoders.es

-- Verificamos si la tabla de backup existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_name = 'sites_backup'
) as backup_exists;

-- Verificamos cuántos sitios hay actualmente para el usuario info@webcoders.es
SELECT COUNT(*) AS current_webcoders_sites 
FROM sites 
WHERE user_id = 'info@webcoders.es';

-- Si existe la tabla de backup, obtenemos información de los sitios que pertenecían a info@webcoders.es
SELECT id, site_id, user_id, name, url 
FROM sites_backup 
WHERE user_id = 'info@webcoders.es';

-- Restauramos los sitios que pertenecían a info@webcoders.es desde el backup
-- Solo para los sitios que aún existen en la tabla actual
UPDATE sites
SET user_id = 'info@webcoders.es',
    updated_at = NOW()
FROM sites_backup
WHERE sites.site_id = sites_backup.site_id
AND sites_backup.user_id = 'info@webcoders.es';

-- Si no hay backup o no había sitios de info@webcoders.es, asigna al menos algunos sitios
-- Esta parte es para asignar manualmente sitios si no hay un backup
-- Puedes modificar los site_id según tus necesidades
UPDATE sites
SET user_id = 'info@webcoders.es',
    updated_at = NOW()
WHERE site_id IN ('site_id_1', 'site_id_2')  -- Reemplaza con los site_id que quieras asignar
AND site_id NOT IN ('y70tplqd4an', 'c670c8bcd133');  -- No tocar estos site_id específicos

-- Verificamos el resultado
SELECT id, site_id, user_id, name, url 
FROM sites 
WHERE user_id = 'info@webcoders.es';

-- Verificamos que los sitios y70tplqd4an y c670c8bcd133 siguen asociados al usuario correcto
SELECT id, site_id, user_id, name, url 
FROM sites 
WHERE site_id IN ('y70tplqd4an', 'c670c8bcd133');
