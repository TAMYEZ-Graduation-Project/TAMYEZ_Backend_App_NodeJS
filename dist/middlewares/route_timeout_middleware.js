function routeTimeoutMiddleware(ms) {
    return (req, res, next) => {
        req.timedout = false;
        const timer = setTimeout(() => {
            req.timedout = true;
            if (!res.headersSent) {
                res.status(503).json({ error: "Request timed out ⏰❌" });
            }
        }, ms);
        res.on("finish", () => clearTimeout(timer));
        res.on("close", () => clearTimeout(timer));
        next();
    };
}
export default routeTimeoutMiddleware;
