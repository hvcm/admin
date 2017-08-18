"use strict";

const Util = require('./util');
const checked = {
	state: true,
	check: true
};
const notchecked = {
	state: true,
	check: false
};

class Basic {
	check() {
		const {data} = this.req.body;
		const {cb} = this.req;
		const previous = data.__previous;
		const id = data.id;

		if (id === previous) {
			return this
				.res
				.json(checked);
		}

		return cb
			.get(id)
			.then(() => notchecked)
			.catch(() => checked)
			.then(data => this.res.json(data));
	}
	constructor(req, res, next) {
		this.req = req;
		this.res = res;
		this.next = next;

		const permissions = _.get(this.req, 'cookies.permissions', '');
		this.permissions = _.isArray(permissions)
			? permissions
			: permissions.split(',');
		this.util = new Util(req, this.permissions);
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

		const previous = data.__previous;
		const deleteOld = !previous || previous === id
			? Promise.resolve(false)
			: this._deleteEntityWorkstation({device_type, "@id": previous});

		_.unset(data, '__previous');

		return deleteOld.then(() => Promise.props({
			insert: cb.upsert(id, data),
			toggle: util
				.removeEveryWhere(id, device_type, registry)
				.then(() => util.addWorkstation(id, device_type, registry))
		}));
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
