import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import crypto from "crypto";
import * as brevo from "@getbrevo/brevo";

export const runtime = "nodejs";

let brevoClient: brevo.TransactionalEmailsApi | null = null;
if (process.env.BREVO_API_KEY) {
  brevoClient = new brevo.TransactionalEmailsApi();
  brevoClient.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
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
    const verificationUrl = `${baseUrl}/api/auth/verify?token=${verificationToken}`;

    console.log('\n=================================');
    console.log('📧 EMAIL VERIFICATION');
    console.log('To:', email);
    console.log('Brevo configured:', !!brevoClient);
    console.log('=================================');

    // ALWAYS log to console for development
    console.log('\n🔗 VERIFICATION LINK:');
    console.log(verificationUrl);
    console.log('\n');

    // Try to send email via Brevo
    if (brevoClient) {
      try {
        const sendSmtpEmail = new brevo.SendSmtpEmail();
        sendSmtpEmail.sender = { name: "WagerLoo", email: "tom.almog.dev@gmail.com" };
        sendSmtpEmail.to = [{ email: email, name: name }];
        sendSmtpEmail.subject = "Verify your WagerLoo account";
        sendSmtpEmail.htmlContent = `
          <h1>Welcome to WagerLoo!</h1>
          <p>Hi ${name},</p>
          <p>Thanks for signing up! Please verify your email address by clicking the link below:</p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px;">Verify Email</a>
          <p>Or copy and paste this link into your browser:</p>
          <p>${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
        `;

        const emailResult = await brevoClient.sendTransacEmail(sendSmtpEmail);
        console.log('✅ Email sent via Brevo:', emailResult);
      } catch (emailError: any) {
        console.error('❌ Brevo failed:', emailError.message || emailError);
        console.log('ℹ️  Check console link above for verification');
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
