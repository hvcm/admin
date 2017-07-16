"use strict";
const cfg = require('../config/default.js');
const adminreports = require('./data.json');
const _ = require('lodash');
const fs = require('fs')
const cb = require("./couchbird/index");

const db = {};
const main = {};
const auth = {};

_.forEach(cfg, (config, index) => {
	const couch = new cb();
	db[index] = couch.init({server_ip: config.database.host});
	main[index] = db[index].bucket(config.buckets.main);
	auth[index] = db[index].bucket(config.buckets.auth);

	const manager = main[index].manager();

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

});

const ViewQuery = require('couchbase').ViewQuery;
const servers = _.map(cfg, (config, index) => index);
const labels = _.map(cfg, (config) => config.label);
const makeOpts = () => ({
	expires: new Date(Date.now() + 12 * 60 * 60 * 1000)
});

module.exports = function(req, res, next) {
	const opts = makeOpts();
	const frombody = _.get(req, 'body.server', false);
	const server = frombody || _.get(req, 'cookies.server', 'test');

	res.cookie('servers', servers, opts);
	res.cookie('labels', labels, opts);
	req.cb = main[server];
	req.auth = auth[server];
	req.query = view => ViewQuery.from('adminreports', view);
	req.server_id = server;
	next();
};
