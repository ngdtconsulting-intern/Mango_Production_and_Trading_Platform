import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendWelcomeEmail = async (email, name, role) => {
  try {
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: 'Welcome to Mango Platform',
      html: `
        <h2>Welcome to Mango Platform, ${name}!</h2>
        <p>Your account has been successfully created as a <strong>${role}</strong>.</p>
        <p>You can now log in to access all features of our platform.</p>
        <p>
          <a href="${process.env.FRONTEND_URL}/login" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Go to Login
          </a>
        </p>
        <p>If you have any questions, please contact us at ${process.env.ADMIN_EMAIL}</p>
        <hr />
        <p><small>This is an automated email. Please do not reply directly.</small></p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Welcome email sent to ${email}`);
    return info;
  } catch (error) {
    logger.error(`Error sending welcome email: ${error.message}`);
    throw error;
  }
};

export const sendSurveyVerificationEmail = async (email, farmerName, surveyStatus) => {
  try {
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: 'Survey Verification Update - Mango Platform',
      html: `
        <h2>Survey Verification Update</h2>
        <p>Dear ${farmerName},</p>
        <p>Your mango production survey has been <strong>${surveyStatus.toUpperCase()}</strong>.</p>
        <p>Status: <strong style="color: ${surveyStatus === 'verified' ? 'green' : 'orange'}">${surveyStatus}</strong></p>
        <p>You can view your survey details by logging into your account on our platform.</p>
        <p>
          <a href="${process.env.FRONTEND_URL}/farmer/dashboard" style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            View Dashboard
          </a>
        </p>
        <p>Thank you for participating in our survey!</p>
        <hr />
        <p><small>For support, contact ${process.env.ADMIN_EMAIL}</small></p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Survey verification email sent to ${email}`);
    return info;
  } catch (error) {
    logger.error(`Error sending survey verification email: ${error.message}`);
    throw error;
  }
};

export const sendBuyingRequirementNotification = async (email, traderName, variety, quantity) => {
  try {
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: 'New Buying Requirement - Mango Platform',
      html: `
        <h2>New Buying Requirement Posted</h2>
        <p>Dear Farmer,</p>
        <p>A new buying requirement has been posted by <strong>${traderName}</strong> that might interest you!</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Variety:</strong> ${variety}</p>
          <p><strong>Quantity:</strong> ${quantity} MT</p>
        </div>
        <p>Check the buying requirements section in your dashboard to see more details and submit your response.</p>
        <p>
          <a href="${process.env.FRONTEND_URL}/farmer/dashboard" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            View Details
          </a>
        </p>
        <hr />
        <p><small>This is an automated email notification.</small></p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Buying requirement notification sent to ${email}`);
    return info;
  } catch (error) {
    logger.error(`Error sending buying requirement email: ${error.message}`);
    throw error;
  }
};

export const sendPriceUpdateNotification = async (email, market, variety, newPrice) => {
  try {
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: `Price Update: ${variety} at ${market} Market`,
      html: `
        <h2>Market Price Update</h2>
        <p>Dear User,</p>
        <p>The price for <strong>${variety}</strong> at <strong>${market}</strong> market has been updated.</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Market:</strong> ${market}</p>
          <p><strong>Variety:</strong> ${variety}</p>
          <p><strong>Current Wholesale Price:</strong> Rs. ${newPrice.wholesalePrice}/kg</p>
          <p><strong>Current Retail Price:</strong> Rs. ${newPrice.retailPrice}/kg</p>
          <p><strong>Updated on:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        <p>Log in to your account to view all market prices and trends.</p>
        <p>
          <a href="${process.env.FRONTEND_URL}/farmer/market" style="background-color: #FF9800; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            View Market Prices
          </a>
        </p>
        <hr />
        <p><small>Stay updated with latest market information.</small></p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Price update email sent to ${email}`);
    return info;
  } catch (error) {
    logger.error(`Error sending price update email: ${error.message}`);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email, resetLink) => {
  try {
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: 'Password Reset - Mango Platform',
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password on Mango Platform.</p>
        <p>Click the link below to reset your password:</p>
        <p>
          <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Reset Password
          </a>
        </p>
        <p>Or copy and paste this link in your browser:</p>
        <p>${resetLink}</p>
        <p><strong>Note:</strong> This link will expire in 24 hours.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr />
        <p><small>For security, do not share this link with anyone.</small></p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Password reset email sent to ${email}`);
    return info;
  } catch (error) {
    logger.error(`Error sending password reset email: ${error.message}`);
    throw error;
  }
};

export const sendResponseNotificationToTrader = async (email, traderName, farmerName, variety, quantity, price) => {
  try {
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: `New Response to Your Buying Requirement - ${variety}`,
      html: `
        <h2>New Response to Your Buying Requirement</h2>
        <p>Dear ${traderName},</p>
        <p>A farmer has responded to your buying requirement for <strong>${variety}</strong>!</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Farmer Name:</strong> ${farmerName}</p>
          <p><strong>Variety:</strong> ${variety}</p>
          <p><strong>Available Quantity:</strong> ${quantity} kg</p>
          <p><strong>Proposed Price:</strong> Rs. ${price}/kg</p>
        </div>
        <p>Log in to your account to view the full details and communicate with the farmer.</p>
        <p>
          <a href="${process.env.FRONTEND_URL}/trader/dashboard" style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            View Response
          </a>
        </p>
        <hr />
        <p><small>Respond quickly to secure the best deals!</small></p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Response notification sent to trader ${email}`);
    return info;
  } catch (error) {
    logger.error(`Error sending response notification: ${error.message}`);
    throw error;
  }
};

export const sendMonthlyReportEmail = async (email, userName, stats) => {
  try {
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: 'Monthly Report - Mango Platform',
      html: `
        <h2>Your Monthly Report</h2>
        <p>Dear ${userName},</p>
        <p>Here's your activity summary for this month:</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Total Production:</strong> ${stats.totalProduction} kg</p>
          <p><strong>Total Earnings:</strong> Rs. ${stats.totalEarnings}</p>
          <p><strong>Surveys Submitted:</strong> ${stats.surveyCount}</p>
          <p><strong>Average Satisfaction:</strong> ${stats.avgSatisfaction}/10</p>
        </div>
        <p>Keep up the good work! Regular engagement helps us serve you better.</p>
        <p>
          <a href="${process.env.FRONTEND_URL}/farmer/dashboard" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            View Dashboard
          </a>
        </p>
        <hr />
        <p><small>Questions? Contact us at ${process.env.ADMIN_EMAIL}</small></p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Monthly report sent to ${email}`);
    return info;
  } catch (error) {
    logger.error(`Error sending monthly report: ${error.message}`);
    throw error;
  }
};

export default {
  sendWelcomeEmail,
  sendSurveyVerificationEmail,
  sendBuyingRequirementNotification,
  sendPriceUpdateNotification,
  sendPasswordResetEmail,
  sendResponseNotificationToTrader,
  sendMonthlyReportEmail,
};