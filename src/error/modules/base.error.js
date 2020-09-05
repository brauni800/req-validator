'use strict';

class ReqValidatorError extends Error {
  constructor() {
    super();
    this.status = 400;
  }
}

module.exports = ReqValidatorError;
