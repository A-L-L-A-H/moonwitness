import { verifyServerRouteAccess } from "@core/auth/serverRouteGuard";
import { AuthGuard } from "@/hocs/AuthGuard";
import { NotAuthorizedView } from "@/views/NotAuthorized";
import { RolesView } from "@/views/apps/roles";

export default async function RolesAppPage() {
  const access = await verifyServerRouteAccess({
    pathname: "/apps/roles",
    enforcePreviewAuth: true,
  });

  if (!access.allowed && access.reason === "forbidden") {
    return <NotAuthorizedView requiredRole="admin" />;
  }

  return (
    <AuthGuard minRole="admin" enforceRedirect>
      <RolesView />
    </AuthGuard>
  );
}
