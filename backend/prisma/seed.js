// Optional CLI helper to create a test user directly, without using the Sign Up page.
// Run with:
//   node prisma/seed.js <email> <username> <YYYY-MM-DD> <password>
// Example:
//   node prisma/seed.js jane@example.com jane 1998-04-12 mypassword123

const bcrypt = require("bcryptjs");
const prisma = require("../prismaClient");

async function main() {
  const [email, username, dob, password] = process.argv.slice(2);

  if (!email || !username || !dob || !password) {
    console.error("Usage: node prisma/seed.js <email> <username> <YYYY-MM-DD> <password>");
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { username, dob: new Date(dob), password: hashedPassword },
    create: { email, username, dob: new Date(dob), password: hashedPassword },
  });

  console.log("User ready in database:", { id: user.id, email: user.email, username: user.username });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
