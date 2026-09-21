import { createDispatcher } from '../server/_lib/dispatch.js';
import recommendations from '../server/recommendations.js';
import recommendationsGenerate from '../server/recommendations/generate.js';
import recommendationById from '../server/recommendations/[id].js';
import journals from '../server/journals.js';
import journalById from '../server/journals/[id].js';
import exercises from '../server/exercises.js';
import exerciseById from '../server/exercises/[id].js';

export default createDispatcher([
  { methods: ['GET'], pattern: /^\/api\/recommendations$/, handler: recommendations },
  { methods: ['POST'], pattern: /^\/api\/recommendations\/generate$/, handler: recommendationsGenerate },
  { methods: ['PATCH', 'DELETE'], pattern: /^\/api\/recommendations\/([^/]+)$/, handler: recommendationById, param: 'id' },
  { methods: ['GET', 'POST'], pattern: /^\/api\/journals$/, handler: journals },
  { methods: ['DELETE'], pattern: /^\/api\/journals\/([^/]+)$/, handler: journalById, param: 'id' },
  { methods: ['GET', 'POST'], pattern: /^\/api\/exercises$/, handler: exercises },
  { methods: ['PATCH', 'DELETE'], pattern: /^\/api\/exercises\/([^/]+)$/, handler: exerciseById, param: 'id' },
]);
