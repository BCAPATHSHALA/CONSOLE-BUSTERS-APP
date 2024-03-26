import { createTransport } from "nodemailer";

const sendEmail = async (to, subject, text) => {
  try {
    // Create a transporter object using SMTP transport
    const transporter = createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      service: process.env.SMTP_SERVICE,
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Setup email data
    const mailOptions = {
      from: process.env.SMTP_MAIL,
      to,
      subject,
      text,
    };

    // Send mail with defined transport object
    const response = await transporter.sendMail(mailOptions);
    return response;
  } catch (error) {
    return null;
  }
};

export { sendEmail };
