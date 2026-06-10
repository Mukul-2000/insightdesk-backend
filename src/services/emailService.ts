import nodemailer from 'nodemailer';

// Initialize the SMTP carrier transporter configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false, // true for 465, false for other ports like 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export class EmailService {
    /**
     * SENDS A BEAUTIFULLY STYLED PASSWORD RECOVERY EMAIL
     */
    static async sendPasswordResetEmail(toEmail: string, resetUrl: string, userName: string): Promise<void> {
        const mailOptions = {
            from: `"InsightDesk Core" <${process.env.FROM_EMAIL}>`,
            to: toEmail,
            subject: '🔒 Reset Your InsightDesk Account Password',
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 16px;">
                    <div style="margin-bottom: 24px;">
                        <span style="font-size: 18px; font-weight: 800; color: #09090b; letter-spacing: -0.025em;">InsightDesk</span>
                        <div style="font-size: 10px; color: #a1a1aa; font-family: monospace; text-transform: uppercase; margin-top: 2px;">Workspace Engine</div>
                    </div>
                    
                    <h2 style="font-size: 16px; font-weight: 700; color: #09090b; margin-top: 0; margin-bottom: 8px;">Password Reset Request</h2>
                    <p style="font-size: 13px; color: #52525b; line-height: 1.5; margin-top: 0; margin-bottom: 20px;">
                        Hi ${userName},<br/>
                        We received a request to reset your InsightDesk account access credentials. Click the secure link below to update your password parameters. This link is active for the next 15 minutes.
                    </p>
                    
                    <div style="margin-bottom: 24px;">
                        <a href="${resetUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 13px; font-weight: 600; text-decoration: none; padding: 10px 18px; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.1);">
                            Reset Password
                        </a>
                    </div>
                    
                    <p style="font-size: 11px; color: #a1a1aa; line-height: 1.4; margin-top: 0; margin-bottom: 16px;">
                        If you did not request this modification, you can safely ignore this communication—your current account security remains perfectly intact.
                    </p>
                    
                    <div style="border-top: 1px solid #f4f4f5; padding-top: 16px; font-size: 10px; color: #a1a1aa; font-family: monospace;">
                        &copy; ${new Date().getFullYear()} InsightDesk Core Node.
                    </div>
                </div>
            `,
        };

        // Fire transaction out over cloud SMTP routers
        await transporter.sendMail(mailOptions);
    }
}