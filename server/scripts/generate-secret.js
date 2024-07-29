const crypto = require('crypto');
console.log('Use this as your SESSION_SECRET:');
console.log(crypto.randomBytes(64).toString('hex'));