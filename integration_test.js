const http = require('http');

function testLogin(retries = 5) {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    if (res.statusCode === 200) {
      console.log('Login test passed!');
      process.exit(0);
    } else {
      if (retries > 0) {
        console.log(`Login test failed: ${res.statusCode}. Retrying... (${retries} left)`);
        setTimeout(() => testLogin(retries - 1), 1000);
      } else {
        console.log('Login test failed after retries: ', res.statusCode);
        process.exit(1);
      }
    }
  });

  req.on('error', (err) => {
    if (retries > 0) {
      console.log(`Connection failed. Retrying... (${retries} left)`);
      setTimeout(() => testLogin(retries - 1), 1000);
    } else {
      console.error('Connection failed after retries', err);
      process.exit(1);
    }
  });

  req.write(JSON.stringify({ email: 'test', password: '123456' }));
  req.end();
}

testLogin();
