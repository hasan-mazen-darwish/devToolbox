import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config()

const supabase = createClient("https://ejkqmuuscripvrrcnclr.supabase.co", process.env.SUPABASE_SERVICE_KEY!)
export default supabase