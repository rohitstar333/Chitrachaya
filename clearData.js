import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing environment variables.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearData() {
    console.log("Clearing event_assignments...");
    const { error: err1 } = await supabase.from("event_assignments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (err1) console.error("Error clearing event_assignments:", err1);

    console.log("Clearing task_requests...");
    const { error: err2 } = await supabase.from("task_requests").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (err2) console.error("Error clearing task_requests:", err2);

    console.log("Clearing events...");
    const { error: err3 } = await supabase.from("events").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (err3) console.error("Error clearing events:", err3);

    console.log("Database cleared successfully!");
    process.exit(0);
}

clearData();
