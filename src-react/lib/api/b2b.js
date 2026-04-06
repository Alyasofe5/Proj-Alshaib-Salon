import { supabase } from "../supabaseClient";

export async function fetchB2BClients() {
  const { data, error } = await supabase.from("b2b_clients").select("*").order("created_at", { ascending: false });
  if (error) return [];
  return data || [];
}

export async function fetchB2BCount() {
  const { count } = await supabase.from("b2b_clients").select("*", { count: "exact", head: true });
  return count || 0;
}

export async function insertB2BClient(payload) {
  const { error } = await supabase.from("b2b_clients").insert([payload]);
  if (error) throw error;
}

export async function setB2BStatus(id, contract_status) {
  const { error } = await supabase.from("b2b_clients").update({ contract_status }).eq("id", id);
  if (error) throw error;
}

export async function removeB2BClient(id) {
  const { error } = await supabase.from("b2b_clients").delete().eq("id", id);
  if (error) throw error;
}
