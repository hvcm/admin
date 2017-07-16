'use strict'

var Couchbase = require("couchbase");
var Error = require("../Error/CBirdError");
var Promise = require("bluebird");

function BucketManager(bucket) {
    this._bucketmgr = bucket._bucket.manager();
}

BucketManager.prototype._promisifyMethod = function (method, options) {
    return function promisified() {
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
        }
        var self = this;
        var optErr = (options && options.error) ? options.error : '';
        return new Promise(function (resolve, reject) {
            var nodeCallback = function (err, res) {
                if (err) {
                    reject(new Error("DATABASE_ERROR", err + optErr));
                } else {
                    resolve(res);
                }
            }
            args.push(nodeCallback);
            method.apply(self, args);
        });
    };
}

BucketManager.prototype.flush = function () {
    return this._promisifyMethod(this._bucketmgr.flush)
        .apply(this._bucketmgr, arguments);
};


BucketManager.prototype.getDesignDocument = function (name) {
    return this._promisifyMethod(this._bucketmgr.getDesignDocument)
        .apply(this._bucketmgr, arguments);
};

BucketManager.prototype.getDesignDocuments = function () {
    return this._promisifyMethod(this._bucketmgr.getDesignDocuments)
        .apply(this._bucketmgr, arguments);
};

BucketManager.prototype.insertDesignDocument = function (name, data) {
    return this._promisifyMethod(this._bucketmgr.insertDesignDocument)
        .apply(this._bucketmgr, arguments);
};

BucketManager.prototype.removeDesignDocument = function (name) {
    return this._promisifyMethod(this._bucketmgr.removeDesignDocument)
        .apply(this._bucketmgr, arguments);
};

BucketManager.prototype.upsertDesignDocument = function (name, data) {
    return this._promisifyMethod(this._bucketmgr.upsertDesignDocument)
        .apply(this._bucketmgr, arguments);
};


module.exports = BucketManager;