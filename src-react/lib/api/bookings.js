import { supabase } from "../supabaseClient";

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

  const combined = [...remoteData, ...localData];
  return combined;
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
