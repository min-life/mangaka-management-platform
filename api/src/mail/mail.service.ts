import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;

  constructor() {
    this.transporter = this.createTransporter();
  }

  async sendVerifyEmail(email: string, verifyUrl: string) {
    const appName = process.env.APP_NAME ?? 'Mangaka Management Platform';

    if (!process.env.SMTP_HOST) {
      this.logger.log(`Verify email URL for ${email}: ${verifyUrl}`);
    }

    await this.transporter.sendMail({
      from: process.env.MAIL_FROM ?? process.env.SMTP_FROM ?? `"${appName}" <no-reply@example.com>`,
      to: email,
      subject: 'Verify your email',
      text: `Please verify your email by opening this link: ${verifyUrl}`,
      html: `
        <p>Please verify your email by clicking the link below:</p>
        <p><a href="${verifyUrl}">Verify email</a></p>
        <p>If the button does not work, open this URL:</p>
        <p>${verifyUrl}</p>
      `,
    });
  }

  async sendResetPasswordEmail(email: string, resetUrl: string) {
    const appName = process.env.APP_NAME ?? 'Mangaka Management Platform';

    if (!process.env.SMTP_HOST) {
      this.logger.log(`Reset password URL for ${email}: ${resetUrl}`);
    }

    await this.transporter.sendMail({
      from: process.env.MAIL_FROM ?? process.env.SMTP_FROM ?? `"${appName}" <no-reply@example.com>`,
      to: email,
      subject: 'Reset your password',
      text: `Please reset your password by opening this link: ${resetUrl}`,
      html: `
        <p>Please reset your password by clicking the link below:</p>
        <p><a href="${resetUrl}">Reset password</a></p>
        <p>If the button does not work, open this URL:</p>
        <p>${resetUrl}</p>
      `,
    });
  }

  private createTransporter(): Transporter {
    if (process.env.SMTP_HOST) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth:
          process.env.SMTP_USER && process.env.SMTP_PASS
            ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              }
            : undefined,
      });
    }

    this.logger.warn('SMTP_HOST is not configured. Verification emails will be logged only.');
    return nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
  }
}
