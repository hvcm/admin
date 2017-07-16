'use strict';
//DB promisifying proto
let uuid = require('node-uuid');
let _ = require('lodash');

let request_pool = [];

class SingleRequest {
	constructor() {
		this.id = uuid.v1();

		this.promise = new Promise((resolve, reject) => {
			this.resolve = resolve;
		});
	}
}

var Couchbase = require("couchbase");
var Error = require("../Error/CBirdError");
var Promise = require("bluebird");
var DB_BucketManager = require("./DB_BucketManager");

var DB_Bucket = function(cluster, bucket_name, params) {
	this._cluster = cluster;
	this.bucket_name = bucket_name;
	this._n1ql = [params.n1ql];
	this._bucket = cluster.openBucket(this.bucket_name, (err, res) => {
		if (err) {
			global.logger && logger.error(err, {
				module: 'Couchbird',
				method: 'bucket',
				bucket_name: bucket_name
			});
			return this.reconnect();
		}
		global.logger && logger.info("Connection established", {
			module: 'Couchbird',
			method: 'bucket',
			bucket_name: bucket_name
		});
	});

	this
		._bucket
		.on('error', (err) => {
			console.log("CBIRD ERR:", err.message);
			global.logger && logger.error(err, "Bucket %s error", this.bucket_name);
			return this.reconnect();
		});

	this.setOperationTimeout(params.operation_timeout || 240000);

}

//INIT
DB_Bucket.prototype._promisifyMethod = function(method, options) {
	return function promisified() {
		var args = new Array(arguments.length);
		for (var i = 0; i < args.length; ++i) {
			args[i] = arguments[i];
		}
		var self = this;
		var optErr = (options && options.error)
			? options.error
			: '';
		return new Promise(function(resolve, reject) {
			var nodeCallback = function(err, res) {
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

DB_Bucket.prototype.enableN1ql = function() {
	this
		._bucket
		.enableN1ql(this._n1ql);
}

DB_Bucket.prototype.manager = function() {
	return new DB_BucketManager(this);
}

DB_Bucket.prototype.reconnect = function() {
	this._bucket = this
		._cluster
		.openBucket(this.bucket_name, function(err, res) {
			if (err) {
				global.logger && logger.error(err, {
					module: 'Couchbird',
					method: 'reconnect',
					bucket_name: this.bucket_name
				});
			}
			global.logger && logger.info("Reconnect successful:", {
				module: 'Couchbird',
				method: 'reconnect',
				bucket_name: this.bucket_name
			});
		});
};
//DOCUMENTS

DB_Bucket.prototype.insert = function(key, value, options) {
	return this
		._promisifyMethod(this._bucket.insert)
		.apply(this._bucket, arguments);
};

DB_Bucket.prototype.upsert = function(key, value, options) {
	return this
		._promisifyMethod(this._bucket.upsert)
		.apply(this._bucket, arguments);
};

DB_Bucket.prototype.get = function(key, options) {
	return this
		._promisifyMethod(this._bucket.get)
		.apply(this._bucket, arguments);
};

DB_Bucket.prototype.getAndLock = function(key, options) {
	return this
		._promisifyMethod(this._bucket.getAndLock)
		.apply(this._bucket, arguments);
};

DB_Bucket.prototype.unlock = function(key, cas, options) {
	return this
		._promisifyMethod(this._bucket.unlock)
		.apply(this._bucket, arguments);
};

DB_Bucket.prototype.getAndTouch = function(key, expiry, options) {
	return this
		._promisifyMethod(this._bucket.getAndTouch)
		.apply(this._bucket, arguments);
};

DB_Bucket.prototype.touch = function(key, expiry, options) {
	return this
		._promisifyMethod(this._bucket.touch)
		.apply(this._bucket, arguments);
};

//does not make sense at all since it is a set of single gets in couchnode
DB_Bucket.prototype.getMulti = function(keys) {

	return new Promise(resolve => {
		this
			._bucket
			.getMulti(keys, (err, res) => resolve(res));
	});
};

DB_Bucket.prototype.remove = function(key, options) {
	return this
		._promisifyMethod(this._bucket.remove)
		.apply(this._bucket, arguments);
};

DB_Bucket.prototype.replace = function(key, value, options) {
	return this
		._promisifyMethod(this._bucket.replace)
		.apply(this._bucket, arguments);
};

//RAW DATA
//DO NOT apply this to json data. Only appending strings appear to be correct
DB_Bucket.prototype.append = function(key, value, options) {
	return this
		._promisifyMethod(this._bucket.append)
		.apply(this._bucket, arguments);
};

//DO NOT apply this to json data. Only prepending strings appear to be correct
DB_Bucket.prototype.prepend = function(key, value, options) {
	return this
		._promisifyMethod(this._bucket.prepend)
		.apply(this._bucket, arguments);
};

//COUNTERS
//is there a need to create separate counterAdd and counterRemove with native callbacks?
DB_Bucket.prototype.counter = function(key, delta, options) {
	return this
		._promisifyMethod(this._bucket.counter)
		.apply(this._bucket, arguments);
};

//ok, let it be
DB_Bucket.prototype.counterInsert = function(cKey, cOptions, dKey, dValue, dOptions, delimiter) {
	var bucket = this._bucket;
	var self = this;
	return new Promise(function(resolve, reject) {
		bucket
			.counter(cKey, 1, cOptions, function(err, res) {
				if (err) {
					reject(new Error("DATABASE_ERROR", err));
				} else {
					//temporary, TODO: pass func or format string to form new id?
					var id = [dKey, res.value].join(delimiter || "/");
					resolve(self.insert(id, dValue, dOptions));
				}
			});
	});
}

DB_Bucket.prototype.counterRemove = function(cKey, dKey, delimiter) {
	var bucket = this._bucket;
	var self = this;
	return new Promise(function(resolve, reject) {
		bucket
			.counter(cKey, -1, function(err, res) {
				if (err) {
					reject(new Error("DATABASE_ERROR", err));
				} else {
					//temporary, TODO: pass func or format string to form new id?
					var id = [
						dKey, res.value + 1
					].join(delimiter || "/");
					resolve(self.remove(id));
				}
			});
	});
}

//VIEWS AND N1QL
DB_Bucket.prototype._query = function(query, opts) {
	return this
		._promisifyMethod(this._bucket.query)
		.apply(this._bucket, arguments);
}

//query need to be Couchbase.ViewQuery
DB_Bucket.prototype.view = function(query) {
	if (!query instanceof Couchbase.ViewQuery) {
		throw new Error("INVALID_ARGUMENT", "Expected Couchbase ViewQuery");
	}
	return this._query(query);
}

DB_Bucket.prototype.N1QL = function(query, opts) {
	if (!query instanceof Couchbase.N1qlQuery) {
		throw new Error("INVALID_ARGUMENT", "Expected Couchbase N1qlQuery");
	}
	return this._query(query, opts);
}

//TIMEOUTS

//Don't use it directly
DB_Bucket.prototype._setTimeout = function(property, timeout) {
	if (typeof timeout != "number") {
		throw new Error("INVALID_ARGUMENT", "Number is required");
	}
	if (!(this._bucket[property])) {
		throw new Error("INVALID_ARGUMENT", "Not existing property " + property);
	}
	this._bucket[property] = timeout;
	return Promise.resolve(true);
}

DB_Bucket.prototype.setOperationTimeout = function(timeout) {
	return this._setTimeout('operationTimeout', timeout);
}

DB_Bucket.prototype.setViewTimeout = function(timeout) {
	return this._setTimeout('viewTimeout', timeout);
}

DB_Bucket.prototype.setConnectionTimeout = function(timeout) {
	return this._setTimeout('connectionTimeout', timeout);
}
module.exports = DB_Bucket;
