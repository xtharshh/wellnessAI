import { createDispatcher } from '../server/_lib/dispatch.js';
import chat from '../server/chat.js';
import doctorChat from '../server/doctor-chat.js';
import transcribe from '../server/voice/transcribe.js';

export default createDispatcher([
  { methods: ['POST'], pattern: /^\/api\/chat$/, handler: chat },
  { methods: ['POST'], pattern: /^\/api\/doctor-chat$/, handler: doctorChat },
  { methods: ['POST'], pattern: /^\/api\/voice\/transcribe$/, handler: transcribe },
]);
