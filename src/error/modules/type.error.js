'use strict';

const BaseError = require('./base.error');

class TypeError extends BaseError {
  constructor(location, type) {
    super();
    this.message = `Invalid type in ${location}, expected ${type}`;
    this.name = 'TypeError';
  }
}

module.exports = TypeError;
