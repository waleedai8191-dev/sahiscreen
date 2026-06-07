import { PlanTier, PLANS } from "@/lib/plans";

export function getVerificationEmailContent(
  planTier: PlanTier,
  otp: string,
  fullName: string,
) {
  const plan = PLANS[planTier] ?? PLANS.free;
  const firstName = fullName.split(" ")[0] || "there";

  const subject =
    planTier === "free"
      ? "Your SahiScreen verification code"
      : `Your SahiScreen verification code — ${plan.name} Plan`;

  const bottomNote =
    planTier === "free"
      ? "Free forever · No credit card required"
      : `PKR ${plan.price.toLocaleString()}/mo after activation · Cancel anytime`;

  const planBadgeColor = planTier === "premium" ? "#5b21b6" : "#7c3aed";

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
                    <span style="font-size:28px;line-height:64px;">✉️</span>
                  </td>
                </tr>
              </table>

              <!-- Greeting -->
              <h1 style="margin:0 0 10px;font-size:22px;font-weight:800;
                         color:#0f172a;letter-spacing:-0.5px;line-height:1.2;">
                Hi ${firstName}, here's your code
              </h1>

              <p style="margin:0 0 28px;font-size:15px;color:#64748b;
                        line-height:1.65;">
                Enter this code to verify your email and activate your
                SahiScreen account. It expires in <strong>10 minutes</strong>.
              </p>

              <!-- OTP Code Box -->
              <table cellpadding="0" cellspacing="0" width="100%"
                style="margin-bottom:28px;">
                <tr>
                  <td align="center"
                    style="background:linear-gradient(135deg,#f3f0ff,#faf5ff);
                           border:2px solid #ddd6fe;border-radius:14px;
                           padding:28px 20px;">
                    <p style="margin:0 0 8px;font-size:11px;font-weight:700;
                               color:#7c3aed;text-transform:uppercase;
                               letter-spacing:1px;">
                      Verification Code
                    </p>
                    <p style="margin:0;font-size:42px;font-weight:800;
                               color:#0f172a;letter-spacing:12px;
                               font-family:'Courier New',monospace;">
                      ${otp}
                    </p>
                    <p style="margin:8px 0 0;font-size:12px;color:#7c3aed;font-weight:600;">
  Click to copy: <a href="mailto:?body=${otp}" 
  style="color:#7c3aed;text-decoration:underline;">${otp}</a>
</p>
                  </td>
                </tr>
              </table>

              <!-- Plan badge -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:${planBadgeColor}1a;border:1px solid ${planBadgeColor}33;
                             border-radius:20px;padding:4px 12px;">
                    <span style="font-size:11px;font-weight:700;color:${planBadgeColor};
                                 text-transform:uppercase;letter-spacing:0.06em;">
                      ${plan.name} Plan · ${planTier === "free" ? "Free Forever" : `PKR ${plan.price.toLocaleString()}/mo`}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table cellpadding="0" cellspacing="0" width="100%"
                style="margin-bottom:24px;">
                <tr>
                  <td style="height:1px;background:#f1f5f9;"></td>
                </tr>
              </table>

              <!-- Features -->
              <table cellpadding="0" cellspacing="0" width="100%"
                style="background:#f8fafc;border:1px solid #e2e8f0;
                       border-radius:10px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0 0 10px;font-size:11px;font-weight:700;
                               color:#94a3b8;text-transform:uppercase;
                               letter-spacing:0.8px;">
                      Your ${plan.name} plan includes
                    </p>
                    ${plan.features
                      .map(
                        (f) => `
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding:4px 0;">
                          <span style="color:#16a34a;font-weight:700;
                                       margin-right:8px;">✓</span>
                          <span style="font-size:13px;color:#374151;
                                       font-weight:500;">${f}</span>
                        </td>
                      </tr>
                    </table>`,
                      )
                      .join("")}
                  </td>
                </tr>
              </table>

              <!-- Security note -->
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                If you didn't create a SahiScreen account, you can safely
                ignore this email. This code expires in 10 minutes.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;background:#f8fafc;
                       border-top:1px solid #f1f5f9;">
              <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;">
                ${bottomNote}
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
