'use strict';

const BaseError = require('./base.error');

class PropertyRequiredError extends BaseError {
  constructor(location) {
    super();
    this.message = `Property type is required in ${location}`;
    this.name = 'PropertyRequiredError';
  }
}

module.exports = PropertyRequiredError;
