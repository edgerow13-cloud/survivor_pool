import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = 'ed.gerow13@gmail.com'

export async function sendEmail(to: string[], subject: string, html: string) {
  return resend.emails.send({ from: FROM_EMAIL, to, subject, html })
}
