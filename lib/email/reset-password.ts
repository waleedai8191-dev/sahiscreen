export function getResetPasswordEmailContent(
  fullName: string,
  resetUrl: string,
) {
  const firstName = fullName.split(" ")[0] || "there";

  const subject = "Reset your SahiScreen password";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0"
          style="max-width:520px;background:#ffffff;border-radius:16px;
                 border:1px solid #e2e8f0;overflow:hidden;">

          <!-- Top accent bar -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#7c3aed,#5b21b6);"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #f1f5f9;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:36px;height:36px;background:linear-gradient(135deg,#7c3aed,#5b21b6);
                             border-radius:9px;text-align:center;vertical-align:middle;">
                    <span style="font-size:18px;line-height:36px;">⚡</span>
                  </td>
                  <td style="padding-left:10px;vertical-align:middle;">
                    <span style="font-size:17px;font-weight:800;color:#0f172a;
                                 letter-spacing:-0.3px;">SahiScreen</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">

              <!-- Icon -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="width:64px;height:64px;background:#f3f0ff;border-radius:50%;
                             text-align:center;vertical-align:middle;">
                    <span style="font-size:28px;line-height:64px;">🔐</span>
                  </td>
                </tr>
              </table>

              <!-- Greeting -->
              <h1 style="margin:0 0 10px;font-size:22px;font-weight:800;
                         color:#0f172a;letter-spacing:-0.5px;line-height:1.2;">
                Hi ${firstName}, reset your password
              </h1>

              <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.65;">
                We received a request to reset your SahiScreen password.
                Click the button below to choose a new one.
                This link expires in <strong>15 minutes</strong>.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:linear-gradient(135deg,#7c3aed,#5b21b6);
                             border-radius:10px;">
                    <a href="${resetUrl}"
                       style="display:inline-block;padding:14px 32px;
                              font-size:15px;font-weight:700;color:#ffffff;
                              text-decoration:none;letter-spacing:-0.2px;">
                      Reset Password →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
                <tr>
                  <td style="height:1px;background:#f1f5f9;"></td>
                </tr>
              </table>

              <!-- Security note -->
              <table cellpadding="0" cellspacing="0" width="100%"
                style="background:#fefce8;border:1px solid #fde68a;
                       border-radius:10px;margin-bottom:24px;">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
                      ⚠️ <strong>Didn't request this?</strong> Your account is safe —
                      simply ignore this email. The link will expire automatically.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Fallback link -->
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                Button not working? Copy and paste this link:<br/>
                <a href="${resetUrl}"
                   style="color:#7c3aed;word-break:break-all;font-size:11px;">
                  ${resetUrl}
                </a>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;background:#f8fafc;border-top:1px solid #f1f5f9;">
              <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;">
                This link expires in 15 minutes · Do not share it with anyone
              </p>
              <p style="margin:0;font-size:12px;color:#cbd5e1;">
                © 2026 SahiScreen · Pakistan's AI Hiring Platform
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
