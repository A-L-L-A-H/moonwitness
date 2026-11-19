import { verifyServerRouteAccess } from "@core/auth/serverRouteGuard";
import { AuthGuard } from "@/hocs/AuthGuard";
import { NotAuthorizedView } from "@/views/NotAuthorized";
import { PermissionsView } from "@/views/apps/permissions";

export default async function PermissionsAppPage() {
  const access = await verifyServerRouteAccess({
    pathname: "/apps/permissions",
    enforcePreviewAuth: true,
  });

  if (!access.allowed && access.reason === "forbidden") {
    return <NotAuthorizedView requiredRole="admin" />;
  }

  return (
    <AuthGuard minRole="admin" enforceRedirect>
      <PermissionsView />
    </AuthGuard>
  );
}
