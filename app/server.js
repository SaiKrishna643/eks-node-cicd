const express = require('express');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Seed data ───
let services = [
  { id: 1, name: 'user-service', status: 'healthy', uptime: 99.98, responseTime: 45 },
  { id: 2, name: 'payment-service', status: 'healthy', uptime: 99.91, responseTime: 120 },
  { id: 3, name: 'order-service', status: 'degraded', uptime: 97.5, responseTime: 890 },
  { id: 4, name: 'notification-service', status: 'healthy', uptime: 99.95, responseTime: 32 },
  { id: 5, name: 'inventory-service', status: 'healthy', uptime: 99.87, responseTime: 67 },
  { id: 6, name: 'search-service', status: 'down', uptime: 94.2, responseTime: 0 },
];
let nextId = 7;

// ─── Health & Readiness (Kubernetes probes) ───
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.get('/ready', (req, res) => {
  res.json({ status: 'ready' });
});

// ─── App info ───
app.get('/api/info', (req, res) => {
  res.json({
    app: 'DevPulse',
    version: process.env.APP_VERSION || '1.0.0',
    pod: os.hostname(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─── List all services ───
app.get('/api/services', (req, res) => {
  const healthy = services.filter(s => s.status === 'healthy').length;
  const degraded = services.filter(s => s.status === 'degraded').length;
  const down = services.filter(s => s.status === 'down').length;

  res.json({
    overall: down > 0 ? 'major outage' : degraded > 0 ? 'partial outage' : 'all systems operational',
    stats: { healthy, degraded, down, total: services.length },
    services,
    servedBy: os.hostname(),
  });
});

// ─── Get single service ───
app.get('/api/services/:id', (req, res) => {
  const svc = services.find(s => s.id === parseInt(req.params.id));
  if (!svc) return res.status(404).json({ error: 'Service not found' });
  res.json(svc);
});

// ─── Add service ───
app.post('/api/services', (req, res) => {
  const { name, status = 'healthy', uptime = 100, responseTime = 0 } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const svc = { id: nextId++, name, status, uptime, responseTime };
  services.push(svc);
  res.status(201).json(svc);
});

// ─── Update service ───
app.put('/api/services/:id', (req, res) => {
  const svc = services.find(s => s.id === parseInt(req.params.id));
  if (!svc) return res.status(404).json({ error: 'Service not found' });

  if (req.body.name) svc.name = req.body.name;
  if (req.body.status) svc.status = req.body.status;
  if (req.body.uptime !== undefined) svc.uptime = req.body.uptime;
  if (req.body.responseTime !== undefined) svc.responseTime = req.body.responseTime;

  res.json(svc);
});

// ─── Delete service ───
app.delete('/api/services/:id', (req, res) => {
  const idx = services.findIndex(s => s.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Service not found' });
  services.splice(idx, 1);
  res.json({ message: 'Deleted' });
});

// ─── Dashboard stats ───
app.get('/api/dashboard', (req, res) => {
  const healthy = services.filter(s => s.status === 'healthy').length;
  const avgUptime = (services.reduce((sum, s) => sum + s.uptime, 0) / services.length).toFixed(2);

  res.json({
    totalServices: services.length,
    healthyServices: healthy,
    avgUptime: avgUptime + '%',
    status: healthy === services.length ? 'operational' : 'issues detected',
    servedBy: os.hostname(),
  });
});

// ─── Start ───
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ DevPulse running → http://localhost:${PORT}`);
  console.log(`📦 Pod: ${os.hostname()}`);
});
