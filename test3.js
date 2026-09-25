console.log("Starting backend...");
try {
  console.log("Loading better-sqlite3...");
  const db = require('better-sqlite3');
  console.log("Loaded better-sqlite3 successfully!");
} catch (e) {
  console.error("Failed better-sqlite3", e);
}
