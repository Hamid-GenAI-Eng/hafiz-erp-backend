const fs = require("fs");
const path = require("path");

const filePath = path.resolve("C:/My working/HamidTech_Ventures/Clients/Hafiz Building Materials and Kitchen-bath accessories/Hafiz building material backend/src/services/DiaryService.ts");
let content = fs.readFileSync(filePath, "utf8");

content = content.replace(/date: data\.date,\s*time: new Date\(\)\.toTimeString\(\)\.slice\(0, 5\),/g, "date: data.date,");
content = content.replace(/date: data\.date \|\| existing\.date,\s*time: new Date\(\)\.toTimeString\(\)\.slice\(0, 5\),/g, "date: data.date || existing.date,");
content = content.replace(/date: d\.toISOString\(\)\.split\("T"\)\[0\],\s*time: d\.toTimeString\(\)\.slice\(0, 5\),\s*type: "income",\s*amount: loader\.fee/g, 'date: d.toISOString().split("T")[0],\n                  type: "income",\n                  amount: loader.fee');

fs.writeFileSync(filePath, content);
console.log("Successfully removed time fields");
