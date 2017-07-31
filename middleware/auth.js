"use strict";
const utils = require('./util');

module.exports = function(req, res, next) {
	const cookies = req.cookies || {};
	const {user, username, server, permissions} = cookies;

	if (req.method === 'POST' && !(user && username && permissions && server)) {
		return res.send({authfailed: true});
	}

	utils.extendCookie(req, res);
	next();
};
