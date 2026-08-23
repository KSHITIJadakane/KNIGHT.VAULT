import https from 'https';

const contractAddress = 'dd9c5ee171fbb3516cd2d3038b6a3f8d3b9fc1508789f30074697f69844ea1ad';

const query = JSON.stringify({
  query: `query VerifyContract($address: HexEncoded!) {
    contractAction(address: $address) {
      state
      zswapState
    }
  }`,
  variables: { address: contractAddress },
});

const options = {
  hostname: 'indexer.preprod.midnight.network',
  path: '/api/v4/graphql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'Midnight-Verifier/1.0',
    'Content-Length': Buffer.byteLength(query),
  },
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      console.log('=== MIDNIGHT NETWORK PREPROD ON-CHAIN VERIFICATION ===');
      console.log('Contract Address:', contractAddress);
      console.log('Indexer Response:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('Raw Response:', body);
    }
  });
});

req.on('error', (e) => {
  console.error('Query Error:', e.message);
});

req.write(query);
req.end();
