'use strict';

const Couchbase = require("couchbase");
const DB_Bucket = require("./DB_Bucket");
const Promise = require("bluebird");
const _ = require("lodash");
const Error = require("../Error/CBirdError");

const DB_Face = function() {};

DB_Face.prototype.init = function(params) {
	const opts = {
		server_ip: "127.0.0.1",
		n1ql: "127.0.0.1:8093"
	};
	_.assign(opts, params);
	this._server_ip = opts.server_ip;
	this._n1ql = opts.n1ql;
	this._cluster = new Couchbase.Cluster(this._server_ip);
	this._buckets = {};
	this.configured = true;

	return this;
}

DB_Face.prototype.bucket = function(bucket_name, bucket_class) {
	const Bucket = bucket_class || DB_Bucket;
	if (!this.configured)
		throw new Error("DATABASE_ERROR", "Database is not initialized. Call init(config) before.");

	if (!this._buckets[bucket_name] || !(this._buckets[bucket_name]instanceof Bucket)) {
		this._buckets[bucket_name] = new Bucket(this._cluster, bucket_name, {n1ql: this._n1ql});
	}
	return this._buckets[bucket_name];
}

module.exports = DB_Face;
