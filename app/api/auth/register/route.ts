import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import crypto from "crypto";
import { Resend } from "resend";

export const runtime = "nodejs";

let resendClient: Resend | null = null;
if (process.env.RESEND_API_KEY) {
  resendClient = new Resend(process.env.RESEND_API_KEY);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Validate Waterloo email
    if (!email.endsWith("@uwaterloo.ca")) {
      return NextResponse.json(
        { error: "Only @uwaterloo.ca emails are allowed" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        emailVerified: false,
        verificationToken,
      },
    });

    const baseUrl =
      process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const verificationUrl = `${baseUrl}/auth/verify?token=${verificationToken}`;

    console.log('\n=================================');
    console.log('📧 EMAIL VERIFICATION');
    console.log('To:', email);
    console.log('Resend configured:', !!resendClient);
    console.log('=================================');

    // ALWAYS log to console for development
    console.log('\n🔗 VERIFICATION LINK:');
    console.log(verificationUrl);
    console.log('\n');

    // Try to send email via Resend (optional, may fail)
    if (resendClient) {
      try {
        const emailResult = await resendClient.emails.send({
          from: 'Wagerloo <onboarding@resend.dev>',
          to: email,
          subject: 'Verify your Wagerloo account',
          html: `
            <h1>Welcome to Wagerloo!</h1>
            <p>Hi ${name},</p>
            <p>Thanks for signing up! Please verify your email address by clicking the link below:</p>
            <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px;">Verify Email</a>
            <p>Or copy and paste this link into your browser:</p>
            <p>${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
          `,
        });
        console.log('✅ Email sent via Resend:', emailResult);
      } catch (emailError: any) {
        if (emailError.message && emailError.message.includes('testing emails')) {
          console.log('ℹ️  Resend free tier: Can only send to your account email');
          console.log('   Use console link above or register with tom.almog.dev@gmail.com to test email sending');
        } else {
          console.error('❌ Resend failed:', emailError.message);
        }
        // This is OK - user can use console link
      }
    }

    return NextResponse.json({
      success: true,
      message: "Registration successful. Please check your email to verify your account.",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
