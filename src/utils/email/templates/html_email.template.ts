const HTML_EMAIL_TEMPLATE = ({
  title,
  message,
  otpOrLink,
  company = process.env.APP_NAME,
}: {
  title: string;
  message: string;
  otpOrLink: string;
  company?: string;
}): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      background-color: #f4f6f8;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background-color: #004aad;
      color: white;
      padding: 20px;
      text-align: center;
    }
    .header img {
      max-width: 100px;
      margin-bottom: 10px;
    }
    .content {
      padding: 30px;
      text-align: center;
    }
    .content h2 {
      color: #004aad;
      margin-bottom: 10px;
    }
    .content p {
      color: #333;
      font-size: 16px;
      margin-bottom: 20px;
    }
    .otp-box {
      font-size: 24px;
      font-weight: bold;
      color: #004aad;
      background-color: #eaf1fb;
      padding: 15px;
      border-radius: 6px;
      margin: 20px auto;
      letter-spacing: 4px;
      display: inline-block;
    }
    .footer {
      font-size: 12px;
      color: #888;
      text-align: center;
      padding: 15px;
      border-top: 1px solid #eee;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://your-server.com/logo.png" alt="TAMYEZ Logo" />
      <h1>TAMYEZ Application</h1>
    </div>
    <div class="content">
      <h2>${title}</h2>
      <p>${message}</p>
      <div class="otp-box">${otpOrLink}</div>
      <p>This code or link will expire in 10 minutes. If you did not request this, please ignore this email.</p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} TAMYEZ Application. All rights reserved.
    </div>
  </div>
</body>
</html>
`;
};

export default HTML_EMAIL_TEMPLATE;
