import { prisma } from "../src/lib/client.ts";

async function main() {
  const postsResult = await prisma.post.updateMany({
    where: { status: "PENDING" },
    data: { status: "APPROVED" },
  });

  const questionsResult = await prisma.question.updateMany({
    where: { status: "PENDING" },
    data: { status: "APPROVED" },
  });

  console.log(`✅ Approved ${postsResult.count} posts`);
  console.log(`✅ Approved ${questionsResult.count} questions`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
