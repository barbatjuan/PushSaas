// Script para asegurar que ambos site_id (y70tplqd4an y c670c8bcd133)
// estén asociados al usuario usuario8f81263a-b753-4c62-a504-14dee864c957

import { supabaseAdmin } from '../lib/db';

async function updateSiteIds() {
  console.log('Iniciando actualización de site_ids...');

  try {
    // 1. Verificamos que exista el registro con y70tplqd4an
    console.log('Verificando sitio existente (y70tplqd4an)...');
    const { data: existingSite, error: existingError } = await supabaseAdmin
      .from('sites')
      .select('id, site_id, user_id, name, url, status')
      .eq('user_id', 'usuario8f81263a-b753-4c62-a504-14dee864c957')
      .eq('site_id', 'y70tplqd4an')
      .single();

    if (existingError) {
      console.error('Error al buscar el sitio existente:', existingError);
      return;
    }

    if (!existingSite) {
      console.error('No se encontró el sitio con site_id y70tplqd4an para el usuario especificado');
      return;
    }

    console.log('Sitio encontrado:', existingSite);

    // 2. Verificamos si ya existe un sitio con site_id c670c8bcd133
    console.log('Verificando si ya existe c670c8bcd133...');
    const { data: targetSite, error: targetError } = await supabaseAdmin
      .from('sites')
      .select('id, site_id, user_id, name, url')
      .eq('site_id', 'c670c8bcd133')
      .single();

    if (targetError && targetError.code !== 'PGRST116') { // PGRST116: No se encontró el registro
      console.error('Error al buscar el sitio target:', targetError);
      return;
    }

    if (targetSite) {
      console.log('Sitio c670c8bcd133 encontrado:', targetSite);
      
      // Si existe pero tiene otro usuario, actualizamos
      if (targetSite.user_id !== 'usuario8f81263a-b753-4c62-a504-14dee864c957') {
        console.log('Actualizando usuario del sitio c670c8bcd133...');
        const { data: updateData, error: updateError } = await supabaseAdmin
          .from('sites')
          .update({ 
            user_id: 'usuario8f81263a-b753-4c62-a504-14dee864c957',
            updated_at: new Date().toISOString()
          })
          .eq('site_id', 'c670c8bcd133')
          .select();

        if (updateError) {
          console.error('Error al actualizar el usuario del sitio:', updateError);
          return;
        }

        console.log('Usuario del sitio actualizado correctamente:', updateData);
      } else {
        console.log('El sitio c670c8bcd133 ya está asociado al usuario correcto');
      }
    } else {
      // 3. Si no existe, creamos una copia del sitio existente
      console.log('Creando nueva entrada para c670c8bcd133 como copia de y70tplqd4an...');
      
      const newSite = {
        user_id: 'usuario8f81263a-b753-4c62-a504-14dee864c957',
        name: `${existingSite.name} (Copia)`,
        url: existingSite.url,
        site_id: 'c670c8bcd133',
        status: existingSite.status,
        subscriber_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: insertData, error: insertError } = await supabaseAdmin
        .from('sites')
        .insert(newSite)
        .select();

      if (insertError) {
        console.error('Error al crear el nuevo sitio:', insertError);
        return;
      }

      console.log('Nuevo sitio creado correctamente:', insertData);
    }

    // 4. Verificamos el resultado final
    console.log('\nVerificando resultado final...');
    const { data: finalSites, error: finalError } = await supabaseAdmin
      .from('sites')
      .select('id, site_id, user_id, name, url')
      .eq('user_id', 'usuario8f81263a-b753-4c62-a504-14dee864c957');

    if (finalError) {
      console.error('Error al verificar los sitios finales:', finalError);
      return;
    }

    console.log('Sitios asociados al usuario:');
    finalSites.forEach(site => {
      console.log(`- ID: ${site.id}, Site ID: ${site.site_id}, Nombre: ${site.name}, URL: ${site.url}`);
    });

    console.log('\nOperación completada con éxito.');
  } catch (error) {
    console.error('Error general:', error);
  }
}

// Ejecutar la función
updateSiteIds()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error fatal:', err);
    process.exit(1);
  });
