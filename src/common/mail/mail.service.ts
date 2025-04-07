import { Injectable } from '@nestjs/common';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private sesClient: SESClient;

  constructor(private readonly configService: ConfigService) {
    const accessKeyId =  process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION;

    if (!accessKeyId || !secretAccessKey || !region) {
      throw new Error('Missing AWS credentials');
    }

    this.sesClient = new SESClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async sendPasswordResetEmail(to: string, resetLink: string) {
    const fromEmail = "noreply@gigsters.app";

    const params = {
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: `
              <p>Hi,</p>
              <p>You requested a password reset.</p>
              <p>Click <a href="${resetLink}">here</a> to reset your password. This link will expire in 15 minutes.</p>
            `,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: 'Reset your password',
        },
      },
      Source: fromEmail,
    };

    const command = new SendEmailCommand(params);

    try {
      await this.sesClient.send(command);
      console.log('✅ Reset email sent via SES');
    } catch (error) {
      console.error('❌ Error sending email with SES:', error);
      throw error;
    }
  }


  async sendActivationEmail(recipientEmail: string, activationLink: string): Promise<void> {
    const subject = 'Welcome to [Your App Name]! Activate Your Account';

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Welcome to [Your App Name]!</h2>
        <p>Hello 👋,</p>
        <p>Thank you for signing up. We're excited to have you on board!</p>
        <p>To start using your account, please activate it by clicking the button below:</p>
        <p style="text-align: center; margin: 20px 0;">
          <a href="${activationLink}" 
             style="background-color: #4CAF50; color: white; padding: 12px 20px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Activate My Account
          </a>
        </p>
        <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
        <p><a href="${activationLink}">${activationLink}</a></p>
        <p>This link will expire in 24 hours.</p>
        <br>
        <p>Thanks,</p>
        <p>The [Your App Name] Team</p>
      </div>
    `;

    const command = new SendEmailCommand({
      Destination: {
        ToAddresses: ["moussanassour1997@gmail.com"],
      },
      Message: {
        Subject: { Data: subject },
        Body: {
          Html: { Data: htmlBody },
        },
      },
      Source: 'noreply@gigsters.app', // Use your verified sender email here
    });

    await this.sesClient.send(command);
  }

  async sendTestEmail() {
    const to = "moussanassour1997@gmail.com" // e.g. your email address
    const fromEmail ="noreply@gigsters.app";
  
    const params = {
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: `
              <h1>Hello from NestJS + AWS SES 🚀</h1>
              <p>This is a test email sent from your NestJS backend using AWS SES.</p>
            `,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: '✅ Test Email from NestJS via AWS SES',
        },
      },
      Source: fromEmail,
    };
  
    const command = new SendEmailCommand(params);
  
    try {
      const result = await this.sesClient.send(command);
      console.log('✅ Test email sent!', result);
      return 'Email sent successfully';
    } catch (error) {
      console.error('❌ Failed to send test email:', error);
      throw error;
    }
  }
  


  async sendForcePasswordResetEmail(email: string, resetLink: string): Promise<void> {
    const html = `
      <h2>Account Locked</h2>
      <p>Your account was locked due to too many failed login attempts.</p>
      <p>Please <a href="${resetLink}">reset your password</a> to unlock your account.</p>
    `;
    await this.sesClient.send(new SendEmailCommand({
      Destination: { ToAddresses: ["moussanassour1997@gmail.com"] },
      Message: {
        Subject: { Data: 'Reset Your Password' },
        Body: { Html: { Data: html } },
      },
      Source: 'noreply@gigsters.app',
    }));
  }
  
}
