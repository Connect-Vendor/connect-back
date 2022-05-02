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

      const mg = mailgun({apiKey: 'b783b820abd915f8638cf65959f36578-fe066263-dc2b202e', domain: 'sandboxfd103ca353cb4377bf128b7b216a38fb.mailgun.org'});

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
};
