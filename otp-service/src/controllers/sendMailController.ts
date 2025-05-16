import nodemailer, { Transporter } from 'nodemailer';
import logger from '../utils/logger';

class SendMailController {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: "smtp-relay.sendinblue.com",
      port: 2525, // use 587 (TLS), or 465/2525 if needed
      secure: false, // true for 465, false for 587/2525
      auth: {
        user: '8300b4002@smtp-brevo.com', // your Brevo login (email)
        pass: 'Smt7sh6Zv8QkAG5V'   // your Brevo SMTP key
      }
    });
  }

  async sendMail(email: string, otp: string, organization: string, subject: string, language: 'fr' | 'en' = 'fr'): Promise<void> {
    try {
      // Localize text and HTML based on the language
      const localizedContent = this.localizeEmailContent(otp, organization, language);

      const mailOptions = {
        from: `"${organization}" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: subject,
        text: localizedContent.text,
        html: localizedContent.html,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Sent OTP to ${email} in ${language === 'fr' ? 'French' : 'English'}`);
    } catch (error: any) {
      console.log('error mail:' ,error);
      logger.error(`Failed to send OTP to ${email}:`, error.message);
      throw new Error(`Failed to send OTP to ${email}`);
    }
  }

  private localizeEmailContent(otp: string, organization: string, language: 'fr' | 'en'): { text: string; html: string } {
    if (language === 'fr') {
      // French content
      return {
        text: `Votre OTP est ${otp}`,
        html: this.generateHtmlTemplate(
            otp,
            organization,
            'Votre mot de passe à usage unique (OTP) est :',
            'Vous recevez cet email parce que vous avez demandé un OTP.'
        ),
      };
    } else {
      // English content
      return {
        text: `Your OTP is ${otp}`,
        html: this.generateHtmlTemplate(
            otp,
            organization,
            'Your One-Time Password (OTP) is:',
            'You received this email because you requested an OTP.'
        ),
      };
    }
  }

  private generateHtmlTemplate(otp: string, organization: string, otpMessage: string, description: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>${organization} OTP</title>
              <style>
                  body {
                      font-family: Arial, sans-serif;
                      background-color: #f8f8f8;
                      margin: 0;
                      padding: 0;
                  }
                  .container {
                      max-width: 600px;
                      margin: 0 auto;
                      background-color: #ffffff;
                      border-radius: 5px;
                      box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
                  }
                  .header {
                      background-color: #0073e6;
                      color: #ffffff;
                      padding: 20px;
                      text-align: center;
                      border-top-left-radius: 5px;
                      border-top-right-radius: 5px;
                  }
                  .content {
                      padding: 20px;
                      text-align: center;
                  }
                  .otp {
                      font-size: 32px;
                      font-weight: bold;
                      color: #0073e6;
                  }
                  .footer {
                      border: 1px dashed #cccccc;
                      border-width: 2px 0;
                      padding: 20px;
                      text-align: center;
                  }
                  .footer a {
                      color: #0073e6;
                  }
                  .footer a:hover {
                      text-decoration: underline;
                  }
              </style>
          </head>
          <body>
              <div class="container">
                  <div class="header">
                      <h1>${organization}</h1>
                      <p style="font-size: 14px;color: #ffffff;">
                          ${description}
                      </p>
                  </div>
                  <div class="content">
                      <p>${otpMessage}</p>
                      <p class="otp">${otp}</p>
                  </div>
              </div>
          </body>
      </html>
    `;
  }
}

export default SendMailController;
