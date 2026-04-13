import { supabase } from "../supabaseClient";

export async function fetchProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_draft", false)
    .order("created_at", { ascending: false });
  if (error) return [];
  return data || [];
}

export async function fetchProductById(id) {
  const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
  if (error) return null;
  return data;
}

export async function upsertProduct(payload) {
  const { error } = await supabase.from("products").upsert(payload);
  if (error) throw error;
}
