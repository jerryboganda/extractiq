import { hashPassword } from "@mcq-platform/auth";
import { db, users, closeDb } from "@mcq-platform/db";
import { eq } from "drizzle-orm";

async function resetAdmin() {
  const newPassword = "ExtractIQ@Admin2026!";
  const hash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash: hash }).where(eq(users.email, "admin@extractiq.com"));
  console.log("Admin password reset successfully");
  console.log("Email: admin@extractiq.com");
  console.log("Password: " + newPassword);
  await closeDb();
  process.exit(0);
}
resetAdmin();
