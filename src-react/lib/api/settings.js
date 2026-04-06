import { supabase } from "../supabaseClient";

export async function fetchVideoSettings() {
  const { data, error } = await supabase.from("video_settings").select("*");
  if (error) return [];
  return data || [];
}

export async function upsertHeroSetting(payload) {
  // payload: { key, url, title, tag, description }
  const { error } = await supabase.from("video_settings").upsert(payload);
  if (error) throw error;
}
