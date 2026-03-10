const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

async function fetchOrg() {
  const { data, error } = await supabase.from('organizations').select('id').limit(1);
  if (error) console.error(error);
  else console.log("FETCHED_ORG_ID:", data[0]?.id);
}

fetchOrg();
