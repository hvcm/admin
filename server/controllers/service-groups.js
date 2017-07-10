"use strict";

const Basic = require('./basic.js');

class ServiceGroups extends Basic {
	save() {
		const {data} = _.castArray(this.req.body);
		const {cb} = this.req;

		return Promise.map(data, item => cb.upsert(item["@id"], item).then(data => this.res.json(data)));
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
		const {department} = this.req.body;
		const {cb} = this.req;

		const services = this
			.util
			.getServiceMaps()
			.then(data => _.flatMap(data, item => _.get(item, 'value.content', [])))
			.then(data => cb.getMulti(data))
			.then(items => _.mapValues(items, 'value.label'));

		const list = this
			.util
			.getServiceGroups()
			.then(data => {
				return _.map(data, 'value');
			});

		const helpers = Promise.props({services});
		return Promise
			.props({list, helpers})
			.then(data => this.res.json(data));
	}
}

module.exports = ServiceGroups;
