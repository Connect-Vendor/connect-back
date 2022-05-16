// const nodemailer = require('nodemailer');
// const SendGridEmail = require('@sendgrid/mail');
const welcomeTemplate = require('./emailTemplates/welcomeTemplate');
const mailgun = require("mailgun-js");
// const DOMAIN = 'YOUR_DOMAIN_NAME';

module.exports = class Email {
  constructor(user, url) {
    // SendGridEmail.setApiKey(process.env.SENDGRID_API_KEY);
    this.to = user.email;
    this.firstName = user.first_name;
    this.lastName = user.last_name;
    this.fullname = `${user.first_name} ${user.last_name}`;
    this.url = url;
    this.from = process.env.EMAIL_FROM;
  }

  async send(template, subject) {
    try {
      const options = {
        to: this.to,
        from: 'kennysuccesskay@gmail.com',
        subject,
        text: 'Welcome to Services.io',
        html: template,
      };

      const mg = mailgun({apiKey: process.env.MAIL_GUN_KEY , domain: process.env.MAIL_GUN_DOMAIN});

     const res = await mg.messages().send(options);

      console.log('Sent', res);
    } catch (error) {
      console.log(error);
      if (error.response) {
        console.error(error.response.body);
      }
    }
  }

  async sendWelcome() {
    const template = welcomeTemplate(
      'Thanks for signing up',
      this.fullname,
      this.url
    );
    await this.send(template, 'Welcome to Services');
  }

  async sendResetPassword(){
    const template = `
      <h2>Password reset Token</h2>
      click on this link to reset password ${this.url}
      Password reset will expire after 10 mins
    
    `
    this.send(template, 'Password reset token');
  }
};
