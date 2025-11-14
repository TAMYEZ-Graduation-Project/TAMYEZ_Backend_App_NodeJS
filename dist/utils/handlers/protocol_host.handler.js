const protocolAndHostHanlder = (req, res, next) => {
    if (process.env.PROTOCOL != req.protocol) {
        process.env.PROTOCOL = req.protocol;
    }
    if (process.env.HOST != req.host) {
        process.env.HOST = req.host;
    }
    next();
};
export default protocolAndHostHanlder;
