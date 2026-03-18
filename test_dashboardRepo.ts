import { getDashboardData } from './src/lib/supabase/repos/dashboardRepo.js';

// Load env vars
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const orgId = '00000000-0000-0000-0000-000000000001'; // Default test org
    console.log('Testing getDashboardData...');
    const data = await getDashboardData(orgId);
    console.log('Success:', data);
  } catch (err) {
    console.error('Test script failed:', err);
  }
}
run();
