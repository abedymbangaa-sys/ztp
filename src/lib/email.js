import emailjs from "@emailjs/browser";

// Utahitaji kujisajili bure kwenye emailjs.com kupata hizi 3:
// 1. SERVICE_ID   - unayoiunda ukiunganisha akaunti yako ya Gmail
// 2. TEMPLATE_ID  - template ya ujumbe (ina {{to_name}}, {{message}}, n.k)
// 3. PUBLIC_KEY   - key ya akaunti yako (Account -> API Keys)
const SERVICE_ID = "service_rykcv58";
const TEMPLATE_ID = "template_nhezsig";
const PUBLIC_KEY = "VUeOBAU6sQajONrXz";

const isConfigured = () =>
  SERVICE_ID !== "YOUR_SERVICE_ID" && TEMPLATE_ID !== "YOUR_TEMPLATE_ID" && PUBLIC_KEY !== "YOUR_PUBLIC_KEY";

export async function sendNotificationEmail({ toEmail, toName, subject, message }) {
  if (!isConfigured()) {
    console.warn("EmailJS haijawekwa bado - email haikutumwa. Angalia src/lib/email.js");
    return { skipped: true };
  }
  try {
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_email: toEmail,
        name: toName,
        subject,
        message,
      },
      { publicKey: PUBLIC_KEY }
    );
    return { success: true };
  } catch (err) {
    console.error("Imeshindwa kutuma email:", err);
    return { error: err };
  }
}
