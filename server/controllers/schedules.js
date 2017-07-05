"use strict";

const Basic = require('./basic.js');

class Schedules extends Basic {
	save() {}
	delete() {}
	list() {
		const {department} = this.req.body;
		const {cb, cookies} = this.req;
		const permissions = cookies
			.permissions
			.split(',');

		return this
			.util
			.getSchedules()
			.then(data => {
				return {
					list: _.map(data, 'value')
				};
			})
			.then(data => this.res.json(data));
	}
}

module.exports = Schedules;
