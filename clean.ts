import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clean() {
  console.log('Cleaning empty submissions...');
  // Delete all vendor submissions where quoted_amount is null
  const { data, error } = await supabase
    .from('work_order_vendor_submissions')
    .delete()
    .is('quoted_amount', null);

  if (error) {
    console.error('Error cleaning submissions:', error);
  } else {
    console.log('Successfully cleaned submissions');
  }
}

clean();
