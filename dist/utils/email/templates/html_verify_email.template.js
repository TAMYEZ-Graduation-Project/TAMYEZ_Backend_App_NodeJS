const templatesStyle = `
body {
    font-family: 'Segoe UI', Tahoma, sans-serif;
    background: #f4f6f9;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    margin: 0;
}
.container {
    text-align: center;
    background: #fff;
    padding: 30px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    max-width: 400px;
}
.logo img {
    width: 120px;
    margin-bottom: 20px;
}
.status {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 10px;
}
.message {
    font-size: 16px;
    color: #555;
    margin-bottom: 20px;
}
.success {
    color: #28a745;
}
.failure {
    color: #dc3545;
}
.btn {
    display: inline-block;
    padding: 10px 20px;
    background: #007bff;
    color: #fff;
    text-decoration: none;
    border-radius: 6px;
    font-size: 16px;
}
.btn:hover {
    background: #0056b3;
}`;
export const HTML_VERIFY_EMAIL_TEMPLATE = ({ success = true, failureMessage, logoUrl, }) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification</title>
    <style>
    ${templatesStyle}
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <img src="${logoUrl}" alt="TAMYEZ Logo" />
        </div>
        ${success
        ? `
        <div class="status success">Email Verified Successfully!</div>
        <div class="message">Thank you for verifying your email. You can now log in and start using TAMYEZ Application.</div>
        `
        : `
        <div class="status failure">Verification Failed!</div>
        <div class="message">${failureMessage && failureMessage.length
            ? failureMessage
            : "The link is invalid or expired."}</div>
        `}
    </div>
</body>
</html>`;
};
export const HTML_RESTORE_EMAIL_TEMPLATE = ({ success = true, failureMessage, logoUrl, }) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Restoration</title>
    <style>
     ${templatesStyle}
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <img src="${logoUrl}" alt="TAMYEZ Logo" />
        </div>
        ${success
        ? `
        <div class="status success">Email Restored Successfully!</div>
        <div class="message">Thank you for restoring your email. You can now log in and start using TAMYEZ Application.</div>
        `
        : `
        <div class="status failure">Restoration Failed!</div>
        <div class="message">${failureMessage && failureMessage.length
            ? failureMessage
            : "The link is invalid or expired."}</div>
        `}
    </div>
</body>
</html>`;
};
