import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://hebqbdfozdllebuinkkb.supabase.co";
const SUPABASE_KEY = "sb_publishable_Syp4JKsUYzIM5JpRPsColA_gdlj3fC5";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
