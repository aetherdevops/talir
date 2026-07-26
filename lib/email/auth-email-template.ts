import type { Locale } from '@/lib/i18n/config'

export type AuthEmailActionType =
    | 'signup'
    | 'invite'
    | 'magiclink'
    | 'recovery'
    | 'email_change'
    | 'email'

export type RenderAuthEmailInput = {
    type: AuthEmailActionType
    locale: Locale
    confirmUrl: string
    token?: string
    siteUrl: string
}

export type RenderAuthEmailResult = {
    subject: string
    html: string
    text: string
}

const COPY: Record<
    Locale,
    Record<
        AuthEmailActionType,
        { subject: string; title: string; body: string; cta: string; codeHint: string; footer: string }
    >
> = {
    mk: {
        signup: {
            subject: 'Потврдете го мејлот на Талир',
            title: 'Потврдете го мејлот',
            body: 'Кликнете на копчето подолу за да ја потврдите сметката на Талир. Линкот важи ограничено време.',
            cta: 'Потврди мејл',
            codeHint: 'Или внесете го овој код ако ви е потребен:',
            footer: 'Ако не сте се регистрирале на Талир, игнорирајте го овој мејл.',
        },
        invite: {
            subject: 'Покана за Талир',
            title: 'Прифатете ја поканата',
            body: 'Поканети сте на Талир. Кликнете подолу за да ја завршите регистрацијата.',
            cta: 'Прифати покана',
            codeHint: 'Или внесете го овој код ако ви е потребен:',
            footer: 'Ако не очекувавте покана, игнорирајте го овој мејл.',
        },
        magiclink: {
            subject: 'Линк за најава на Талир',
            title: 'Најава без лозинка',
            body: 'Кликнете подолу за да се најавите на Талир. Линкот важи ограничено време.',
            cta: 'Најави се',
            codeHint: 'Или внесете го овој код ако ви е потребен:',
            footer: 'Ако не побаравте најава, игнорирајте го овој мејл.',
        },
        recovery: {
            subject: 'Ресетирање на лозинка на Талир',
            title: 'Ресетирајте ја лозинката',
            body: 'Кликнете подолу за да поставите нова лозинка за сметката на Талир.',
            cta: 'Ресетирај лозинка',
            codeHint: 'Или внесете го овој код ако ви е потребен:',
            footer: 'Ако не побаравте ресетирање, игнорирајте го овој мејл.',
        },
        email_change: {
            subject: 'Потврдете ја новата мејл адреса',
            title: 'Потврдете ја промената на мејл',
            body: 'Кликнете подолу за да ја потврдите новата мејл адреса на Талир.',
            cta: 'Потврди мејл',
            codeHint: 'Или внесете го овој код ако ви е потребен:',
            footer: 'Ако не побаравте промена на мејл, игнорирајте го овој мејл.',
        },
        email: {
            subject: 'Потврдете го мејлот на Талир',
            title: 'Потврдете го мејлот',
            body: 'Кликнете на копчето подолу за да ја потврдите сметката на Талир.',
            cta: 'Потврди мејл',
            codeHint: 'Или внесете го овој код ако ви е потребен:',
            footer: 'Ако не сте се регистрирале на Талир, игнорирајте го овој мејл.',
        },
    },
    en: {
        signup: {
            subject: 'Confirm your Talir email',
            title: 'Confirm your email',
            body: 'Click the button below to verify your Talir account. This link expires after a limited time.',
            cta: 'Confirm email',
            codeHint: 'Or enter this code if needed:',
            footer: 'If you did not create a Talir account, you can ignore this email.',
        },
        invite: {
            subject: 'Your invitation to Talir',
            title: 'Accept your invitation',
            body: 'You have been invited to Talir. Click below to finish signing up.',
            cta: 'Accept invite',
            codeHint: 'Or enter this code if needed:',
            footer: 'If you were not expecting an invite, you can ignore this email.',
        },
        magiclink: {
            subject: 'Your Talir sign-in link',
            title: 'Sign in without a password',
            body: 'Click below to sign in to Talir. This link expires after a limited time.',
            cta: 'Sign in',
            codeHint: 'Or enter this code if needed:',
            footer: 'If you did not request a sign-in link, you can ignore this email.',
        },
        recovery: {
            subject: 'Reset your Talir password',
            title: 'Reset your password',
            body: 'Click below to set a new password for your Talir account.',
            cta: 'Reset password',
            codeHint: 'Or enter this code if needed:',
            footer: 'If you did not request a password reset, you can ignore this email.',
        },
        email_change: {
            subject: 'Confirm your new email address',
            title: 'Confirm email change',
            body: 'Click below to confirm your new email address on Talir.',
            cta: 'Confirm email',
            codeHint: 'Or enter this code if needed:',
            footer: 'If you did not request an email change, you can ignore this email.',
        },
        email: {
            subject: 'Confirm your Talir email',
            title: 'Confirm your email',
            body: 'Click the button below to verify your Talir account.',
            cta: 'Confirm email',
            codeHint: 'Or enter this code if needed:',
            footer: 'If you did not create a Talir account, you can ignore this email.',
        },
    },
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

export function renderAuthEmail({
    type,
    locale,
    confirmUrl,
    token,
    siteUrl,
}: RenderAuthEmailInput): RenderAuthEmailResult {
    const copy = COPY[locale][type] ?? COPY[locale].signup
    const safeUrl = escapeHtml(confirmUrl)
    const logoUrl = `${siteUrl.replace(/\/$/, '')}/apple-touch-icon.png`
    const codeBlock =
        token && /^\d{6}$/.test(token)
            ? `<p style="margin:24px 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.5;color:#5A6577;">${escapeHtml(copy.codeHint)}</p>
<p style="margin:0;font-family:'IBM Plex Mono',ui-monospace,'Courier New',monospace;font-size:28px;letter-spacing:0.24em;font-variant-numeric:tabular-nums;color:#0F1F38;">${escapeHtml(token)}</p>`
            : ''

    const html = `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHtml(copy.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#F5F2EA;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F2EA;padding:32px 16px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FBFAF5;border:1px solid rgba(15,31,56,0.12);border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:#0A1424;padding:28px 32px;text-align:center;">
            <img src="${escapeHtml(logoUrl)}" width="48" height="48" alt="Talir" style="display:inline-block;border:0;"/>
            <p style="margin:12px 0 0;font-family:Georgia,'Times New Roman',serif;font-weight:700;font-size:22px;letter-spacing:-0.015em;color:#F5F2EA;">
              Talir<span style="color:#C6A24A;">.</span>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-weight:700;font-size:24px;letter-spacing:-0.015em;color:#0F1F38;">
              ${escapeHtml(copy.title)}
            </h1>
            <p style="margin:0 0 28px;font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.55;color:#5A6577;">
              ${escapeHtml(copy.body)}
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td align="center" style="border-radius:10px;background:#C6A24A;">
                  <a href="${safeUrl}" style="display:inline-block;padding:14px 28px;font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-size:15px;font-weight:600;color:#0A1424;text-decoration:none;">
                    ${escapeHtml(copy.cta)}
                  </a>
                </td>
              </tr>
            </table>
            ${codeBlock}
            <p style="margin:28px 0 0;font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-size:12px;line-height:1.5;color:#5A6577;">
              ${escapeHtml(copy.footer)}
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`

    const textLines = [
        copy.title,
        '',
        copy.body,
        '',
        `${copy.cta}: ${confirmUrl}`,
    ]
    if (token && /^\d{6}$/.test(token)) {
        textLines.push('', copy.codeHint, token)
    }
    textLines.push('', copy.footer)

    return {
        subject: copy.subject,
        html,
        text: textLines.join('\n'),
    }
}
