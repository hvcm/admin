"use strict";

const Basic = require('./basic.js');

class Services extends Basic {
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
	_linkToRegistry() {}
	_unlinkToRegistry() {}
	list() {
		const {cb} = this.req;

		const getServiceMaps = this
			.util
			.getServiceMaps();

		const schedule = cb
			.view(this.req.query('schedule'))
			.then(items => _.map(items, item => ({
				id: item.id,
				label: item.value || (item.id == 'schedule-0'
					? 'Основное расписание'
					: item.id.replace('schedule-', 'Расписание '))
			})));

		const helpers = Promise.props({
			schedule,
			offices: this
				.util
				.getOffices(),
			service_map: getServiceMaps.then(data => {
				return _
					.chain(data)
					.map(item => [
						item
							.value['@id']
							.substr(17),
						item.value.content
					])
					.fromPairs()
					.value();
			})
		});
		const list = getServiceMaps.then(data => {
			return _
				.chain(data)
				.flatMap('value.content')
				.uniq()
				.value();
		})
			.then(data => cb.getMulti(data))
			.then(data => _.map(data, 'value'))

		return Promise
			.props({list, helpers})
			.then(data => this.res.json(data));
	}
}

module.exports = Services;
