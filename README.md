# req-validator

Express middleware to validate a request data.

* [Installation](#installation)
* [Quick Usage](#quick-usage)
  * [Request example](#request-example)
  * [Express Server](#express-server)
* [reqValidator](#reqvalidator(options-[,-callback]))
  * [options](#options-{-key:-value-})
    * [key](#key)
    * [value (rules)](#value-rules)
* [callback](#callback(err,-res)-[optional])
* [Error handling](#error-handling)

## Installation
```sh
$ npm install @brauni800/req-validator
```

## Quick Usage
### Request example
```json
{
  ...

  "query": {
    "id": "123456"
  },
  "body": {
    "foo": "example",
    "num": 10
  },

  ...
}
```
### Express server
```javascript
const app = require('express')();
const { reqValidator } = require('req-validator');

const options = {
  id: { type: 'string', location: 'query.id' },
  fooKey: { type: 'string', location: 'body.foo' },
  numKey: { type: 'number', location: 'body.num' },
};

// optional parameter
const callback = (err, res) => {
  if (err) {
    console.error(err.stack);
    res.status(400).send(err.message);
  }
};

app.post('/', reqValidator(options, callback), (req, res) => {
  console.log(req.dto);
  res.sendStatus(200);
});

app.listen();

//  console output
//
//  dto {
//    id: '123456',
//    fooKey: 'example',
//    numKey: 10
//  }
```

## reqValidator(options [, callback])
Receive 2 parameters: `options` and a `callback`. The only required parameter is `options`.
In `options` you can define all rules that you want to validate by a JSON object.
Then an object called `dto` will be attached to the request object that will contain all the parameters validated by this function.

### options { key: value }
#### key
Name that the parameter receives in the data that is attached to the Request. If the location rule is not defined, the key must have the name of the original parameter.
#### value (rules)
JSON object that contains the validation rules for this parameter. Here you can see all rules that you can define:

* `type`: Data type of the parameter, possible values:
  - `string`
  - `number`
  - `boolean`
  - `object`
  - `array`
* `location`: [Optional] By default `location` will be the same as `key`. You can define a `location` to search the parameter in an object.
Example:
```json
// Request
{
  ...

  "query": {
    "id": "123456"
  },
  "body": {
    "foo": 10
  },
  "params": {
    "bars": []
  },

  ...
}



// Rules
{
  "body": { "type": "object" }, // location = body
  "myId": { "type": "string", "location": "body.id" },
  "foo": { "type": "number", "location": "body.foo" },
  "bars": { "type": "array", "location": "body.bars" },
}



// Request dto
{
  "body": {
    "foo": 10
  },
  "myId": "123456",
  "foo": 10,
  "bars": []
}
```
* `default`: [Optional] By default, all parameters in validation options are required in request. If you define a default value, the parameter becomes optional. You can define default as `null` if you don't want to define a default value but if you want it to be an optional parameter. Default value must be the same type as the `type` property.
* `item`: [Optional] Only works when `type` is `array`. You can pass new validation rules here. All items in an array parameter will be validated.
Example:
```json
// Rules
{
  ...

  "foo": {
    "type": "array",
    "location": "body.foo",
    "item": {
      "type": "string"
    },
  },

  ...
}

// Request
{ "foo": [ "example" ] } // accepted

{ "foo": [ 5, 10 ] } // rejected

{ "foo": [ 5, "example", 10 ] } // rejected
```
* `dto`: [Optional] By default `dto` is true. You can set `dto` as false if you don't want attach this parameter to the Request dto object.
* `regex`: [Optional] You can define a regular expression, the middleware will validate if the parameter match with the condition. It will return an error in case the condition fails.

## callback(err, res) [optional]
By default this middleware already has its own error handling but if you want to handle errors, you must pass a function as a second parameter. You will receive an error object and a response object.

```javascript
const callback = (err, res) => {
  if (err) {
    console.error(err.stack);
    res.status(400).send(err.message);
  }
};
```

## Error handling
You can also identify the errors that the middleware provides with the `instanceof` operator and the error class. Here you can see a list of the error classes:
| class | description |
|---|---|
| `ReqValidatorError` | The rest of the classes inherit from this class, useful when you want to determine if the error comes from some validation of the middleware. |
| `PropertyRequiredError` | If a required property doesn't exist. |
| `RegexError` | If a regex validation fails. |
| `TypeError` | If the data type of a parameter doesn't match with the `type` property. |


Usage example:
```javascript
const { ReqValidatorError } = require('req-validator');

const callback = (err, res) => {
  if (err instanceof ReqValidatorError) {
    console.error(err.stack);
    res.status(err.status).send(err.message);
  } else {
    console.error(err.stack);
    res.status(500).send(err.message);
  }
};
```
