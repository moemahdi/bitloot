const API_BASE = 'http://localhost:4000';
const TOKEN = process.env.ADMIN_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3NWI1ZTVkOC05N2E5LTRhNGUtYjFjNC1jYTcxOGVlMjRhNzciLCJlbWFpbCI6ImJpdGxvb3QuYml6QGdtYWlsLmNvbSIsImVtYWlsQ29uZmlybWVkIjp0cnVlLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3Njk3OTkyMTYsImV4cCI6MTc2OTgwMDExNn0.ljuNAMFh3ebPm0krBjV7yr99XxPUmDwX8hXl-a2suvQ';

const testProducts = [
  'Celeste PC Steam CD Key',
  'Stray PC Steam CD Key',
  'Hollow Knight PC Steam CD Key',
  'Terraria PC Steam CD Key',
  'RimWorld Steam CD Key'
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function searchKinguin(query) {
  const url = `${API_BASE}/admin/catalog/kinguin/search?query=${encodeURIComponent(query)}&limit=5`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
  return res.json();
}

async function importProduct(productId) {
  const url = `${API_BASE}/admin/catalog/kinguin/import/${productId}`;
  const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}` } });
  return res.json();
}

async function test() {
  console.log('=== TEST IMPORT: 5 Products ===\n');
  
  for (const title of testProducts) {
    console.log(`Searching: ${title.substring(0, 40)}...`);
    
    await sleep(1000);
    const search = await searchKinguin(title);
    
    if (!search.results || search.results.length === 0) {
      console.log('  ❌ Not found\n');
      continue;
    }
    
    // Find exact or best match
    let match = search.results.find(r => r.name.toLowerCase() === title.toLowerCase());
    if (!match) match = search.results[0];
    
    console.log(`  Found: ${match.name} (EUR ${match.price})`);
    
    // Import
    await sleep(500);
    const result = await importProduct(match.productId);
    
    if (result.isNew === false) {
      console.log('  ℹ️  Already exists\n');
    } else if (result.productId) {
      console.log(`  ✅ Imported: ${result.productId}\n`);
    } else {
      console.log(`  ❌ Import failed: ${result.message || 'unknown error'}\n`);
    }
  }
  
  console.log('=== TEST COMPLETE ===');
}

test().catch(e => console.error('Error:', e.message));
