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

// Generate 100 test users
const firstNames = [
  "Alex", "Sarah", "Michael", "Emily", "David", "Jessica", "Ryan", "Olivia", "Daniel", "Sophia",
  "James", "Emma", "William", "Ava", "Benjamin", "Isabella", "Lucas", "Mia", "Henry", "Charlotte",
  "Alexander", "Amelia", "Sebastian", "Harper", "Jack", "Evelyn", "Owen", "Abigail", "Theodore", "Ella",
  "Matthew", "Scarlett", "Samuel", "Grace", "Joseph", "Chloe", "John", "Victoria", "Christopher", "Madison",
  "Dylan", "Luna", "Nathan", "Lily", "Isaac", "Hannah", "Gabriel", "Zoe", "Anthony", "Penelope",
  "Joshua", "Riley", "Andrew", "Layla", "Elijah", "Nora", "Levi", "Lillian", "Julian", "Aria",
  "Carter", "Ellie", "Wyatt", "Hazel", "Luke", "Aurora", "Grayson", "Violet", "Jackson", "Nova",
  "Lincoln", "Stella", "Asher", "Lucy", "Leo", "Savannah", "Oliver", "Claire", "Ethan", "Skylar",
  "Aiden", "Bella", "Noah", "Paisley", "Mason", "Everly", "Liam", "Anna", "Jacob", "Caroline",
  "Logan", "Genesis", "Jayden", "Aaliyah", "Hunter", "Kennedy", "Camden", "Kinsley", "Caleb", "Allison"
];

const lastNames = [
  "Chen", "Johnson", "Kim", "Zhang", "Patel", "Liu", "Martinez", "Brown", "Lee", "Nguyen",
  "Smith", "Garcia", "Rodriguez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Thompson", "White", "Lopez", "Gonzalez", "Harris", "Clark", "Lewis", "Robinson", "Walker", "Perez",
  "Hall", "Young", "Allen", "Sanchez", "Wright", "King", "Scott", "Green", "Baker", "Adams",
  "Nelson", "Hill", "Ramirez", "Campbell", "Mitchell", "Roberts", "Carter", "Phillips", "Evans", "Turner",
  "Torres", "Parker", "Collins", "Edwards", "Stewart", "Flores", "Morris", "Nguyen", "Murphy", "Rivera",
  "Cook", "Rogers", "Morgan", "Peterson", "Cooper", "Reed", "Bailey", "Bell", "Gomez", "Kelly",
  "Howard", "Ward", "Cox", "Diaz", "Richardson", "Wood", "Watson", "Brooks", "Bennett", "Gray",
  "James", "Reyes", "Cruz", "Hughes", "Price", "Myers", "Long", "Foster", "Sanders", "Ross",
  "Morales", "Powell", "Sullivan", "Russell", "Ortiz", "Jenkins", "Gutierrez", "Perry", "Butler", "Barnes"
];

const testUsers = [];
for (let i = 0; i < 100; i++) {
  const firstName = firstNames[i % firstNames.length];
  const lastName = lastNames[i % lastNames.length];
  const name = `${firstName} ${lastName}`;
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i > 99 ? i : ''}@uwaterloo.ca`;
  testUsers.push({ name, email });
}

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
