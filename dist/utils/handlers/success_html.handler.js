function responseHtmlHandler({ res, statusCode = 200, htmlContent, }) {
    res.setHeader("Content-Type", "text/html; charset=UTF-8");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self' https://raw.githubusercontent.com; style-src 'self' 'unsafe-inline';");
    return res.status(statusCode).send(htmlContent);
}
export default responseHtmlHandler;
