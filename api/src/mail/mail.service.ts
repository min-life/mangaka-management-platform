import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  // KietDM #001
  async sendVerificationEmail(to: string, verificationToken: string): Promise<void> {
    const frontendUrl = (process.env.FRONTEND_URL ?? 'http://localhost:3001').replace(/\/$/, '');
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM ?? user;

    if (!host || !user || !pass || !from) {
      this.logger.warn(`SMTP is not configured. Verification link: ${verificationUrl}`);
      throw new InternalServerErrorException('SMTP is not configured');
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user,
        pass,
      },
    });

    try {
      await transporter.sendMail({
        from,
        to,
        subject: 'Verify your Mangaka account',
        text: [
          'Welcome to Mangaka Company Platform.',
          '',
          'Please verify your email before signing in:',
          verificationUrl,
          '',
          'This verification link expires in 24 hours.',
        ].join('\n'),
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #171717;">
            <h2>Verify your Mangaka account</h2>
            <p>Welcome to Mangaka Company Platform.</p>
            <p>Please verify your email before signing in.</p>
            <p>
              <a href="${verificationUrl}" style="display:inline-block;padding:12px 18px;background:#171717;color:#ffffff;text-decoration:none;border-radius:4px;">
                Verify email
              </a>
            </p>
            <p style="font-size:13px;color:#666;">This verification link expires in 24 hours.</p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error('Failed to send verification email', error);
      throw new InternalServerErrorException('Failed to send verification email');
    }
  }
}
