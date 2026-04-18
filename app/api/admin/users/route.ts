import { createAdminClient } from "@/utils/supabase/admin";
import { isAdminUser } from "@/utils/supabase/admin-users";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

type AdminUserRow = {
  user_id: string;
  role: string;
  created_at: string | null;
};

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      error: NextResponse.json({ message: "请先登录" }, { status: 401 }),
      user: null,
    };
  }

  const isAdmin = await isAdminUser(user.id);

  if (!isAdmin) {
    return {
      error: NextResponse.json(
        { message: "当前账号不是管理员，无法访问用户管理接口" },
        { status: 403 },
      ),
      user: null,
    };
  }

  return { error: null, user };
}

async function listAllUsers() {
  const adminClient = createAdminClient();
  const perPage = 100;
  let page = 1;
  let hasMore = true;
  const users: Array<{
    id: string;
    email?: string;
    created_at?: string;
    last_sign_in_at?: string;
  }> = [];

  while (hasMore) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw error;
    }

    const currentPageUsers = data.users.map((user) => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
    }));

    users.push(...currentPageUsers);
    hasMore = currentPageUsers.length === perPage;
    page += 1;
  }

  return users;
}

export async function GET() {
  const auth = await requireAdmin();

  if (auth.error || !auth.user) {
    return auth.error;
  }

  const adminClient = createAdminClient();
  const [users, adminUsersResult] = await Promise.all([
    listAllUsers(),
    adminClient
      .from("admin_users")
      .select("user_id, role, created_at")
      .order("created_at", { ascending: true }),
  ]);

  if (adminUsersResult.error) {
    return NextResponse.json(
      { message: "读取管理员列表失败" },
      { status: 500 },
    );
  }

  const adminUsers = (adminUsersResult.data ?? []) as AdminUserRow[];
  const adminMap = new Map(adminUsers.map((item) => [item.user_id, item]));

  const rows = users
    .map((user) => {
      const adminRecord = adminMap.get(user.id);

      return {
        id: user.id,
        email: user.email ?? "未绑定邮箱",
        created_at: user.created_at ?? null,
        last_sign_in_at: user.last_sign_in_at ?? null,
        is_admin: Boolean(adminRecord),
        role: adminRecord?.role ?? null,
        admin_created_at: adminRecord?.created_at ?? null,
      };
    })
    .sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });

  return NextResponse.json({
    current_admin_id: auth.user.id,
    total_users: rows.length,
    admin_count: adminUsers.length,
    users: rows,
  });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();

  if (auth.error || !auth.user) {
    return auth.error;
  }

  const body = (await request.json()) as { userId?: string };
  const userId = body.userId;

  if (!userId) {
    return NextResponse.json({ message: "缺少用户 ID" }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { data: targetUser, error: targetUserError } =
    await adminClient.auth.admin.getUserById(userId);

  if (targetUserError || !targetUser.user) {
    return NextResponse.json({ message: "目标用户不存在" }, { status: 404 });
  }

  const { error } = await adminClient.from("admin_users").upsert(
    {
      user_id: userId,
      role: "admin",
    },
    {
      onConflict: "user_id",
    },
  );

  if (error) {
    return NextResponse.json({ message: "设置管理员失败" }, { status: 500 });
  }

  return NextResponse.json({ message: "已成功设置为管理员" });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();

  if (auth.error || !auth.user) {
    return auth.error;
  }

  const body = (await request.json()) as { userId?: string };
  const userId = body.userId;

  if (!userId) {
    return NextResponse.json({ message: "缺少用户 ID" }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { count, error: countError } = await adminClient
    .from("admin_users")
    .select("user_id", { count: "exact", head: true });

  if (countError) {
    return NextResponse.json(
      { message: "读取管理员数量失败" },
      { status: 500 },
    );
  }

  if ((count ?? 0) <= 1) {
    return NextResponse.json(
      { message: "系统至少需要保留一个管理员，不能移除最后一个管理员" },
      { status: 400 },
    );
  }

  const { data: targetAdmin, error: targetAdminError } = await adminClient
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (targetAdminError) {
    return NextResponse.json({ message: "读取管理员信息失败" }, { status: 500 });
  }

  if (!targetAdmin) {
    return NextResponse.json({ message: "目标用户当前不是管理员" }, { status: 400 });
  }

  const { error } = await adminClient
    .from("admin_users")
    .delete()
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ message: "取消管理员失败" }, { status: 500 });
  }

  return NextResponse.json({ message: "已取消管理员身份" });
}
