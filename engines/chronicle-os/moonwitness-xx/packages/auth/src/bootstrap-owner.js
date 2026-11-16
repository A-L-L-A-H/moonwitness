import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { AuditEvent, User, UserRole, createOrm } from "@moonwitness/database";
import { createAuthorizationService } from "./authorization.js";

dotenv.config({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });

const email = process.env.INITIAL_OWNER_EMAIL?.trim().toLowerCase();
if (!email) throw new Error("INITIAL_OWNER_EMAIL is required to bootstrap the first owner.");

const orm = await createOrm(process.env.DATABASE_URL);
const authorization = createAuthorizationService();

try {
  await orm.em.transactional(async (tx) => {
    const user = await tx.findOne(User, { email });
    if (!user) throw new Error("Register the initial owner account before running this command.");

    const roles = await authorization.ensureRoleCatalog(tx);
    const ownerRole = roles.get("owner");
    const existingOwners = await tx.find(UserRole, { role: ownerRole.id });

    if (existingOwners.some((assignment) => assignment.user.id === user.id)) {
      console.info("Initial owner role is already assigned.");
      return;
    }
    if (existingOwners.length > 0) {
      throw new Error("An owner is already configured. Only an existing owner may grant another owner role.");
    }

    await authorization.assignInitialRole(tx, user, "owner");
    tx.persist(tx.create(AuditEvent, {
      actor: user,
      action: "user.role.initial_owner_bootstrapped",
      subjectType: "user",
      subjectId: user.id,
      requestId: null,
      metadata: { roleName: "owner" }
    }));
    await tx.flush();
    console.info("Initial owner role assigned successfully.");
  });
} finally {
  await orm.close(true);
}
