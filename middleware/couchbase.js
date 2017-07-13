"use strict";
const config = require('../config/default.js');
const adminreports = require('./data.json');

const couchbase = require('couchbase')
const fs = require('fs')
const cluster = new couchbase.Cluster(config.database.host);

const cb = require("Couchbird");
const db = cb({server_ip: config.database.host});

const main = db.bucket(config.buckets.main);
const auth = db.bucket(config.buckets.auth);
const ViewQuery = couchbase.ViewQuery;

const manager = main.manager();
manager
	.getDesignDocuments()
	.then((res) => {
		if (_.isEqual(res.adminreports, adminreports)) {
			return;
		}
		manager
			.upsertDesignDocument('adminreports', adminreports, function(err) {
				console.log('Insertion of design document completed with error:', err);
			});
	});

module.exports = function(req, res, next) {
	req.cb = main;
	req.auth = auth;
	req.query = view => ViewQuery.from('adminreports', view);
	next();
};
