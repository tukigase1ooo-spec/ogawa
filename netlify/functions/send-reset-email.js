exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let to, resetUrl;
  try {
    ({ to, resetUrl } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, body: 'Invalid request' };
  }

  if (!to || !resetUrl) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing parameters' }) };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { statusCode: 200, body: JSON.stringify({ ok: false, error: 'not_configured' }) };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'OGAWA ADMIN <onboarding@resend.dev>',
        to: [to],
        subject: 'パスワードリセットのご案内 — OGAWA ADMIN',
        html: `
<div style="background:#0a0a0a;color:#f0f0f0;font-family:'Helvetica Neue',Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:40px 32px;">
  <p style="font-family:Georgia,serif;font-size:1.1rem;letter-spacing:0.35em;color:#f90091;margin:0 0 28px;">OGAWA ADMIN</p>
  <p style="margin:0 0 10px;line-height:1.85;font-size:0.92rem;">
    パスワードリセットのリクエストを受け付けました。<br>
    以下のボタンから新しいパスワードを設定してください。
  </p>
  <p style="font-size:0.76rem;color:#888;margin:0 0 28px;">有効期限：リクエストから <strong style="color:#f90091;">1時間</strong></p>
  <a href="${resetUrl}"
     style="display:inline-block;padding:13px 32px;background:#f90091;color:#fff;
            text-decoration:none;font-weight:bold;letter-spacing:0.12em;font-size:0.82rem;">
    パスワードをリセットする
  </a>
  <hr style="border:none;border-top:1px solid #1e1e1e;margin:32px 0;">
  <p style="font-size:0.7rem;color:#555;line-height:1.8;">
    このメールに心当たりがない場合は無視してください。<br>
    リンクは有効期限後に自動的に無効になります。
  </p>
</div>`,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Resend API error:', err);
      return { statusCode: 200, body: JSON.stringify({ ok: false, error: 'send_failed' }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('Function error:', err);
    return { statusCode: 200, body: JSON.stringify({ ok: false, error: 'network_error' }) };
  }
};
