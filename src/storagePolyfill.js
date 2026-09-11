import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://rciwpagstiiyuxuswezk.supabase.co",
  "sb_publishable_pNyC4tblU9tz_R6WVTXQsQ_8TBL-uyg"
);

window.storage = {
  async get(key) {
    const { data } = await supabase.from("kv_store").select("value").eq("key", key).maybeSingle();
    if (!data) return null;
    return { key, value: data.value };
  },
  async set(key, value) {
    await supabase.from("kv_store").upsert({ key, value });
    return { key, value };
  },
  async delete(key) {
    await supabase.from("kv_store").delete().eq("key", key);
    return { key, deleted: true };
  },
  async list(prefix) {
    let query = supabase.from("kv_store").select("key");
    if (prefix) query = query.like("key", `${prefix}%`);
    const { data } = await query;
    return { keys: (data || []).map((d) => d.key), prefix };
  },
};