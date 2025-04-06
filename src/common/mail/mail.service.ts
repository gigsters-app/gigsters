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
  
}
