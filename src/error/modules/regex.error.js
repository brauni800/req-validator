'use strict';

const BaseError = require('./base.error');

class RegexError extends BaseError {
  constructor(location) {
    super();
    this.message = `Invalid regex match in ${location}`;
    this.name = 'RegexError';
  }
}

module.exports = RegexError;
