"use strict";

module.exports = function(req, res, next) {
	const permissions = _.get(req, 'cookies.permissions', '');
	const user = _.get(req, 'cookies.user', '');
	const username = _.get(req, 'cookies.username', '');
	if (req.method === 'POST' && !(user && username && permissions)) {
		return res.send({authfailed: true});
	}

	const opts = {
		expires: new Date(Date.now() + 12 * 60 * 60 * 1000)
	};

	res.cookie('permissions', permissions, opts);
	res.cookie('user', user, opts);
	res.cookie('username', username, opts);
	next();
};
