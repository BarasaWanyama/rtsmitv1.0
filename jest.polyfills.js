// Import required modules
import { TextDecoder, TextEncoder } from 'util';
import { Blob, File } from 'buffer';
import { fetch, Headers, FormData, Request, Response } from 'undici';

// Define properties on globalThis
Object.defineProperties(globalThis, {
  TextDecoder: { value: TextDecoder },
  TextEncoder: { value: TextEncoder },
  fetch: { value: fetch, writable: true },
  Blob: { value: Blob },
  File: { value: File },
  Headers: { value: Headers },
  FormData: { value: FormData },
  Request: { value: Request },
  Response: { value: Response }
});