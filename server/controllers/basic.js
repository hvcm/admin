"use strict";

const Util = require('./util');

class Basic {
	constructor(req, res, next) {
		this.req = req;
		this.res = res;
		this.next = next;
		this.util = new Util(req);
	}
	entity() {
		this
			.res
			.send({data: 1});
	}
	_saveEntityWorkstation(data) {
		const {cb, cookies, params} = this.req;
		const {entity} = params;
		const {attached_to, device_type} = data;
		const id = data['@id'];

		if (!attached_to) {
			return Promise.resolve({state: false});
		}
		const registry = `registry_workstation_${attached_to}`;
		const util = this.util;
		const remove = util
			.removeEveryWhere(id, device_type, registry)
			.then(() => util.addWorkstation(id, device_type, registry));

		return Promise.props({
			insert: cb.upsert(id, data),
			toggle: remove
		});
	}
	_deleteEntityWorkstation(data) {
		const id = data['@id'];
		const {device_type} = data;
		return this
			.util
			.removeEveryWhere(id, device_type);
	}
}

module.exports = Basic
