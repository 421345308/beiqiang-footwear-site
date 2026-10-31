// Read-only hash verification after restore-check.sh; never writes production.
import {createStorage} from '../storage.mjs';
const connectionString=process.env.VERIFY_DATABASE_URL;
const dataDir=process.env.VERIFY_DATA_DIR;
if (!connectionString || !dataDir) throw new Error('Set VERIFY_DATABASE_URL and VERIFY_DATA_DIR to restored copies');
const dbName=new URL(connectionString).pathname.slice(1);
if (!/^beiqiang_restore_[0-9]+_[0-9]+$/.test(dbName)) throw new Error('Verification restricted to disposable restore database');
const storage=createStorage({connectionString,dataDir,schema:'beiqiang_storage',publicOrigin:'https://restore.invalid',uploadSecret:'restore-verification-only-secret-32bytes'});
let count=0;
try {
  for await (const entry of storage.exportEntries()) { void entry; count++; }
  console.log(JSON.stringify({ok:true,objects_verified:count}));
} finally { await storage.close(); }
