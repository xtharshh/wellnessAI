import { createDispatcher } from '../server/_lib/dispatch.js';
import settings from '../server/settings.js';
import snapshots from '../server/snapshots.js';
import summary from '../server/summary.js';
import lifestyle from '../server/lifestyle.js';
import feedback from '../server/insights/feedback.js';

export default createDispatcher([
  { methods: ['GET', 'PATCH'], pattern: /^\/api\/settings$/, handler: settings },
  { methods: ['GET', 'POST'], pattern: /^\/api\/snapshots$/, handler: snapshots },
  { methods: ['GET'], pattern: /^\/api\/summary$/, handler: summary },
  { methods: ['GET', 'POST'], pattern: /^\/api\/lifestyle$/, handler: lifestyle },
  { methods: ['GET', 'POST'], pattern: /^\/api\/insights\/feedback$/, handler: feedback },
]);
