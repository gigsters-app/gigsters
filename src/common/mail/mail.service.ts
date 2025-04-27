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
        ToAddresses: ["moussanassour1997@gmail.com","nikolliervin@gmail.com"],
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: `
  <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f9fbfd; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden;">
      
      <!-- Header -->
      <div style="background-color: #0070f3; padding: 20px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 22px;">🔑 Password Reset Request</h1>
      </div>
      
      <!-- Body -->
      <div style="padding: 30px; color: #333333; line-height: 1.6; font-size: 15px;">
        <p style="margin-bottom: 16px;">Hey there 👋,</p>
        <p style="margin-bottom: 24px;">
          We got a request to reset your password. No worries—it happens to the best of us!
        </p>
        
        <!-- Reset Button -->
        <div style="text-align: center; margin-bottom: 24px;">
          <a
            href="${resetLink}"
            style="
              background-color: #0070f3;
              color: #ffffff;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 4px;
              font-size: 16px;
              display: inline-block;
            "
          >
            Reset My Password
          </a>
        </div>
        
        <!-- Fallback Link & Expiry Notice -->
        <p style="font-size: 13px; color: #666666; margin-bottom: 8px;">
          This link will expire in <strong>15 minutes</strong>.
        </p>
        <p style="font-size: 13px; color: #666666;">
          If the button doesn’t work, copy &amp; paste this URL into your browser:
          <br/>
          <a href="${resetLink}" style="color: #0070f3; word-break: break-all;">
            ${resetLink}
          </a>
        </p>
        
        <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;">
        
        <p style="font-size: 13px; color: #333333;">
          Didn’t request a reset? You can safely ignore this email—your password stays just as is.
        </p>
      </div>
      
    </div>
    
    <!-- Footer -->
    <p style="text-align: center; font-size: 12px; color: #aaaaaa; margin-top: 20px;">
      © ${new Date().getFullYear()} Gigsters. All rights reserved.
    </p>
  </div>
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
    const subject = 'Welcome to Gigsters! Activate Your Account';

    const htmlBody = `
  <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f7f9fc; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      
      <!-- Header -->
      <div style="background-color: #0052cc; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🚀 Welcome to Gigsters!</h1>
      </div>
      
      <!-- Body -->
      <div style="padding: 30px; color: #333333; line-height: 1.6;">
        <p style="font-size: 16px; margin-bottom: 16px;">
          Hey there 👋,
        </p>
        <p style="font-size: 16px; margin-bottom: 16px;">
          Fantastic to have you join the Gigsters community! We’re all about empowering freelancers and small businesses to shine.
        </p>
        <p style="font-size: 16px; margin-bottom: 24px;">
          Let’s get you set up—activate your account by clicking the button below:
        </p>
        
        <!-- Activation Button -->
        <div style="text-align: center; margin-bottom: 30px;">
          <a
            href="${activationLink}"
            style="
              background-color: #0052cc;
              color: #ffffff;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 4px;
              font-size: 16px;
              display: inline-block;
            "
          >
            Activate My Account
          </a>
        </div>
        
        <!-- Fallback Link -->
        <p style="font-size: 14px; color: #666666; margin-bottom: 4px;">
          Can’t click the button? Copy &amp; paste this link into your browser:
        </p>
        <p style="font-size: 14px; color: #0052cc; word-break: break-all; margin-bottom: 24px;">
          <a href="${activationLink}" style="color: #0052cc;">${activationLink}</a>
        </p>
        <p style="font-size: 14px; color: #666666; margin-bottom: 30px;">
          (This link expires in <strong>24 hours</strong>.)
        </p>
        
        <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #333333; margin-bottom: 16px;">
          Need a hand? Reply to this email or visit our 
          <a href="https://gigsters.support" style="color: #0052cc;">Support Center</a>.
        </p>
        
        <p style="font-size: 14px; color: #333333;">
          Cheers,<br>
          <strong>The Gigsters Team</strong> 🎉
        </p>
      </div>
      
    </div>
    
    <!-- Footer -->
    <p style="text-align: center; font-size: 12px; color: #aaaaaa; margin-top: 20px;">
      © ${new Date().getFullYear()} Gigsters. All rights reserved.
    </p>
  </div>
`;


    const command = new SendEmailCommand({
      Destination: {
        ToAddresses: ["moussanassour1997@gmail.com","nikolliervin@gmail.com"],
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
  <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f2f4f8; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden;">
      
      <!-- Header -->
      <div style="background-color: #d32f2f; color: #ffffff; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 22px;">🔒 Oops, Your Account’s on Pause!</h1>
      </div>
      
      <!-- Body -->
      <div style="padding: 30px; color: #333333; line-height: 1.6; font-size: 15px;">
        <p style="margin-bottom: 16px;">
          Hey there 👋,
        </p>
        <p style="margin-bottom: 16px;">
          We noticed a few too many sign‑in attempts and temporarily locked your account to keep it safe.
        </p>
        <p style="margin-bottom: 24px;">
          No worries—you can get back in action right away. Just click the button below to reset your password and unlock your account:
        </p>
        
        <!-- Reset Button -->
        <div style="text-align: center; margin-bottom: 30px;">
          <a
            href="${resetLink}"
            style="
              background-color: #d32f2f;
              color: #ffffff;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 4px;
              font-size: 16px;
              display: inline-block;
            "
          >
            Reset My Password
          </a>
        </div>
        
        <!-- Fallback Link -->
        <p style="font-size: 14px; color: #666666; margin-bottom: 4px;">
          If that doesn’t work, copy &amp; paste this link into your browser:
        </p>
        <p style="font-size: 14px; color: #d32f2f; word-break: break-all; margin-bottom: 24px;">
          <a href="${resetLink}" style="color: #d32f2f;">${resetLink}</a>
        </p>
        
        <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #333333; margin-bottom: 16px;">
          Have questions or need help? Just reply to this email or visit our 
          <a href="https://gigsters.support" style="color: #d32f2f;">Support Center</a>.
        </p>
        
        <p style="font-size: 14px; color: #333333;">
          Stay safe,<br>
          <strong>The Gigsters Security Team</strong> 🔐
        </p>
      </div>
      
    </div>
    
    <!-- Footer -->
    <p style="text-align: center; font-size: 12px; color: #aaaaaa; margin-top: 20px;">
      © ${new Date().getFullYear()} Gigsters. All rights reserved.
    </p>
  </div>
`;
    await this.sesClient.send(new SendEmailCommand({
      Destination: { ToAddresses: ["moussanassour1997@gmail.com","nikolliervin@gmail.com"] },
      Message: {
        Subject: { Data: 'Reset Your Password' },
        Body: { Html: { Data: html } },
      },
      Source: 'noreply@gigsters.app',
    }));
  }
  
}
