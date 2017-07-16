"use strict";
var errors = require("./errors");
var AbstractError = require("./AbstractError");

function CBirdError(info, message) {
    AbstractError.call(this, "CBirdError", info, message);
    Error.captureStackTrace(this, CBirdError);
}

CBirdError.prototype = Object.create(AbstractError.prototype);
CBirdError.prototype.constructor = CBirdError;

module.exports = CBirdError;