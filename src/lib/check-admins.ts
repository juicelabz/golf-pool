import { db } from "./db";
import { user } from "./schema";

async function checkAdmins() {
	console.log("🔍 Checking admin users...");

	const adminUsers = await db.select().from(user);
	console.log(`👥 Total users: ${adminUsers.length}`);

	adminUsers.forEach((user) => {
		console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
	});
}

checkAdmins().catch(console.error);
