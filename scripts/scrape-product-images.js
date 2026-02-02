/**
 * Script to extract all product image URLs and titles from the database
 * 
 * Usage: node scripts/scrape-product-images.js
 * Output: Creates a JSON file with all product images
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function scrapeProductImages() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Query all products with their images
    const query = `
      SELECT 
        id,
        title,
        slug,
        platform,
        "coverImageUrl",
        "coverThumbnailUrl",
        screenshots
      FROM products
      WHERE "isPublished" = true
      ORDER BY title ASC
    `;

    console.log('📊 Fetching products...');
    const result = await client.query(query);
    console.log(`✅ Found ${result.rows.length} products\n`);

    // Process and collect all images
    const productImages = [];
    let totalImages = 0;
    let coverImages = 0;
    let thumbnailImages = 0;
    let screenshotImages = 0;

    for (const row of result.rows) {
      const product = {
        id: row.id,
        title: row.title,
        slug: row.slug,
        platform: row.platform,
        images: [],
      };

      // Add cover image
      if (row.coverImageUrl) {
        product.images.push({
          type: 'cover',
          url: row.coverImageUrl,
        });
        coverImages++;
        totalImages++;
      }

      // Add cover thumbnail
      if (row.coverThumbnailUrl) {
        product.images.push({
          type: 'thumbnail',
          url: row.coverThumbnailUrl,
        });
        thumbnailImages++;
        totalImages++;
      }

      // Add screenshots
      if (row.screenshots && Array.isArray(row.screenshots)) {
        for (const screenshot of row.screenshots) {
          if (screenshot.url) {
            product.images.push({
              type: 'screenshot',
              url: screenshot.url,
            });
            screenshotImages++;
            totalImages++;
          }
          if (screenshot.thumbnail) {
            product.images.push({
              type: 'screenshot_thumbnail',
              url: screenshot.thumbnail,
            });
            screenshotImages++;
            totalImages++;
          }
        }
      }

      if (product.images.length > 0) {
        productImages.push(product);
      }
    }

    // Create output
    const output = {
      exportedAt: new Date().toISOString(),
      stats: {
        totalProducts: result.rows.length,
        productsWithImages: productImages.length,
        totalImages,
        coverImages,
        thumbnailImages,
        screenshotImages,
      },
      products: productImages,
    };

    // Write to file
    const outputPath = path.join(__dirname, '..', 'docs', 'Products', 'product-images-export.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`📁 Saved to: ${outputPath}\n`);

    // Also create a simple CSV with just URLs
    const csvLines = ['type,title,platform,url'];
    for (const product of productImages) {
      for (const img of product.images) {
        // Escape title for CSV
        const escapedTitle = `"${product.title.replace(/"/g, '""')}"`;
        csvLines.push(`${img.type},${escapedTitle},${product.platform || ''},${img.url}`);
      }
    }
    const csvPath = path.join(__dirname, '..', 'docs', 'Products', 'product-images-export.csv');
    fs.writeFileSync(csvPath, csvLines.join('\n'));
    console.log(`📁 CSV saved to: ${csvPath}\n`);

    // Print summary
    console.log('📊 Summary:');
    console.log('─'.repeat(40));
    console.log(`   Total Products:        ${result.rows.length}`);
    console.log(`   Products with Images:  ${productImages.length}`);
    console.log(`   Total Images:          ${totalImages}`);
    console.log(`   ├── Cover Images:      ${coverImages}`);
    console.log(`   ├── Thumbnails:        ${thumbnailImages}`);
    console.log(`   └── Screenshots:       ${screenshotImages}`);
    console.log('─'.repeat(40));

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed.');
  }
}

scrapeProductImages();
