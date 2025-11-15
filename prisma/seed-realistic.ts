import { PrismaClient } from '@prisma/client';
import * as https from 'https';

const prisma = new PrismaClient();

// Helper function to download image as base64
async function downloadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          downloadImageAsBase64(redirectUrl).then(resolve).catch(reject);
          return;
        }
      }

      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        let mimeType = 'image/png';
        if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
          mimeType = 'image/jpeg';
        } else if (buffer[0] === 0x89 && buffer[1] === 0x50) {
          mimeType = 'image/png';
        }
        const base64 = `data:${mimeType};base64,${buffer.toString('base64')}`;
        resolve(base64);
      });
      response.on('error', reject);
    });
  });
}

// Generate realistic resume as base64 image
function generateResumeImage(name: string, data: any): string {
  // For now, we'll create a simple text-based resume representation
  // In production, you'd use a proper image generation library
  const resumeText = `
${name}
University of Waterloo | ${data.program}
${data.email}

EDUCATION
University of Waterloo
${data.program}
Expected ${data.gradYear}
GPA: ${data.gpa}/4.0

EXPERIENCE
${data.experiences.map((exp: any) => `
${exp.title} | ${exp.company}
${exp.dates}
${exp.description}
`).join('\n')}

SKILLS
${data.skills.join(' • ')}

PROJECTS
${data.projects.map((proj: any) => `
${proj.name}
${proj.description}
`).join('\n')}
`;

  // Convert to base64 (simplified - in production use canvas or similar)
  return `data:text/plain;base64,${Buffer.from(resumeText).toString('base64')}`;
}

// Realistic name and profile data
const profiles = [
  {
    firstName: "Sarah", lastName: "Chen", program: "Computer Science",
    experiences: [
      { title: "Software Engineering Intern", company: "Google", dates: "May 2024 - Aug 2024", description: "Built scalable microservices using Go and Kubernetes" },
      { title: "Backend Developer", company: "Shopify", dates: "Sep 2023 - Dec 2023", description: "Developed REST APIs for merchant dashboard" }
    ],
    skills: ["Python", "Java", "React", "Node.js", "AWS", "Docker"],
    projects: [
      { name: "Real-time Chat Application", description: "Built WebSocket-based chat with 10k concurrent users" },
      { name: "ML Stock Predictor", description: "LSTM model achieving 73% accuracy" }
    ],
    gpa: "3.9", gradYear: "2026"
  },
  {
    firstName: "James", lastName: "Wilson", program: "Software Engineering",
    experiences: [
      { title: "Full Stack Developer", company: "Microsoft", dates: "Jan 2024 - Apr 2024", description: "Implemented Azure cloud features for Teams" },
      { title: "Frontend Intern", company: "Meta", dates: "May 2023 - Aug 2023", description: "Optimized React components reducing load time by 40%" }
    ],
    skills: ["TypeScript", "React", "GraphQL", "PostgreSQL", "Redis", "CI/CD"],
    projects: [
      { name: "E-commerce Platform", description: "Next.js store with Stripe integration and 50k+ products" },
      { name: "Code Review Tool", description: "VSCode extension with AI-powered suggestions" }
    ],
    gpa: "3.8", gradYear: "2025"
  },
  {
    firstName: "Emily", lastName: "Zhang", program: "Computer Engineering",
    experiences: [
      { title: "ML Engineer Intern", company: "Amazon", dates: "Sep 2024 - Dec 2024", description: "Trained recommendation models serving 100M users" },
      { title: "Data Science Intern", company: "Uber", dates: "Jan 2024 - Apr 2024", description: "Built ETL pipelines processing 5TB daily" }
    ],
    skills: ["Python", "TensorFlow", "PyTorch", "Spark", "SQL", "Airflow"],
    projects: [
      { name: "Image Recognition API", description: "CNN model with 95% accuracy deployed on GCP" },
      { name: "Sentiment Analysis Tool", description: "NLP pipeline for customer review analysis" }
    ],
    gpa: "4.0", gradYear: "2026"
  },
  {
    firstName: "Michael", lastName: "Patel", program: "Computer Science",
    experiences: [
      { title: "DevOps Engineer", company: "Stripe", dates: "May 2024 - Aug 2024", description: "Automated deployment pipelines reducing release time by 60%" },
      { title: "SRE Intern", company: "Databricks", dates: "Sep 2023 - Dec 2023", description: "Improved system reliability to 99.99% uptime" }
    ],
    skills: ["Kubernetes", "Terraform", "Python", "Bash", "Prometheus", "Grafana"],
    projects: [
      { name: "Infrastructure as Code Platform", description: "Terraform modules for AWS multi-region deployment" },
      { name: "Monitoring Dashboard", description: "Real-time metrics visualization with Grafana" }
    ],
    gpa: "3.7", gradYear: "2025"
  },
  {
    firstName: "Jessica", lastName: "Liu", program: "Software Engineering",
    experiences: [
      { title: "iOS Developer", company: "Apple", dates: "Jan 2024 - Apr 2024", description: "Developed SwiftUI components for iOS 18" },
      { title: "Mobile Engineer", company: "Snapchat", dates: "May 2023 - Aug 2023", description: "Built AR features used by 50M users" }
    ],
    skills: ["Swift", "SwiftUI", "Kotlin", "Flutter", "Firebase", "ARKit"],
    projects: [
      { name: "Fitness Tracking App", description: "iOS app with HealthKit integration and 10k downloads" },
      { name: "AR Shopping Experience", description: "ARKit app for virtual furniture placement" }
    ],
    gpa: "3.9", gradYear: "2026"
  }
];

// Generate more profiles by combining names and experiences
const firstNames = ["Alex", "Ryan", "Olivia", "Daniel", "Sophia", "Matthew", "Emma", "David", "Ava", "Christopher"];
const lastNames = ["Johnson", "Brown", "Davis", "Miller", "Garcia", "Rodriguez", "Martinez", "Taylor", "Anderson", "Thomas"];
const programs = ["Computer Science", "Software Engineering", "Computer Engineering", "Data Science", "Electrical Engineering"];
const companies = ["Google", "Microsoft", "Meta", "Amazon", "Apple", "Uber", "Stripe", "Shopify", "Databricks", "Tesla", "Netflix", "Airbnb"];
const roles = ["Software Engineer Intern", "Full Stack Developer", "Backend Engineer", "Frontend Developer", "ML Engineer", "Data Scientist", "DevOps Engineer"];

async function generateRealisticProfiles(count: number) {
  const generated = [];

  for (let i = 0; i < count; i++) {
    const firstName = i < profiles.length ? profiles[i].firstName : firstNames[i % firstNames.length];
    const lastName = i < profiles.length ? profiles[i].lastName : lastNames[i % lastNames.length];
    const name = `${firstName} ${lastName}`;

    // Generate realistic email
    let email = `${firstName.toLowerCase().charAt(0)}${lastName.toLowerCase()}@uwaterloo.ca`;
    // Add numbers for common names
    if (i >= firstNames.length) {
      const num = Math.floor(i / firstNames.length) + 1;
      email = `${firstName.toLowerCase().charAt(0)}${lastName.toLowerCase()}${num}@uwaterloo.ca`;
    }

    // Use predefined profile or generate one
    const profileData = i < profiles.length ? profiles[i] : {
      program: programs[i % programs.length],
      experiences: [
        {
          title: roles[i % roles.length],
          company: companies[(i * 2) % companies.length],
          dates: "May 2024 - Aug 2024",
          description: "Developed scalable solutions and improved system performance"
        },
        {
          title: roles[(i + 1) % roles.length],
          company: companies[(i * 2 + 1) % companies.length],
          dates: "Jan 2024 - Apr 2024",
          description: "Built features used by millions of users worldwide"
        }
      ],
      skills: ["Python", "JavaScript", "React", "Node.js", "AWS", "Docker"],
      projects: [
        { name: "Web Application", description: "Full-stack app with modern tech stack" },
        { name: "Data Pipeline", description: "ETL system processing large datasets" }
      ],
      gpa: (3.5 + Math.random() * 0.5).toFixed(1),
      gradYear: 2025 + (i % 2)
    };

    generated.push({
      name,
      email,
      ...profileData
    });
  }

  return generated;
}

async function main() {
  console.log('Starting realistic seed...');

  // Check for template resume
  const templateUser = await prisma.user.findFirst({
    include: { profile: true },
  });

  let templateResume: string | null = null;
  if (templateUser?.profile?.resumeUrl) {
    console.log(`Using resume from ${templateUser.profile.name} as template\n`);
    templateResume = templateUser.profile.resumeUrl;
  } else {
    console.log('⚠️  No template resume found. Please create a profile first, then run this script.');
    console.log('Or profiles will be created without resumes.\n');
  }

  const numProfiles = 25; // Generate 25 realistic profiles
  const generatedProfiles = await generateRealisticProfiles(numProfiles);

  for (let i = 0; i < generatedProfiles.length; i++) {
    const profile = generatedProfiles[i];
    console.log(`\nCreating user ${i + 1}/${numProfiles}: ${profile.name}`);

    try {
      // Use Unsplash for real portrait photos (different people)
      // Using specific photo IDs for consistency
      const unsplashPhotoId = [
        'photo-1507003211169-0a1dd7228f2d', // man
        'photo-1494790108377-be9c29b29330', // woman
        'photo-1506794778202-cad84cf45f1d', // man
        'photo-1573497019940-1c28c88b4f3e', // woman
        'photo-1566492031773-4f4e44671857', // man
        'photo-1573496359142-b8d87734a5a2', // woman
        'photo-1519345182560-3f2917c472ef', // man
        'photo-1580489944761-15a19d654956', // woman
        'photo-1506277886164-e25aa3f4ef7f', // man
        'photo-1487412720507-e7ab37603c6f', // woman
        'photo-1552374196-c4e7ffc6e126', // man
        'photo-1544005313-94ddf0286df2', // woman
        'photo-1463453091185-61582044d556', // man
        'photo-1531123897727-8f129e1688ce', // woman
        'photo-1500648767791-00dcc994a43e', // man
        'photo-1534528741775-53994a69daeb', // woman
        'photo-1488426862026-3ee34a7d66df', // man
        'photo-1488426862026-3ee34a7d66df', // woman
        'photo-1506794778202-cad84cf45f1d', // man
        'photo-1438761681033-6461ffad8d80', // woman
        'photo-1552374196-c4e7ffc6e126', // man
        'photo-1531123897727-8f129e1688ce', // woman
        'photo-1507003211169-0a1dd7228f2d', // man
        'photo-1494790108377-be9c29b29330', // woman
        'photo-1566492031773-4f4e44671857', // man
      ][i % 25];

      console.log(`  Downloading profile picture from Unsplash...`);
      const photoUrl = `https://images.unsplash.com/${unsplashPhotoId}?w=1080&h=1920&fit=crop`;
      const profilePicture = await downloadImageAsBase64(photoUrl);

      console.log(`  Setting resume...`);
      const resumeUrl = templateResume || `data:text/plain;base64,${Buffer.from('No resume').toString('base64')}`;

      // Create user
      const newUser = await prisma.user.upsert({
        where: { email: profile.email },
        update: {},
        create: {
          email: profile.email,
          name: profile.name,
          emailVerified: true,
        },
      });

      // Create profile
      const createdProfile = await prisma.profile.upsert({
        where: { userId: newUser.id },
        update: {
          name: profile.name,
          profilePicture: profilePicture,
          resumeUrl: resumeUrl, // We'll update this
        },
        create: {
          userId: newUser.id,
          name: profile.name,
          profilePicture: profilePicture,
          resumeUrl: resumeUrl,
        },
      });

      // Create market
      const randomLine = 20 + Math.random() * 20; // $20-40/hr
      await prisma.market.deleteMany({
        where: { profileId: createdProfile.id },
      });

      await prisma.market.create({
        data: {
          profileId: createdProfile.id,
          title: `${profile.name} - Next Co-op`,
          description: "Over/under on next co-op salary",
          currentLine: Number(randomLine.toFixed(2)),
          initialLine: Number(randomLine.toFixed(2)),
          status: "active",
        },
      });

      console.log(`  ✓ Created profile and market for ${profile.name}`);
    } catch (error) {
      console.error(`  ✗ Error creating ${profile.name}:`, error);
    }
  }

  console.log('\n✅ Realistic seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
