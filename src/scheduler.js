import "dotenv/config";
import cron from "node-cron";
import { maakEnVerstuurFolder } from "./index.js";

const schema = process.env.CRON_SCHEMA || "0 8 * * 1";

console.log(`Wekelijkse aanbiedingenfolder gepland: "${schema}" (cron-tijdzone van dit systeem).`);
cron.schedule(schema, () => {
  console.log(`[${new Date().toISOString()}] Wekelijkse run gestart...`);
  maakEnVerstuurFolder().catch((err) => console.error("Run mislukt:", err));
});
