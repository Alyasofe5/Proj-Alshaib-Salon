import { supabase } from "../supabaseClient";

export async function fetchSubscribers() {
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("*")
    .order("subscribed_at", { ascending: false });
  if (error) return [];
  return data || [];
}

export async function deleteSubscriber(id) {
  const { error } = await supabase
    .from("newsletter_subscribers")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function fetchCampaigns() {
  const { data, error } = await supabase
    .from("newsletter_campaigns")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return data || [];
}

export async function saveCampaign(payload) {
  const { error } = await supabase
    .from("newsletter_campaigns")
    .insert([{ ...payload, created_at: new Date().toISOString(), status: "draft" }]);
  if (error) throw error;
}

export async function deleteCampaign(id) {
  const { error } = await supabase
    .from("newsletter_campaigns")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
