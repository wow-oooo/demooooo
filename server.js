const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

// Use environment variables for sensitive data
const ADMIN_USER = {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'secret'
};

// Database connection (example)
const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/beardo';

// store full queue entries on the server for demo purposes
const fs = require('fs');
const QUEUE_FILE = path.join(__dirname, 'queue.json');

let queueEntries = [];
let queueUpdatedAt = new Date();

// bookings share same structure as queueEntries but have status
// we will treat queueEntries as pending bookings; accepted/rejected stored here as well
// status: pending/accepted/rejected/cancelled

// sales records for admin management
let sales = [];
const SALES_FILE = path.join(__dirname, 'sales.json');

// notifications (messages to clients when bookings change or someone leaves queue)
let notifications = [];
const NOTIF_FILE = path.join(__dirname, 'notifications.json');

// site content (price, timing, contact etc.)
let siteContent = { price: '', timing: '', contact: '' };
const SITE_FILE = path.join(__dirname, 'site.json');

// coupons
let coupons = [];
const COUPONS_FILE = path.join(__dirname, 'coupons.json');

// additional admin data sets
let services = [];
const SERVICES_FILE = path.join(__dirname, 'services.json');

let barbers = [];
const BARBERS_FILE = path.join(__dirname, 'barbers.json');

let gallery = [];
const GALLERY_FILE = path.join(__dirname, 'gallery.json');

// load persisted sales if available
try {
  const salesData = fs.readFileSync(SALES_FILE, 'utf-8');
  const parsed = JSON.parse(salesData);
  if (Array.isArray(parsed)) {
    sales = parsed;
  }
} catch (err) {
  // ignore
}
// load coupons
try {
  const cdata = fs.readFileSync(COUPONS_FILE, 'utf-8');
  coupons = JSON.parse(cdata) || [];
} catch {}
// load site content
try {
  const sc = fs.readFileSync(SITE_FILE, 'utf-8');
  const parsed = JSON.parse(sc);
  if (parsed && typeof parsed === 'object') siteContent = parsed;
} catch {}
// load other persisted data
[ {arr: services, file: SERVICES_FILE}, {arr: barbers, file: BARBERS_FILE}, {arr: gallery, file: GALLERY_FILE} ].forEach(({arr,file}) => {
  try {
    const d = fs.readFileSync(file, 'utf-8');
    const parsed = JSON.parse(d);
    if (Array.isArray(parsed)) {
      arr.push(...parsed);
    }
  } catch {};
});

function persistSales() {
  fs.writeFile(SALES_FILE, JSON.stringify(sales, null, 2), err => {
    if (err) console.error('failed to save sales file', err);
  });
}
function persistServices() {
  fs.writeFile(SERVICES_FILE, JSON.stringify(services, null, 2), err => {
    if (err) console.error('failed to save services file', err);
  });
}
function persistBarbers() {
  fs.writeFile(BARBERS_FILE, JSON.stringify(barbers, null, 2), err => {
    if (err) console.error('failed to save barbers file', err);
  });
}
function persistGallery() {
  fs.writeFile(GALLERY_FILE, JSON.stringify(gallery, null, 2), err => {
    if (err) console.error('failed to save gallery file', err);
  });
}
function persistCoupons() {
  fs.writeFile(COUPONS_FILE, JSON.stringify(coupons, null, 2), err => {
    if (err) console.error('failed to save coupons file', err);
  });
}
function persistSite() {
  fs.writeFile(SITE_FILE, JSON.stringify(siteContent, null, 2), err => {
    if (err) console.error('failed to save site content', err);
  });
}

function persistNotifications() {
  fs.writeFile(NOTIF_FILE, JSON.stringify(notifications, null, 2), err => {
    if (err) console.error('failed to save notifications file', err);
  });
}

function sendNotification(phone, message) {
  if (!phone) return;
  const notif = { phone, message, timestamp: new Date() };
  notifications.push(notif);
  persistNotifications();
}

// load persisted notifications if any
try {
  const ndata = fs.readFileSync(NOTIF_FILE, 'utf-8');
  const parsed = JSON.parse(ndata);
  if (Array.isArray(parsed)) notifications = parsed;
} catch (e) {
  // ignore
}

// attempt to load persisted queue from disk
try {
  const data = fs.readFileSync(QUEUE_FILE, 'utf-8');
  const parsed = JSON.parse(data);
  if (Array.isArray(parsed.entries)) {
    queueEntries = parsed.entries;
  }
  if (parsed.updatedAt) {
    queueUpdatedAt = new Date(parsed.updatedAt);
  }
} catch (err) {
  // ignore missing or malformed file
}

function persistQueue() {
  const payload = {
    entries: queueEntries,
    updatedAt: queueUpdatedAt.toISOString(),
  };
  fs.writeFile(QUEUE_FILE, JSON.stringify(payload, null, 2), err => {
    if (err) console.error('failed to save queue file', err);
  });
}

// middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // parse JSON bodies for API endpoints
app.use(
  session({
    secret: 'beardo‑secret',
    resave: false,
    saveUninitialized: false,
  })
);

// serve static files from the project root (index.html, script.js, etc.)
app.use(express.static(path.join(__dirname, '.')));

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    next();
  } else {
    res.redirect('/admin/login');
  }
}

// --- public API routes ---------------------------------------------------
// return full queue information (count + entries + updatedAt)
app.get('/api/queue', (req, res) => {
  res.json({
    count: queueEntries.length,
    entries: queueEntries,
    updatedAt: queueUpdatedAt,
  });
});

// add a new entry to the queue/booking list (called from booking UI)
app.post('/api/queue', (req, res) => {
  const entry = req.body;
  if (entry && entry.name) {
    entry.id = entry.id || Math.random().toString(36).substr(2, 9);
    entry.timestamp = entry.timestamp || new Date();
    entry.status = 'pending';
    queueEntries.push(entry);
    queueUpdatedAt = new Date();
    persistQueue();
    // notify client of successful booking
    if (entry.phone) {
      sendNotification(entry.phone, `Your booking is confirmed for ${entry.date||''} ${entry.time||''}.`);
    }
  }
  res.json({ count: queueEntries.length });
});

// simple notification endpoint for clients; supply ?phone= to filter
app.get('/api/notifications', (req, res) => {
  const phone = req.query.phone;
  if (phone) {
    res.json({ notifications: notifications.filter(n => n.phone === phone) });
  } else {
    res.json({ notifications });
  }
});

// accept/reject/cancel booking
app.post('/admin/api/booking/update', requireAdmin, (req, res) => {
  const { id, status, date, time } = req.body;
  const idx = queueEntries.findIndex(b => b.id === id);
  if (idx !== -1) {
    const booking = queueEntries[idx];
    if (status && ['accepted','rejected','cancelled'].includes(status)) {
      booking.status = status;
    }
    // rescheduling (date/time change)
    let rescheduled = false;
    if (date !== undefined && date !== booking.date) {
      booking.date = date;
      rescheduled = true;
    }
    if (time !== undefined && time !== booking.time) {
      booking.time = time;
      rescheduled = true;
    }
    if (rescheduled && booking.phone) {
      sendNotification(booking.phone, `Your appointment has been rescheduled to ${booking.date || ''} ${booking.time || ''}. Please check the website.`);
    }
    queueUpdatedAt = new Date();
    persistQueue();
  }
  res.json({ entries: queueEntries });
});

// accept/reject/cancel booking
app.post('/admin/api/booking/update', requireAdmin, (req, res) => {
  const { id, status } = req.body;
  const idx = queueEntries.findIndex(b => b.id === id);
  if (idx !== -1 && ['accepted','rejected','cancelled'].includes(status)) {
    queueEntries[idx].status = status;
    queueUpdatedAt = new Date();
    persistQueue();
  }
  res.json({ entries: queueEntries });
});

// customer list is just the bookings array exposed
app.get('/admin/api/customers', requireAdmin, (req, res) => {
  res.json({ customers: queueEntries });
});

// --- admin authentication ------------------------------------------------
app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'login.html'));
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (
    username === ADMIN_USER.username &&
    password === ADMIN_USER.password
  ) {
    req.session.isAdmin = true;
    res.redirect('/admin/dashboard');
  } else {
    res.send('Invalid credentials. <a href="/admin/login">Try again</a>');
  }
});

// expose a protected version of the queue API for admin UI (optional)
app.get('/admin/api/queue', requireAdmin, (req, res) => {
  res.json({
    count: queueEntries.length,
    entries: queueEntries,
    updatedAt: queueUpdatedAt,
  });
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// protect anything under /admin other than login/logout
app.use('/admin', requireAdmin);

app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'dashboard.html'));
});

app.get('/admin/update-queue', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'update-queue.html'));
});

app.get('/admin/sales', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'sales.html'));
});

app.get('/admin/bookings', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'bookings.html'));
});
app.get('/admin/customers', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'customers.html'));
});
app.get('/admin/coupons', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'coupons.html'));
});
app.get('/admin/site', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'site.html'));
});

app.get('/admin/services', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'services.html'));
});

app.get('/admin/barbers', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'barbers.html'));
});

app.get('/admin/gallery', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'gallery.html'));
});

app.get('/admin/notifications', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'notifications.html'));
});

// administrative modifications to the queue
app.post('/admin/queue/remove', (req, res) => {
  const { id } = req.body;
  if (id) {
    const removed = queueEntries.find(e => e.id === id);
    queueEntries = queueEntries.filter(e => e.id !== id);
    queueUpdatedAt = new Date();
    persistQueue();
    if (removed && removed.phone) {
      sendNotification(removed.phone, 'You have been removed from the queue.');
    }
    // notify remaining customers that a spot opened up
    queueEntries.forEach(e => {
      if (e.phone) {
        sendNotification(e.phone, 'A spot opened in the queue; please check the website for updated status.');
      }
    });
  }
  res.json({ count: queueEntries.length });
});

// generic helpers for array endpoints
function makeAdminArrayRoutes(name, arr, persistFn) {
  app.get(`/admin/api/${name}`, requireAdmin, (req, res) => res.json({ [name]: arr }));
  app.post(`/admin/api/${name}`, requireAdmin, (req, res) => {
    const entry = req.body;
    if (entry) {
      entry.id = entry.id || Math.random().toString(36).substr(2, 9);
      entry.timestamp = new Date();
      arr.push(entry);
      persistFn();
      res.json({ success: true, [name]: arr });
    } else {
      res.status(400).json({ success: false });
    }
  });
  app.post(`/admin/api/${name}/remove`, requireAdmin, (req, res) => {
    const { id } = req.body;
    if (id) {
      arr = arr.filter(e => e.id !== id);
      persistFn();
    }
    res.json({ [name]: arr });
  });
}

// sales management APIs (admin only)
makeAdminArrayRoutes('sales', sales, persistSales);
makeAdminArrayRoutes('services', services, persistServices);
makeAdminArrayRoutes('barbers', barbers, persistBarbers);
makeAdminArrayRoutes('gallery', gallery, persistGallery);
makeAdminArrayRoutes('coupons', coupons, persistCoupons);

// allow admin to inspect notifications
app.get('/admin/api/notifications', requireAdmin, (req, res) => {
  res.json({ notifications });
});

// site content endpoints
app.get('/admin/api/site', requireAdmin, (req, res) => {
  res.json(siteContent);
});
app.post('/admin/api/site', requireAdmin, (req, res) => {
  Object.assign(siteContent, req.body);
  persistSite();
  res.json(siteContent);
});

// for compatibility we keep the old count update route but it now overrides queue length
app.post('/admin/queue', (req, res) => {
  // done for backward compatibility; not used by updated UI
  const num = Number(req.body.count);
  if (!Number.isNaN(num) && num >= 0) {
    // truncate or pad queueEntries to match count
    while (queueEntries.length > num) queueEntries.pop();
    while (queueEntries.length < num) queueEntries.push({ id: Math.random().toString(36).substr(2,9), name: 'Placeholder' });
    queueUpdatedAt = new Date();
    persistQueue();
  }
  res.redirect('/admin/dashboard');
});

// catch-all route (optional)
app.use((req, res) => {
  res.status(404).send('Not found');
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
