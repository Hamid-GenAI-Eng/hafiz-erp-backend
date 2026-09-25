const db = require('better-sqlite3')('prod-sqlite.db');

const addColumn = (sql) => {
  try {
    db.exec(sql);
    console.log("Success: " + sql);
  } catch (e) {
    console.log("Error running '" + sql + "': " + e.message);
  }
};

addColumn("ALTER TABLE diary ADD COLUMN outside_loader_fee real DEFAULT 0 NOT NULL;");
addColumn("ALTER TABLE diary ADD COLUMN outside_loader_name text;");
addColumn("ALTER TABLE diary ADD COLUMN outside_loader_phone text;");
addColumn("ALTER TABLE diary ADD COLUMN discount real DEFAULT 0 NOT NULL;");

console.log("Done updating prod-sqlite.db");
