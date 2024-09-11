import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Suppress console.log and console.error during tests
const originalLog = console.log;
const originalError = console.error;

console.log = (...args) => {
  // Uncomment the next line if you want to see console.log output during tests
  // originalLog(...args);
};

console.error = (...args) => {
  // Uncomment the next line if you want to see console.error output during tests
  // originalError(...args);
};