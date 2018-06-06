import * as nodemailer from 'nodemailer';
import * as EmailTemplate from 'email-templates';
import * as path from 'path';
import { SentMessageInfo } from 'nodemailer/lib/sendmail-transport';


export default class Mailer {
  private mailer: EmailTemplate;
  private templatePath: string;

  constructor(username: string, name: string, password: string, server: string, port: number, templatePath: string, send: boolean = false) {
    // create new reusable transporter
    let transport = `smtps://${encodeURIComponent(username)}:${password}@${server}`;
    this.mailer = new EmailTemplate({
      message: {
        from: `"${name}" <${username}>`
      },
      transport,
      send,
      views: {
        options: {
          extension: 'ejs'
        }
      }
    });

    // set default path
    this.templatePath = templatePath;
  }

  public async sendTemplate(templateName: string, to: string, locals: any) : Promise<boolean> {
    // send email with template
    let result = await this.mailer.send({
      template: path.join(this.templatePath, templateName),
      message: {
        to
      },
      locals
    });

    // make sure email was sent
    return (result && result.accepted && result.accepted.length >= 1);
  }

}