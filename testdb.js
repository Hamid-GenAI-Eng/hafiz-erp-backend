const db = require('better-sqlite3')('sqlite.db'); console.log(db.prepare('SELECT id, status FROM diary WHERE status != \'ledgered\'').all());
