import { createDispatcher } from '../server/_lib/dispatch.js';
import doctors from '../server/doctors.js';
import appointments from '../server/appointments.js';
import appointmentById from '../server/appointments/[id].js';

export default createDispatcher([
  { methods: ['GET'], pattern: /^\/api\/doctors$/, handler: doctors },
  { methods: ['GET', 'POST'], pattern: /^\/api\/appointments$/, handler: appointments },
  { methods: ['PATCH'], pattern: /^\/api\/appointments\/([^/]+)$/, handler: appointmentById, param: 'id' },
]);
