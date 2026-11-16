import { fileURLToPath } from "node:url";
import { defineConfig } from "@mikro-orm/postgresql";
import { Migrator } from "@mikro-orm/migrations";
import { loadDatabaseConfig } from "@moonwitness/config";
import {
  UserSchema,
  StorySchema,
  AddonInstallationSchema,
  AuditEventSchema,
  UserSessionSchema,
  SourceReferenceSchema,
  StoryBlockSourceSchema,
  ResearchDossierSchema,
  ResearchClaimSchema,
  ResearchClaimSourceSchema,
  CreativeEntitySchema,
  StoryCreativeEntitySchema,
  RoleSchema,
  RolePermissionSchema,
  UserRoleSchema,
  AddonCapabilityGrantSchema,
  OutboxMessageSchema
} from "./src/entities.js";

const { databaseUrl, nodeEnv } = loadDatabaseConfig();

export default defineConfig({
  clientUrl: databaseUrl,
  entities: [
    UserSchema,
    StorySchema,
    AddonInstallationSchema,
    AuditEventSchema,
    UserSessionSchema,
    SourceReferenceSchema,
    StoryBlockSourceSchema,
    ResearchDossierSchema,
    ResearchClaimSchema,
    ResearchClaimSourceSchema,
    CreativeEntitySchema,
    StoryCreativeEntitySchema,
    RoleSchema,
    RolePermissionSchema,
    UserRoleSchema,
    AddonCapabilityGrantSchema,
    OutboxMessageSchema
  ],
  extensions: [Migrator],
  migrations: {
    path: fileURLToPath(new URL("./src/migrations", import.meta.url)),
    glob: "*.js",
    tableName: "mikro_orm_migrations",
    transactional: true,
    allOrNothing: true,
    emit: "js",
    snapshot: true
  },
  debug: nodeEnv === "development"
});
