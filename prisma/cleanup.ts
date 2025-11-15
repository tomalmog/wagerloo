import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting cleanup...');

  const userEmail = process.env.USER_EMAIL;
  if (!userEmail) {
    console.error('Please provide USER_EMAIL environment variable');
    console.log('Usage: USER_EMAIL=your@email.com npm run cleanup');
    process.exit(1);
  }

  console.log(`Keeping user: ${userEmail}`);

  try {
    // Get the user to keep
    const keepUser = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });

    if (!keepUser) {
      console.error(`User with email ${userEmail} not found`);
      process.exit(1);
    }

    // Get all users except the one to keep
    const usersToDelete = await prisma.user.findMany({
      where: {
        id: { not: keepUser.id },
      },
      select: { id: true, email: true },
    });

    console.log(`\nFound ${usersToDelete.length} users to delete`);

    // Delete all data associated with these users
    for (const user of usersToDelete) {
      console.log(`\nDeleting user: ${user.email}`);

      // Get user's profile
      const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (profile) {
        // Delete market associated with profile
        const marketsDeleted = await prisma.market.deleteMany({
          where: { profileId: profile.id },
        });
        console.log(`  - Deleted ${marketsDeleted.count} market(s)`);

        // Delete profile
        await prisma.profile.delete({
          where: { id: profile.id },
        });
        console.log(`  - Deleted profile`);
      }

      // Delete user's votes
      const votesDeleted = await prisma.vote.deleteMany({
        where: { userId: user.id },
      });
      console.log(`  - Deleted ${votesDeleted.count} vote(s)`);

      // Delete user's positions
      const positionsDeleted = await prisma.position.deleteMany({
        where: { userId: user.id },
      });
      console.log(`  - Deleted ${positionsDeleted.count} position(s)`);

      // Delete user's transactions
      const transactionsDeleted = await prisma.transaction.deleteMany({
        where: { userId: user.id },
      });
      console.log(`  - Deleted ${transactionsDeleted.count} transaction(s)`);

      // Delete user
      await prisma.user.delete({
        where: { id: user.id },
      });
      console.log(`  ✓ Deleted user`);
    }

    console.log(`\n✅ Cleanup completed! Deleted ${usersToDelete.length} users.`);
    console.log(`Kept user: ${userEmail}`);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
