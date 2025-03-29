import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: configService.get('MAIL_HOST'),
      port: configService.get('MAIL_PORT'),
      secure: configService.get('MAIL_SECURE') === 'true', // true for 465, false for 587
      auth: {
        user: configService.get('MAIL_USER'),
        pass: configService.get('MAIL_PASS'),
      },
    });
  }

  async sendMail(options: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
  }) {
    await this.transporter.sendMail({
      from: `"Gigsters" <${this.configService.get('MAIL_FROM')}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
  }
}
