// Simple seed script to add a test user, since this demo has no registration page.
// Run with: node prisma/seed.js your-email@example.com

const prisma = require("../prismaClient");

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("Please provide an email. Example:");
    console.error("  node prisma/seed.js your-email@example.com");
    process.exit(1);
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  console.log("User ready in database:", user);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
