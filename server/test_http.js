const http = require('http');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const token = jwt.sign({ id: '69f37ba7339b99e59e0a3f14', name: 'Admin1' }, process.env.JWT_SECRET, { expiresIn: '24h' });

http.get({
  hostname: 'localhost',
  port: 5000,
  path: '/api/dashboard',
  headers: { 'Authorization': 'Bearer ' + token }
}, r => {
  let d = '';
  r.on('data', chunk => d += chunk);
  r.on('end', () => {
    console.log(d);
  });
});
