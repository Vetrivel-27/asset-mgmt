import { Resend } from 'resend';

const sendEmail = async (options) => {
    if (!process.env.RESEND_API_KEY) {
        console.error("RESEND_API_KEY is not defined in environment variables!");
        throw new Error("Email configuration error: RESEND_API_KEY is missing");
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';

    try {
        const { data, error } = await resend.emails.send({
            from: `Asset Flow Portal <${fromEmail}>`,
            to: options.email,
            subject: options.subject,
            html: options.html,
        });

        if (error) {
            console.error("Resend API error:", error);
            throw new Error(error.message);
        }

        console.log(`Email successfully sent to ${options.email} (Resend ID: ${data?.id})`);
    } catch (error) {
        console.error("Error in sendEmail (Resend):", error);
        throw error;
    }
}

export default sendEmail;