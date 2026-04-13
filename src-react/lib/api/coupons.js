import { supabase } from "../supabaseClient";

export async function fetchCoupons() {
  const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
  if (error) return [];
  return data || [];
}

export async function insertCoupon(payload) {
  const { error } = await supabase.from("coupons").insert([payload]);
  if (error) throw error;
}

export async function setCouponState(id, payload) {
  const { error } = await supabase.from("coupons").update(payload).eq("id", id);
  if (error) throw error;
}

export async function removeCoupon(id) {
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) throw error;
}

export async function applyCouponCode(code) {
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code)
    .eq("is_active", true)
    .single();
  if (error) return null;
  return data;
}
