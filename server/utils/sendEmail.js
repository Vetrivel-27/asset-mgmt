import nodemailer from 'nodemailer';

const sendEmail = async (options) =>{
    const transporter = nodemailer.createTransport({
        host:process.env.EMAIL_HOST,
        port:process.env.EMAIL_PORT,
        secure:false,
        auth:{
            user:process.env.EMAIL_USER,
            pass:process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: `Asset management system <${process.env.EMAIL_USER}>`,
        to:options.email,
        subject:options.subject,
        text:options.text,
        html:options.html
    };

    await transporter.sendMail(mailOptions);
}

export default sendEmail;