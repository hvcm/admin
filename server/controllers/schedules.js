"use strict";

const Basic = require('./basic.js');

class Schedules extends Basic {
	save() {
		const {data} = this.req.body;
		const {cb} = this.req;
		const id = data["@id"];

		return cb
			.upsert(id, data)
			.then(data => this.res.json(data));
	}
	delete() {
		const {data} = this.req.body;
		const {cb, cookies} = this.req;

		const id = data["@id"];

		return cb
			.remove(id)
			.then(data => this.res.json(data));
	}
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
