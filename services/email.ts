import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface AlertEmailData {
  to: string;
  contractName: string;
  reportTitle: string;
  expirationDate: string;
  daysUntilExpiration?: number;
}

export async function sendExpirationAlert({
  to,
  contractName,
  reportTitle,
  expirationDate,
  daysUntilExpiration,
}: AlertEmailData) {
  const subject = daysUntilExpiration
    ? `[ManuFlow] ${reportTitle} vence em ${daysUntilExpiration} dias`
    : `[ManuFlow] ${reportTitle} vencendo`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0F766E; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .alert { padding: 15px; border-radius: 5px; margin: 10px 0; }
          .alert-warning { background: #FEF3C7; border-left: 4px solid #D97706; }
          .alert-danger { background: #FEE2E2; border-left: 4px solid #DC2626; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ManuFlow - Alerta de Vencimento</h1>
          </div>
          <div class="content">
            <div class="alert ${daysUntilExpiration ? 'alert-warning' : 'alert-danger'}">
              <h2>${daysUntilExpiration ? `Vencimento em ${daysUntilExpiration} dias` : 'LAUDO VENCIDO'}</h2>
            </div>
            <p><strong>Contrato:</strong> ${contractName}</p>
            <p><strong>Laudo:</strong> ${reportTitle}</p>
            <p><strong>Data de Vencimento:</strong> ${expirationDate}</p>
            <p>Acesse o sistema para renovar ou atualizar o laudo.</p>
          </div>
          <div class="footer">
            <p>ManuFlow - Sistema de Gestão Técnica</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const data = await resend.emails.send({
      from: "ManuFlow <noreply@manuflow.com.br>",
      to: [to],
      subject,
      html,
    });

    return { success: true, data };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}

export async function sendBatchAlerts(emails: AlertEmailData[]) {
  const results = [];
  const maxEmailsPerDay = 100;
  const emailsToSend = emails.slice(0, maxEmailsPerDay);

  for (const email of emailsToSend) {
    const result = await sendExpirationAlert(email);
    results.push(result);
    
    if (!result.success) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return {
    total: emails.length,
    sent: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
  };
}
