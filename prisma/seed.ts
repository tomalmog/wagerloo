import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as https from 'https';

const prisma = new PrismaClient();

// Helper function to download image as base64
async function downloadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const base64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;
        resolve(base64);
      });
      response.on('error', reject);
    });
  });
}

// Helper function to crop image to 9:16 aspect ratio
// For simplicity, we'll just use the images directly from Unsplash with aspect ratio parameter

const testUsers = [
  { name: "Alex Chen", email: "alex.chen@uwaterloo.ca" },
  { name: "Sarah Johnson", email: "sarah.johnson@uwaterloo.ca" },
  { name: "Michael Kim", email: "michael.kim@uwaterloo.ca" },
  { name: "Emily Zhang", email: "emily.zhang@uwaterloo.ca" },
  { name: "David Patel", email: "david.patel@uwaterloo.ca" },
  { name: "Jessica Liu", email: "jessica.liu@uwaterloo.ca" },
  { name: "Ryan Martinez", email: "ryan.martinez@uwaterloo.ca" },
  { name: "Olivia Brown", email: "olivia.brown@uwaterloo.ca" },
  { name: "Daniel Lee", email: "daniel.lee@uwaterloo.ca" },
  { name: "Sophia Nguyen", email: "sophia.nguyen@uwaterloo.ca" },
];

async function main() {
  console.log('Starting seed...');

  // Find the user's profile to get their resume
  const userEmail = process.env.USER_EMAIL;
  if (!userEmail) {
    console.error('Please provide USER_EMAIL environment variable');
    console.log('Usage: USER_EMAIL=your@email.com npm run seed');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: { profile: true },
  });

  if (!user || !user.profile) {
    console.error(`User with email ${userEmail} not found or has no profile`);
    process.exit(1);
  }

  const resumeData = user.profile.resumeUrl;
  console.log(`Using resume from ${user.profile.name}`);

  // Create test users
  for (let i = 0; i < testUsers.length; i++) {
    const testUser = testUsers[i];

    console.log(`Creating user ${i + 1}/${testUsers.length}: ${testUser.name}`);

    try {
      // Use Unsplash for profile pictures with 9:16 aspect ratio (portrait)
      // Using random portraits with seed for consistency
      const imageUrl = `https://source.unsplash.com/1080x1920/?portrait,face&sig=${i}`;

      console.log(`  Downloading profile picture...`);
      const profilePicture = await downloadImageAsBase64(imageUrl);

      // Create user
      const newUser = await prisma.user.upsert({
        where: { email: testUser.email },
        update: {},
        create: {
          email: testUser.email,
          name: testUser.name,
          emailVerified: true,
        },
      });

      // Create profile
      const profile = await prisma.profile.upsert({
        where: { userId: newUser.id },
        update: {
          name: testUser.name,
          profilePicture: profilePicture,
          resumeUrl: resumeData,
        },
        create: {
          userId: newUser.id,
          name: testUser.name,
          profilePicture: profilePicture,
          resumeUrl: resumeData,
        },
      });

      // Create market for this profile (delete existing if any)
      const existingMarket = await prisma.market.findFirst({
        where: { profileId: profile.id },
      });

      if (existingMarket) {
        await prisma.market.delete({
          where: { id: existingMarket.id },
        });
      }

      await prisma.market.create({
        data: {
          profileId: profile.id,
          title: `${testUser.name} - Next Co-op`,
          description: "Over/under on next co-op salary",
          currentLine: 25.0,
          initialLine: 25.0,
          status: "active",
        },
      });

      console.log(`  ✓ Created profile and market for ${testUser.name}`);
    } catch (error) {
      console.error(`  ✗ Error creating ${testUser.name}:`, error);
    }
  }

  console.log('\nSeed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
