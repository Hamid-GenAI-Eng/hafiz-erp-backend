try {
  const Database = require('better-sqlite3');
  console.log("Loaded Database", !!Database);
} catch (e) {
  console.error(e);
}
