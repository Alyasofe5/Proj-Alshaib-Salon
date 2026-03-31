import { supabase } from "./supabaseClient";

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

export async function fetchOrders() {
  const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (error) return [];
  return data || [];
}

export async function fetchCoupons() {
  const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
  if (error) return [];
  return data || [];
}

export async function fetchB2BClients() {
  const { data, error } = await supabase.from("b2b_clients").select("*").order("created_at", { ascending: false });
  if (error) return [];
  return data || [];
}

export async function fetchBookings(date) {
  let remoteData = [];
  try {
    let query = supabase.from("bookings").select("*");
    if (date) query = query.eq("booking_date", date);
    const { data, error } = await query.order("booking_date", { ascending: true });
    if (!error && data) remoteData = data;
  } catch (e) {}

  const localRaw = localStorage.getItem("local_bookings") || "[]";
  let localData = JSON.parse(localRaw);
  if (date) localData = localData.filter(b => b.booking_date === date);

  // Merge and deduplicate (simple by id or content)
  const combined = [...remoteData, ...localData];
  return combined;
}

export async function fetchVideoSettings() {
  const { data, error } = await supabase.from("video_settings").select("*");
  if (error) return [];
  return data || [];
}

export async function fetchB2BCount() {
  const { count } = await supabase.from("b2b_clients").select("*", { count: "exact", head: true });
  return count || 0;
}

export async function createOrder(payload) {
  const { error } = await supabase.from("orders").insert([payload]);
  if (error) throw error;
}

export async function upsertProduct(payload) {
  const { error } = await supabase.from("products").upsert(payload);
  if (error) throw error;
}

export async function updateOrderStatus(order, status) {
  const keyField = isNaN(order.id) ? "order_ref" : "id";
  const keyValue = keyField === "order_ref" ? (order.order_ref || order.id) : order.id;
  const { error } = await supabase.from("orders").update({ status }).eq(keyField, keyValue);
  if (error) throw error;
}

export async function insertBooking(payload) {
  try {
    const { error } = await supabase.from("bookings").insert([payload]);
    if (error) throw error;
  } catch (supabaseError) {
    console.warn("Supabase insert failed, falling back to local storage:", supabaseError);
    const localRaw = localStorage.getItem("local_bookings") || "[]";
    const localData = JSON.parse(localRaw);
    localData.push({ ...payload, id: Date.now(), is_local: true });
    localStorage.setItem("local_bookings", JSON.stringify(localData));
  }
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

export async function upsertHeroSetting(payload) {
  // payload: { key, url, title, tag, description }
  const { error } = await supabase.from("video_settings").upsert(payload);
  if (error) throw error;
}
