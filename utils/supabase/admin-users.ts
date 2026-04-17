import { createAdminClient } from "@/utils/supabase/admin";

export const isAdminUser = async (userId: string) => {
  const supabaseAdmin = createAdminClient();

  const { data, error } = await supabaseAdmin
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to verify admin user", error.message);
    return false;
  }

  return Boolean(data);
};
