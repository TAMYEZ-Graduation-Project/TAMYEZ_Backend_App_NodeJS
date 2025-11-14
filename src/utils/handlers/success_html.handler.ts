import type { Response } from "express";

function successHtmlHandler({
  res,
  statusCode = 200,
  htmlContent,
}: {
  res: Response;
  statusCode?: number;
  htmlContent: string;
}): Response {
  res.setHeader("Content-Type", "text/html; charset=UTF-8");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' https://raw.githubusercontent.com; style-src 'self' 'unsafe-inline';"
  );

  return res.status(statusCode).send(htmlContent);
}

export default successHtmlHandler;

/*
res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' https://raw.githubusercontent.com; style-src 'self' 'unsafe-inline';"
);

That line sets the Content Security Policy (CSP) header, which controls what 
resources (scripts, styles, images, etc.) the browser is allowed to load for your page.

Breakdown:


 - default-src 'self'
  This means: by default, only load resources (scripts, fonts, etc.) from the same origin as your page (your server).
  'self' refers to your own domain.



 - img-src 'self' https://raw.githubusercontent.com
  This allows images to load from:
    Your own domain ('self')
    GitHub’s raw content domain (https://raw.githubusercontent.com)
  Without this, the browser would block the logo because CSP would forbid external images.



 - style-src 'self' 'unsafe-inline'
  This allows CSS from:
    Your own domain
    Inline styles (like <style> tags or style="..." attributes)
  'unsafe-inline' is needed because your HTML uses inline CSS. Without it, the styles would be blocked.
*/
