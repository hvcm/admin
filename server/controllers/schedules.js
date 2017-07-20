"use strict";

const Basic = require('./basic.js');

class Schedules extends Basic {
	update() {
		const {cb} = this.req;

		return cb.view(this.req.query('schedule').stale(3))
	}
	save() {
		const {data} = this.req.body;
		const {cb} = this.req;
		const id = data["@id"];

		return cb
			.upsert(id, data)
			.then(() => this.update())
			.then(data => this.res.json(data));
	}
	delete() {
		const {data} = this.req.body;
		const {cb, cookies} = this.req;

		const id = data["@id"];

		return cb
			.remove(id)
			.then(() => this.update())
			.then(data => this.res.json(data));
	}
	list() {
		const {department} = this.req.body;
		const {cb} = this.req;

		return this
			.util
			.getSchedules()
			.then(data => {
				return {
					list: _
						.chain(data)
						.map('value')
						.compact()
						.filter(item => item["@id"] !== "schedule-0")
						.value()
				};
			})
			.then(data => this.res.json(data));
	}
}

module.exports = Schedules;
