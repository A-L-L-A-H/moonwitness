import { verifyServerRouteAccess } from "@core/auth/serverRouteGuard";
import { AuthGuard } from "@/hocs/AuthGuard";
import { NotAuthorizedView } from "@/views/NotAuthorized";
import { UserListView } from "@/views/apps/user/list";

export default async function UserListAppPage() {
  const access = await verifyServerRouteAccess({
    pathname: "/apps/user/list",
    enforcePreviewAuth: true,
  });

  if (!access.allowed && access.reason === "forbidden") {
    return <NotAuthorizedView requiredRole="admin" />;
  }

  return (
    <AuthGuard minRole="admin" enforceRedirect>
      <UserListView />
    </AuthGuard>
  );
}
