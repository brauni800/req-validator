'use strict';

const {
  PropertyRequiredError,
  RegexError,
  TypeError,
} = require('./error');

class Parameter {
  /**
   * @param {object}  data            [description]
   * @param {string}  data.param      [description]
   * @param {string}  data.json       [description]
   * @param {string}  data.type       [description]
   * @param {object}  [data.default]  [description]
   * @param {string}  [data.location] [description]
   * @param {object}  [data.item]     [description]
   * @param {boolean} [data.dto]      [description]
   * @param {string}  [data.regex]    [description]
   */
  constructor(data, param, json) {
    this.json = json;
    this.param = param;
    this.type = 'type' in data ? data.type : undefined;
    this.location = 'location' in data ? data.location : data.param;
    this.default = 'default' in data ? data.default : undefined;
    this.item = 'item' in data ? data.item : undefined;
    this.dto = 'dto' in data ? data.dto : true;
    this.regex = 'regex' in data ? data.regex : undefined;
    this.paramValue = Parameter.extractValue(this.json, this.location);
  }

  /**
   * Extract the value of a parameter in an object.
   * @param {object} json       Object to search the parameter.
   * @param {string} _location  Location of the parameter.
   * @returns {any}             Return the value of the parameter.
   */
  static extractValue(json, _location) {
    const location = _location.split('.').reduce((accumulator, current) => {
      if (/^.*\[[0-9]*\]$/.test(current)) {
        return accumulator.concat(current.split('[').map((key) => key.includes(']') ? key.slice(0, -1) : key));
      } else {
        accumulator.push(current);
        return accumulator;
      }
    }, []);
    return location.reduce((accumulator, current) => {
      if (typeof accumulator !== undefined && accumulator !== null) {
        return accumulator[current];
      }
    }, json);
  }

  /**
   * Validates the type of the parameter.
   * @returns {boolean} Return true if a parameter has the correct type, false in other case.
   */
  isValidType() {
    if (this.isRequired() && this.paramValue === null) return false;
    if (!this.isRequired() && this.paramValue === null) return true;
    switch(this.type) {
      case 'array': return Array.isArray(this.paramValue);
      case 'number':
        const isNumber = !isNaN(this.paramValue);
        if (isNumber) this.paramValue = Number(this.paramValue);
        return isNumber;
      default: return typeof this.paramValue === this.type;
    }
  }

  /**
   * Items of an array are validated, verifying that the properties satisfy the conditions provided by this.item property.
   */
  testItems() {
    for (const [index] of Object.entries(this.paramValue)) {
      new Parameter({ ...this.item, location: `${this.location}[${index}]` }, index, this.json).test();
    }
  }

  /**
   * Determine if the parameter is required.
   * @returns {boolean} Return true if the parameter is required, false in other case.
   */
  isRequired() {
    return this.default === undefined;
  }

  /**
   * Determine if the paramValue match with a regular expression.
   * @returns {boolean} Return true if the match is correct, else in other case.
   */
  matchRegExp() {
    const parseToString = (valueToParse) => {
      switch (typeof valueToParse) {
        case 'object': return JSON.stringify(valueToParse);
        case 'number': return valueToParse + '';
        default: return valueToParse;
      }
    };
    const paramValue = parseToString(this.paramValue);
    if (/^\/.+\/.*$/.test(this.regex)) {
      const regexParts = this.regex.split('/').slice(1);
      const flags = regexParts.pop();
      const regex = regexParts.join('/');
      return new RegExp(regex, flags).test(paramValue);
    } else return new RegExp(this.regex).test(paramValue);
  }

  /**
   * A series of tests are performed to determine the validity of the parameter value.
   */
  test() {
    // type is required
    if (!this.type) throw new PropertyRequiredError(this.location);

    // if is not required, set the default value
    if (!this.isRequired() && (this.paramValue === undefined || this.paramValue === null)) this.paramValue = this.default;

    // type validation and parse the paramValue
    if (!this.isValidType()) throw new TypeError(this.location || this.param, this.type);

    // regex validation
    if (this.regex && !this.matchRegExp()) throw new RegexError(this.location);

    // array items validations
    if (this.type === 'array' && this.item) this.testItems();
  }
}

module.exports = Parameter;
