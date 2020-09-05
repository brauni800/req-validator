'use strict';

const Parameter = require('./src/parameters');
const errors = require('./src/error');

module.exports = {
  reqValidator: (options, callback) => (req, res, next) => {
    try {
      req.dto = {};
      for (const [param, data] of Object.entries(options)) {
        const parameter = new Parameter({ ...data, param });
        const { PropertyRequiredError } = errors;
        if (!parameter.type) throw new PropertyRequiredError(parameter.location);
        const paramValue = parameter.validation(req);
        if (parameter.dto) req.dto[param] = paramValue;
      }
      next();
    } catch (error) {
      if (callback && error) callback(error, res);
      else {
        console.error(error.stack);
        res.sendStatus(error.status || 400);
      }
    }
  },
  Parameter,
  ...errors,
};
