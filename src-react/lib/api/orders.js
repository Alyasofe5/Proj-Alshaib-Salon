import { supabase } from "../supabaseClient";

export async function fetchOrders() {
  const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (error) return [];
  return data || [];
}

export async function createOrder(payload) {
  const { error } = await supabase.from("orders").insert([payload]);
  if (error) throw error;
}

export async function updateOrderStatus(order, status) {
  const keyField = isNaN(order.id) ? "order_ref" : "id";
  const keyValue = keyField === "order_ref" ? (order.order_ref || order.id) : order.id;
  const { error } = await supabase.from("orders").update({ status }).eq(keyField, keyValue);
  if (error) throw error;
}
