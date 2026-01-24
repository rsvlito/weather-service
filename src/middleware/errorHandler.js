"use strict";

function errorHandler(err, req, res, _next) {
  const status = Number(err.statusCode || 500);

  req.log?.error(
    { status, msg: err.message, upstreamStatus: err.upstreamStatus },
    "request_error"
  );

  if (status >= 500) return res.status(status).json({ error: "Internal error" });
  return res.status(status).json({ error: err.publicMessage || "Request failed" });
}

module.exports = { errorHandler };
