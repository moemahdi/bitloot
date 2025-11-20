#!/usr/bin/env node

/**
 * Kinguin API Test Script
 * Tests authentication and product/offer endpoints
 * 
 * Usage: node scripts/test-kinguin-api.js
 */

const https = require('https');
const http = require('http');

// Load environment variables
require('dotenv').config();

const API_KEY = process.env.KINGUIN_API_KEY;
const BASE_URL = process.env.KINGUIN_BASE_URL || 'https://www.kinguin.net/api/v1';
const SALES_MANAGER_BASE = 'https://gateway.kinguin.net/sales-manager-api/api/v1';

// Color output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, label, message) {
  console.log(`${color}[${label}]${colors.reset} ${message}`);
}

function makeRequest(url, method = 'GET', headers = {}) {
  return new Promise((resolve, reject) => {
    const requestUrl = new URL(url);
    const isHttps = requestUrl.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: requestUrl.hostname,
      port: requestUrl.port,
      path: requestUrl.pathname + requestUrl.search,
      method,
      headers: {
        'User-Agent': 'BitLoot-API-Test/1.0',
        'Content-Type': 'application/json',
        ...headers,
      },
      timeout: 10000,
    };

    const req = client.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
            rawBody: data,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: null,
            rawBody: data,
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function testEndpoints() {
  log(colors.cyan, 'INFO', 'Starting Kinguin API Tests');
  log(colors.cyan, 'INFO', `API Key: ${API_KEY ? API_KEY.substring(0, 8) + '...' : 'NOT SET'}`);
  log(colors.cyan, 'INFO', `Base URL: ${BASE_URL}`);
  console.log('');

  // Test 1: Simple health check / products endpoint
  try {
    log(colors.blue, 'TEST 1', 'Testing Products Endpoint (GET /products with X-Api-Key header)');
    const url1 = `${SALES_MANAGER_BASE}/offers`;
    const response1 = await makeRequest(url1, 'GET', {
      'X-Api-Key': API_KEY,
    });

    if (response1.status === 200) {
      log(colors.green, 'PASS', `Status: ${response1.status} ✓`);
      log(colors.green, 'PASS', `Response contains: ${JSON.stringify(response1.body).substring(0, 100)}...`);
    } else if (response1.status === 401) {
      log(colors.red, 'FAIL', `Authentication Failed (401). X-Api-Key header may not be the correct auth method.`);
      log(colors.yellow, 'INFO', `Kinguin uses Bearer tokens, not direct API keys. Response: ${response1.rawBody.substring(0, 200)}`);
    } else if (response1.status === 403) {
      log(colors.red, 'FAIL', `Forbidden (403). Check if API key has correct permissions.`);
    } else {
      log(colors.yellow, 'WARN', `Status: ${response1.status}`);
      log(colors.yellow, 'WARN', `Response: ${response1.rawBody.substring(0, 200)}`);
    }
  } catch (error) {
    log(colors.red, 'ERROR', `Test 1 failed: ${error.message}`);
  }

  console.log('');

  // Test 2: Alternative endpoint with Bearer token
  try {
    log(colors.blue, 'TEST 2', 'Testing with Bearer Token (Alternative authentication)');
    const url2 = `${SALES_MANAGER_BASE}/offers`;
    const response2 = await makeRequest(url2, 'GET', {
      'Authorization': `Bearer ${API_KEY}`,
    });

    if (response2.status === 200) {
      log(colors.green, 'PASS', `Status: ${response2.status} ✓`);
      log(colors.green, 'PASS', `Bearer token authentication successful!`);
    } else if (response2.status === 401) {
      log(colors.yellow, 'WARN', `401 Unauthorized - API key format may need client ID + secret exchange`);
    } else {
      log(colors.yellow, 'WARN', `Status: ${response2.status} - ${response2.rawBody.substring(0, 150)}`);
    }
  } catch (error) {
    log(colors.red, 'ERROR', `Test 2 failed: ${error.message}`);
  }

  console.log('');

  // Test 3: Test the endpoint from your curl command
  try {
    log(colors.blue, 'TEST 3', 'Testing Original Endpoint: https://gateway.kinguin.net/esa/api/v1/products');
    const url3 = 'https://gateway.kinguin.net/esa/api/v1/products';
    const response3 = await makeRequest(url3, 'POST', {
      'X-Api-Key': API_KEY,
    });

    if (response3.status === 200 || response3.status === 201) {
      log(colors.green, 'PASS', `Status: ${response3.status} ✓`);
    } else {
      log(colors.yellow, 'WARN', `Status: ${response3.status}`);
      log(colors.yellow, 'INFO', `Response: ${response3.rawBody.substring(0, 200)}`);
    }
  } catch (error) {
    log(colors.red, 'ERROR', `Test 3 failed: ${error.message}`);
  }

  console.log('');

  // Summary
  log(colors.cyan, 'SUMMARY', 'Test Results:');
  console.log(`
  ✓ Kinguin API Gateway: https://gateway.kinguin.net/sales-manager-api
  ✓ Expected Auth: Bearer token (not X-Api-Key)
  ✓ Your API Key: ${API_KEY ? API_KEY.substring(0, 12) + '...' : 'NOT CONFIGURED'}
  
  Next Steps:
  1. Verify your Kinguin credentials are client ID + secret (not direct API key)
  2. Exchange credentials for Bearer token using /auth endpoint
  3. Use Bearer token for subsequent requests
  4. Check Kinguin docs: https://github.com/kinguin-net/api-docs
  `);
}

// Run tests
testEndpoints().catch((error) => {
  log(colors.red, 'FATAL', error.message);
  process.exit(1);
});
