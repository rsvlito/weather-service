"use strict";

function validate(schemas) {
  return (req, _res, next) => {
    try {
      if (schemas.query) {
        const parsed = schemas.query.parse(req.query);
        req.query = parsed;
      }
      next();
    } catch (e) {
      e.statusCode = 400;
      e.publicMessage = "Invalid request parameters";
      next(e);
    }
  };
}

module.exports = { validate };
