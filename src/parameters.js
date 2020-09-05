'use strict';

const {
  PropertyRequiredError,
  RegexError,
  TypeError,
} = require('./error');

/**
 * [description]
 */
class Parameter {
  /**
   * @param {object} data            [description]
   * @param {string} data.type       [description]
   * @param {object} [data.default]  [description]
   * @param {string} [data.location] [description]
   * @param {object} [data.item]     [description]
   * @param {boolean} [data.dto]     [description]
   * @param {string} [data.regex]    [description]
   */
  constructor(data) {
    this.param = data.param;
    this.type = 'type' in data ? data.type : undefined;
    this.location = 'location' in data ? data.location : data.param;
    this.default = 'default' in data ? data.default : undefined;
    this.item = 'item' in data ? data.item : undefined;
    this.dto = 'dto' in data ? data.dto : true;
    this.regex = 'regex' in data ? data.regex : undefined;
  }

  /**
   * Gets the value of a parameter
   * @param {object} json  Object to search the parameter.
   * @returns {any}        Return the value of the parameter.
   */
  getParamValue(json) {
    const location = this.location.split('.').reduce((accumulator, current) => {
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
   * @param {any} param Parameter to validate.
   * @returns {boolean} Return true if a parameter has the correct type, false in other case.
   */
  isValidType(param) {
    return (this.type !== 'array' && typeof param === this.type) ||
        (this.type === 'array' && Array.isArray(param)) ||
        (!this.isRequired() && param === null);
  }

  /**
   * Items of an array are validated, verifying that the properties satisfy the conditions provided by this.item property.
   * @param {Array} items Array of values to validate.
   * @param {object} json Object to search the array and its elements.
   */
  validItems(items, json) {
    for (const [index] of Object.entries(items)) {
      const parameter = new Parameter({ ...this.item, location: `${this.location}[${index}]`, param: index });
      if (!parameter.type) throw new PropertyRequiredError(`${this.location}[${index}]`);
      parameter.validation(json);
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
   * Determine if a value match with a regular expression.
   * @param {any} value Value to match with the regular expression. Can be a number, string or JSON.
   * @returns {boolean} Return true if the match is correct, else in other case.
   */
  matchRegExp(value) {
    const parseToString = (valueToParse) => {
      switch (typeof valueToParse) {
        case 'object': return JSON.stringify(valueToParse);
        case 'number': return valueToParse + '';
        default: return valueToParse;
      }
    };
    const paramValue = parseToString(value);
    if (/^\/.+\/.*$/.test(this.regex)) {
      const regexParts = this.regex.split('/').slice(1);
      const flags = regexParts.pop();
      const regex = regexParts.join('/');
      return new RegExp(regex, flags).test(paramValue);
    } else return new RegExp(this.regex).test(paramValue);
  }

  /**
   * The value of a parameter is found in an object, the data type is validated,
   * it decide if is required, and if is an array, its elements are validated.
   * @param {object} json Object to search the parameter.
   * @returns {any}       Parameter value.
   */
  validation(json) {
    let paramValue = this.getParamValue(json);
    if (!this.isRequired(paramValue) && (paramValue === undefined || paramValue === null)) paramValue = this.default;
    if (!this.isValidType(paramValue)) throw new TypeError(this.location || this.param, this.type);
    if (this.regex) {
      if (!this.matchRegExp(paramValue)) throw new RegexError(this.location);
    }
    if (this.type === 'array' && this.item) this.validItems(paramValue, json);
    return paramValue;
  }
}

module.exports = Parameter;
