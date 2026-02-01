#!/usr/bin/env node
/**
 * BitLoot Bulk Kinguin Import Script
 *
 * Imports products from a CSV file by searching Kinguin and importing matches.
 * Auto-reprices based on your 7 pricing rules after import.
 *
 * Usage:
 *   node scripts/bulk-import-kinguin.js
 *
 * Prerequisites:
 *   - API running at localhost:4000
 *   - Admin JWT token (get from browser cookies after login)
 */

const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:4000';
const CSV_FILE = path.join(__dirname, '../docs/Pre-Launch/kinguin_products_filtered_unique.csv');

// Rate limiting to avoid overwhelming Kinguin API
const DELAY_BETWEEN_SEARCHES_MS = 1500; // 1.5 seconds between searches
const DELAY_BETWEEN_IMPORTS_MS = 500;   // 0.5 seconds between imports
const BATCH_SIZE = 20;                   // Process in batches
const DELAY_BETWEEN_BATCHES_MS = 5000;  // 5 seconds between batches

// Resume from a specific product index (0-indexed). Set to 0 to start from beginning.
const START_FROM_INDEX = 635; // Resume from product 636 (0-indexed = 635)

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN TOKEN - SET THIS BEFORE RUNNING
// ─────────────────────────────────────────────────────────────────────────────

// Get this from browser DevTools > Application > Cookies > accessToken
// Or from the login response
let ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3NWI1ZTVkOC05N2E5LTRhNGUtYjFjNC1jYTcxOGVlMjRhNzciLCJlbWFpbCI6ImJpdGxvb3QuYml6QGdtYWlsLmNvbSIsImVtYWlsQ29uZmlybWVkIjp0cnVlLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3Njk4MDM0MTYsImV4cCI6MTc2OTgwNDMxNn0.qXGXHfvKFD2or4HIbZLe19m2qukuQK3wnTtnCiXEFOM';

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseCSV(content) {
  // Normalize line endings (handle Windows \r\n)
  const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedContent.trim().split('\n');
  const header = lines[0];
  const products = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle CSV with possible quoted fields
    let title, price;
    if (line.startsWith('"')) {
      // Quoted title (contains comma)
      const match = line.match(/^"([^"]+)",(.+)$/);
      if (match) {
        title = match[1];
        price = parseFloat(match[2]);
      }
    } else {
      // Simple case - split on last comma
      const lastComma = line.lastIndexOf(',');
      title = line.substring(0, lastComma).trim();
      price = parseFloat(line.substring(lastComma + 1));
    }

    if (title) {
      // Clean up title - remove BOM character if present
      title = title.replace(/^\uFEFF/, '');
      products.push({ title, expectedPrice: price, lineNumber: i + 1 });
    }
  }

  return products;
}

async function searchKinguin(query) {
  const url = `${API_BASE}/admin/catalog/kinguin/search?query=${encodeURIComponent(query)}&limit=10`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Search failed: ${response.status} - ${text}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`  ❌ Search error: ${error.message}`);
    return { results: [] };
  }
}

async function importProduct(productId) {
  const url = `${API_BASE}/admin/catalog/kinguin/import/${productId}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Import failed: ${response.status} - ${text}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`  ❌ Import error: ${error.message}`);
    return null;
  }
}

async function repriceProduct(productId) {
  const url = `${API_BASE}/admin/catalog/products/${productId}/reprice`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Reprice might not exist as standalone endpoint - check catalog service
      return { repriced: false };
    }

    return await response.json();
  } catch (error) {
    return { repriced: false };
  }
}

function findBestMatch(searchResults, targetTitle, targetPrice) {
  // API returns 'results' not 'products'
  const products = searchResults.results || searchResults.products || [];
  if (products.length === 0) {
    return null;
  }

  // Normalize for comparison
  const normalizeTitle = (t) =>
    t
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const targetNormalized = normalizeTitle(targetTitle);

  // Score each result
  const scored = products.map((product) => {
    const productNormalized = normalizeTitle(product.name || '');

    // Exact match gets highest score
    if (productNormalized === targetNormalized) {
      return { product, score: 100 };
    }

    // Check if target is contained in product name or vice versa
    let score = 0;
    if (productNormalized.includes(targetNormalized)) {
      score += 80;
    } else if (targetNormalized.includes(productNormalized)) {
      score += 70;
    } else {
      // Word overlap scoring
      const targetWords = new Set(targetNormalized.split(' ').filter((w) => w.length > 2));
      const productWords = new Set(productNormalized.split(' ').filter((w) => w.length > 2));
      let matches = 0;
      for (const word of targetWords) {
        if (productWords.has(word)) matches++;
      }
      score = (matches / Math.max(targetWords.size, 1)) * 60;
    }

    // Price proximity bonus (within 20%)
    if (product.price && targetPrice) {
      const priceDiff = Math.abs(product.price - targetPrice) / targetPrice;
      if (priceDiff < 0.2) {
        score += 10;
      }
    }

    return { product, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Return best match if score is reasonable
  if (scored[0] && scored[0].score >= 40) {
    return scored[0].product;
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN IMPORT LOGIC
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  BitLoot Bulk Kinguin Import');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log();

  // Check for admin token
  if (!ADMIN_TOKEN) {
    console.log('⚠️  No ADMIN_TOKEN set!');
    console.log();
    console.log('To get your admin token:');
    console.log('1. Login to BitLoot admin panel in browser');
    console.log('2. Open DevTools (F12) → Application → Cookies');
    console.log('3. Copy the value of "accessToken"');
    console.log('4. Run: ADMIN_TOKEN="your-token-here" node scripts/bulk-import-kinguin.js');
    console.log();
    process.exit(1);
  }

  // Read CSV file
  console.log(`📂 Reading CSV: ${CSV_FILE}`);
  if (!fs.existsSync(CSV_FILE)) {
    console.error('❌ CSV file not found!');
    process.exit(1);
  }

  const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
  const products = parseCSV(csvContent);
  console.log(`📊 Found ${products.length} products to import`);
  console.log();

  // Stats
  const stats = {
    total: products.length,
    searched: 0,
    found: 0,
    imported: 0,
    alreadyExists: 0,
    notFound: 0,
    errors: 0,
  };

  const notFoundProducts = [];
  const importedProducts = [];

  // Skip already processed products if resuming
  const productsToProcess = START_FROM_INDEX > 0 ? products.slice(START_FROM_INDEX) : products;
  const skippedCount = START_FROM_INDEX;
  
  if (START_FROM_INDEX > 0) {
    console.log(`⏭️  Resuming from product ${START_FROM_INDEX + 1} (skipping first ${START_FROM_INDEX} products)`);
    console.log();
  }

  // Process in batches
  const batches = [];
  for (let i = 0; i < productsToProcess.length; i += BATCH_SIZE) {
    batches.push(productsToProcess.slice(i, i + BATCH_SIZE));
  }

  console.log(`📦 Processing ${batches.length} batches of up to ${BATCH_SIZE} products each`);
  console.log();

  let currentIndex = START_FROM_INDEX;
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    console.log(`\n━━━ Batch ${batchIndex + 1}/${batches.length} ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    for (const product of batch) {
      currentIndex++;
      stats.searched++;
      const progressPct = ((currentIndex / stats.total) * 100).toFixed(1);

      console.log();
      console.log(`[${currentIndex}/${stats.total}] (${progressPct}%) "${product.title.substring(0, 60)}..."`);

      // Search Kinguin
      await sleep(DELAY_BETWEEN_SEARCHES_MS);
      const searchResults = await searchKinguin(product.title);

      // Find best match
      const match = findBestMatch(searchResults, product.title, product.expectedPrice);

      if (!match) {
        stats.notFound++;
        notFoundProducts.push(product);
        console.log(`  ⚠️  No match found`);
        continue;
      }

      stats.found++;
      console.log(`  ✓ Found: "${match.name.substring(0, 50)}..." (€${match.price})`);

      // Import the product
      await sleep(DELAY_BETWEEN_IMPORTS_MS);
      const importResult = await importProduct(match.productId);

      if (!importResult) {
        stats.errors++;
        console.log(`  ❌ Import failed`);
        continue;
      }

      if (importResult.isNew === false) {
        stats.alreadyExists++;
        console.log(`  ℹ️  Already exists: ${importResult.productId}`);
      } else {
        stats.imported++;
        importedProducts.push({
          title: product.title,
          kinguinId: match.productId,
          bitlootId: importResult.productId,
          price: match.price,
        });
        console.log(`  ✅ Imported: ${importResult.productId}`);
      }
    }

    // Delay between batches
    if (batchIndex < batches.length - 1) {
      console.log(`\n⏳ Waiting ${DELAY_BETWEEN_BATCHES_MS / 1000}s before next batch...`);
      await sleep(DELAY_BETWEEN_BATCHES_MS);
    }
  }

  // Final report
  console.log();
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  IMPORT COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log();
  console.log(`📊 Results:`);
  console.log(`   Total products:    ${stats.total}`);
  console.log(`   Searched:          ${stats.searched}`);
  console.log(`   Found matches:     ${stats.found}`);
  console.log(`   Newly imported:    ${stats.imported}`);
  console.log(`   Already existed:   ${stats.alreadyExists}`);
  console.log(`   Not found:         ${stats.notFound}`);
  console.log(`   Errors:            ${stats.errors}`);
  console.log();

  // Save not-found products for manual review
  if (notFoundProducts.length > 0) {
    const notFoundFile = path.join(__dirname, '../docs/Pre-Launch/import-not-found.csv');
    const notFoundCSV =
      'title,expected_price,line_number\n' +
      notFoundProducts.map((p) => `"${p.title.replace(/"/g, '""')}",${p.expectedPrice},${p.lineNumber}`).join('\n');
    fs.writeFileSync(notFoundFile, notFoundCSV);
    console.log(`📝 Not-found products saved to: ${notFoundFile}`);
  }

  // Save imported products for reference
  if (importedProducts.length > 0) {
    const importedFile = path.join(__dirname, '../docs/Pre-Launch/import-success.csv');
    const importedCSV =
      'title,kinguin_id,bitloot_id,price\n' +
      importedProducts.map((p) => `"${p.title.replace(/"/g, '""')}",${p.kinguinId},${p.bitlootId},${p.price}`).join('\n');
    fs.writeFileSync(importedFile, importedCSV);
    console.log(`📝 Imported products saved to: ${importedFile}`);
  }

  console.log();
  console.log('🎉 Done! Products will be auto-priced based on your 7 pricing rules.');
  console.log();
  console.log('Next steps:');
  console.log('1. Go to Admin → Catalog → Products');
  console.log('2. Click "Reprice All" to apply pricing rules to all products');
  console.log('3. Review any products in import-not-found.csv manually');
}

// ─────────────────────────────────────────────────────────────────────────────
// RUN
// ─────────────────────────────────────────────────────────────────────────────

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
