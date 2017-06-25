"use strict";
const config = require('../config/default.js');

const couchbase = require('couchbase')
const cluster = new couchbase.Cluster(config.database.host);

const cb = require("Couchbird");
const db = cb({server_ip: config.database.host});

const main = db.bucket(config.buckets.main);
const auth = db.bucket(config.buckets.auth);
const ViewQuery = couchbase.ViewQuery;

module.exports = function(req, res, next) {
	req.cb = main;
	req.auth = auth;
	req.query = view => ViewQuery.from('reports', view);
	next();
};
