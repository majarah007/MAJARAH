const proxyHandler = require('../api/proxy.js');

async function testProxy() {
  const req = {
    method: 'GET',
    query: { table: 'settings' },
    headers: {}
  };

  const res = {
    statusCode: 200,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      console.log(`STATUS: ${this.statusCode}`);
      console.log('HEADERS:', this.headers);
      console.log('JSON RESPONSE:', JSON.stringify(data, null, 2));
    },
    send(data) {
      console.log(`STATUS: ${this.statusCode}`);
      console.log('HEADERS:', this.headers);
      console.log('SEND RESPONSE:', data);
    },
    end() {
      console.log(`STATUS: ${this.statusCode} (ended)`);
    }
  };

  try {
    await proxyHandler(req, res);
  } catch (err) {
    console.error('Error running proxy handler:', err);
  }
}

testProxy();
