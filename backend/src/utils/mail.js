import { text } from "express";
import Mailgen from "mailgen";
import nodemailer from "nodemailer";

// Send Mail Configuration with Mailgen
const sendEmail = async (options) => {
  // Step 1: Initialize mailgen instance with default theme and brand configuration
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Console Busters",
      link: "https://www.linkedin.com/in/manojoffcialmj/",
    },
  });

  // Step 2: Generate the plaintext version of the e-mail (for clients that do not support HTML)
  const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent);

  // Step 3: Generate an HTML email with the provided contents
  const emailHtml = mailGenerator.generate(options.mailgenContent);

  // Step 4: Create a nodemailer transporter instance which is responsible to send a mail
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    service: process.env.SMTP_SERVICE,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  // Step 5: Create the mail metadata
  const mail = {
    from: "manojofficialmj@gmail.com",
    to: options.email,
    subject: options.subject,
    text: emailTextual,
    html: emailHtml,
  };

  // Step 6: Send mail to the user's email
  try {
    const response = await transporter.sendMail(mail);
    return response;
  } catch (error) {
    return null;
  }
};

// It designs the email verification mail
const emailVerificationMailgenContent = (username, verificationUrl) => {
  return {
    body: {
      name: username,
      intro: "Welcome to our Console Busters Portfolio Builder",
      action: {
        instructions:
          "To verify your email please click on the following button:",
        button: {
          color: "#22BC66",
          text: "Verify your email",
          link: verificationUrl,
        },
      },
      outro:
        "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};

// It designs the forgot password mail
const forgotPasswordMailgenContent = (username, passwordResetUrl) => {
  return {
    body: {
      name: username,
      intro: "We got a request to reset the password of our account",
      action: {
        instructions:
          "To reset your password click on the following button or link:",
        button: {
          color: "#006d77",
          text: "Reset password",
          link: passwordResetUrl,
        },
      },
      outro:
        "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};

// It designs the two step verification OTP mail
const twoStepVerificationOTPMailgenContent = (username, randomOTP) => {
  return {
    body: {
      name: username,
      intro:
        "We received a request to verify your account with a two-step verification process.",
      action: {
        instructions: `Please use the following OTP (One-Time Password) to complete the verification process`,
        button: {
          color: "#e63946",
          text: randomOTP,
          link: "#",
        },
      },
      outro:
        "If you did not request this verification or need further assistance, please contact us immediately.",
    },
  };
};

export {
  sendEmail,
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
  twoStepVerificationOTPMailgenContent,
};
