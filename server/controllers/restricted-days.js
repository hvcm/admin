"use strict";
const Basic = require('./basic.js');

class RestrictedDays extends Basic {
	save() {
		const {data} = this.req.body;
		const {cb} = this.req;
		const global_restricted_days = {
			"@id": "global_restricted_days",
			"@type": "Description",
			content: data
		};
		return cb
			.set('global_restricted_days', global_restricted_days)
			.then(data => this.res.json(data));
	}
	delete() {
		this
			.res
			.json({status: false, message: 'not allowed'})
	}
	list() {
		const {cb, cookies} = this.req;
		const permissions = this.permissions;

		const list = cb
			.get('global_restricted_days')
			.then(data => _.get(data, 'value.content'));

		const offices = cb
			.get('global_org_structure')
			.then(data => _.get(data, 'value.content'));

		const helpers = Promise.props({offices});

		return Promise
			.props({list, helpers})
			.then(data => this.res.json(data));
	}
}

module.exports = RestrictedDays;
