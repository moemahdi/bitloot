const axios = require('axios');
const fs = require('fs');

async function getNOWPaymentsCurrencies() {
  try {
    console.log('🔍 Fetching currencies from NOWPayments Sandbox API...\n');
    
    const response = await axios.get('https://api-sandbox.nowpayments.io/v1/currencies', {
      headers: {
        'x-api-key': 'QSAM7T1-71V4MDM-K0TGPWK-65PRC6D',
        'Accept': 'application/json',
      },
    });

    const currencies = response.data.currencies;
    
    console.log('✅ Total Supported Cryptocurrencies:', currencies.length);
    console.log('\n📊 First 50 Currencies:\n');
    
    // Display first 50 in a nice format
    currencies.slice(0, 50).forEach((curr, index) => {
      console.log(`${(index + 1).toString().padStart(2, ' ')}. ${curr.toUpperCase().padEnd(15, ' ')}`);
    });
    
    console.log('\n...(showing first 50 of', currencies.length, 'total currencies)\n');
    
    // Save full list to file
    fs.writeFileSync('./nowpayments-currencies-full.json', JSON.stringify({ currencies }, null, 2));
    console.log('💾 Full list saved to: nowpayments-currencies-full.json\n');
    
    // Group by type (approximate based on common patterns)
    const stablecoins = currencies.filter(c => 
      c.includes('usdt') || c.includes('usdc') || c.includes('dai') || c.includes('busd')
    );
    const btc = currencies.filter(c => c === 'btc' || c.includes('btc'));
    const eth = currencies.filter(c => c === 'eth' || c.includes('eth'));
    
    console.log('📈 Summary:');
    console.log(`   - Bitcoin variants: ${btc.length}`);
    console.log(`   - Ethereum variants: ${eth.length}`);
    console.log(`   - Stablecoins: ${stablecoins.length}`);
    console.log(`   - Other cryptocurrencies: ${currencies.length - btc.length - eth.length - stablecoins.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

getNOWPaymentsCurrencies();
