const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../.data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let db;
function load() {
  try {
    if (fs.existsSync(DB_FILE)) {
      db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } else {
      db = {};
    }
  } catch {
    db = {};
  }
}

function save() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

load();

const defaultTables = ['users','riders','categories','services','orders','payments',
  'coupons','user_coupons','distributors','commission_logs','merchants','staff',
  'dispatch_records','announcements','banners','faqs'];
for (const t of defaultTables) {
  if (!Array.isArray(db[t])) db[t] = [];
}

// Find record by field value
function getByField(table, field, value) { return (db[table] || []).find(r => r[field] == value); }

// Get all records with optional filters
function getAll(table, opts = {}) {
  let list = [...(db[table] || [])];
  
  // Apply exact matches on WHERE
  if (opts.where) {
    for (const [k, v] of Object.entries(opts.where)) {
      if (v instanceof Array) {
        list = list.filter(r => v.includes(r[k]));
      } else {
        list = list.filter(r => String(r[k]) === String(v));
      }
    }
  }
  
  // ORDER BY
  if (opts.orderBy) {
    const { col, dir = 'DESC' } = opts.orderBy;
    list.sort((a, b) => {
      const va = a[col] ?? '';
      const vb = b[col] ?? '';
      if (typeof va === 'number') return dir === 'DESC' ? (vb - va) : (va - vb);
      return dir === 'DESC' ? String(vb).localeCompare(String(va)) : String(va).localeCompare(String(vb));
    });
  }
  
  // LIMIT
  if (opts.limit && list.length > opts.limit) {
    list = list.slice(0, opts.limit);
  }
  
  return list;
}

// Insert record - auto ID
function insert(table, row) {
  if (!Array.isArray(db[table])) db[table] = [];
  const maxId = db[table].reduce((m, r) => Math.max(m, r.id || 0), 0);
  const now = new Date().toISOString().split('T')[0];
  const record = { id: maxId + 1, ...row };
  if (!record.created_at) record.created_at = now;
  if (!record.updated_at) record.updated_at = now;
  db[table].push(record);
  save();
  return record;
}

// Update by ID - only update provided fields, skip null/undefined
function updateById(table, id, data) {
  if (!Array.isArray(db[table])) return 0;
  const items = [...db[table]];
  const idx = items.findIndex(r => r.id === id);
  if (idx < 0) return 0;
  
  for (const [k, v] of Object.entries(data)) {
    if (v !== null && v !== undefined && v !== '') {
      items[idx][k] = v;
    }
  }
  items[idx].updated_at = new Date().toISOString().split('T')[0];
  
  db[table] = items;
  save();
  return 1;
}

// Update where condition matches
function updateWhere(table, whereCondition, data) {
  if (!Array.isArray(db[table])) return 0;
  const items = [...db[table]];
  let changed = 0;
  
  for (const item of items) {
    let match = true;
    for (const [k, v] of Object.entries(whereCondition)) {
      if (item[k] != v) { match = false; break; }
    }
    if (match) {
      for (const [k, v] of Object.entries(data)) {
        if (v !== null && v !== undefined && v !== '') {
          item[k] = v;
        }
      }
      item.updated_at = new Date().toISOString().split('T')[0];
      changed++;
    }
  }
  
  if (changed > 0) {
    db[table] = items;
    save();
  }
  return changed;
}

// Count records
function count(table, whereCondition = {}) {
  let list = db[table] || [];
  if (Object.keys(whereCondition).length > 0) {
    for (const [k, v] of Object.entries(whereCondition)) {
      list = list.filter(r => r[k] == v);
    }
  }
  return list.length;
}

module.exports = { 
  get: table => db[table] || [],
  getById: (table, id) => getByField(table, 'id', id),
  getByField, 
  getAll, 
  insert, 
  updateById, 
  updateWhere, 
  count,
  load, save, db 
};
