const http = require('http');

const BASE = process.env.TEST_URL || 'http://localhost:3000';

function req(path, opts = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const r = http.request(url, {
      method: opts.method || 'GET',
      headers: { 'Content-Type': 'application/json' },
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(d) }));
    });
    r.on('error', reject);
    if (opts.body) r.write(JSON.stringify(opts.body));
    r.end();
  });
}

async function run() {
  let pass = 0, fail = 0;

  function check(name, ok) {
    if (ok) { console.log(`  ✅ ${name}`); pass++; }
    else { console.log(`  ❌ ${name}`); fail++; }
  }

  console.log('\n🧪 DevPulse API Tests\n');

  // Health & Readiness
  console.log('── Health ──');
  const h = await req('/health');
  check('GET /health returns 200', h.status === 200);
  check('Status is healthy', h.body.status === 'healthy');

  const r = await req('/ready');
  check('GET /ready returns 200', r.status === 200);

  // App info
  console.log('── Info ──');
  const info = await req('/api/info');
  check('GET /api/info returns app name', info.body.app === 'DevPulse');

  // Services list
  console.log('── Services ──');
  const list = await req('/api/services');
  check('GET /api/services returns services', list.body.services.length > 0);
  check('Has stats object', list.body.stats.total > 0);
  check('Has overall status', typeof list.body.overall === 'string');
  check('Has servedBy (pod name)', typeof list.body.servedBy === 'string');

  // Create service
  const create = await req('/api/services', {
    method: 'POST',
    body: { name: 'test-service', uptime: 99.9, responseTime: 50 },
  });
  check('POST /api/services creates service', create.status === 201);
  check('Created service has name', create.body.name === 'test-service');

  // Get single
  const single = await req(`/api/services/${create.body.id}`);
  check('GET /api/services/:id works', single.body.id === create.body.id);

  // Update
  const update = await req(`/api/services/${create.body.id}`, {
    method: 'PUT',
    body: { status: 'degraded' },
  });
  check('PUT /api/services/:id updates', update.body.status === 'degraded');

  // Delete
  const del = await req(`/api/services/${create.body.id}`, { method: 'DELETE' });
  check('DELETE /api/services/:id works', del.status === 200);

  // 404
  const notFound = await req('/api/services/9999');
  check('Unknown ID returns 404', notFound.status === 404);

  // Dashboard
  console.log('── Dashboard ──');
  const dash = await req('/api/dashboard');
  check('GET /api/dashboard returns 200', dash.status === 200);
  check('Has totalServices', dash.body.totalServices > 0);

  

  console.log(`\n📊 Results: ${pass} passed, ${fail} failed\n`);
  process.exit(fail > 0 ? 1 : 0);
}

run().catch(err => { console.error('❌ Tests failed:', err.message); process.exit(1); });
