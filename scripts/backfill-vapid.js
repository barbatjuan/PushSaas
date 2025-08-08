#!/usr/bin/env node
/*
 * Back-fill VAPID keys for existing sites that do not yet have an entry in the `vapid_keys` table.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node scripts/backfill-vapid.js
 *
 * Notes:
 *   - SUPABASE_SERVICE_KEY must be a service-role key with insert privileges on `public.vapid_keys`.
 *   - Only missing rows are inserted; existing pairs remain intact.
 */

import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const {
  SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌  SUPABASE_URL and SUPABASE_SERVICE_KEY env vars are required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

(async () => {
  console.log('🔍  Checking sites without VAPID keys…');

  // Obtain all sites
  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('id, site_id');

  if (sitesError) {
    console.error('❌  Error fetching sites:', sitesError.message);
    process.exit(1);
  }

  let inserted = 0;
  for (const s of sites) {
    const siteIdentifier = s.id; // use UUID for vapid_keys
    const { count, error: countError } = await supabase
      .from('vapid_keys')
      .select('id', { head: true, count: 'exact' })
      .eq('site_id', siteIdentifier);

    if (countError) {
      console.error('❌  Error counting vapid_keys for site', s.site_id, countError.message);
      process.exit(1);
    }

    if (count === 0) {
      const { publicKey, privateKey } = webpush.generateVAPIDKeys();
      const { error: insertError } = await supabase.from('vapid_keys').insert({
        site_id: s.id,
        public_key: publicKey,
        private_key: privateKey
      });

      if (insertError) {
        console.error('❌  Failed inserting VAPID key for site', s.site_id, insertError.message);
        process.exit(1);
      }
      inserted += 1;
      console.log(`✓  VAPID keys generated for site_id ${s.site_id}`);
    }
  }

  console.log(inserted === 0 ? '✅  All sites already have VAPID keys' : `✅  Inserted VAPID keys for ${inserted} site(s)`);
  process.exit(0);
})();
