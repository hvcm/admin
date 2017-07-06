class Util {
	constructor(req, permissions) {
		this.req = req;
		this.permissions = permissions;
	}
	getWorkstationsId(...types) {
		const {cb} = this.req;

		const registries = _.map(this.permissions, item => `registry_workstation_${item}`);
		return cb
			.getMulti(registries)
			.then(reg => {
				const workstation_id = _
					.chain(reg)
					.flatMapDeep(item => _.map(types, type => _.get(item, `value.content.${type}`, [])))
					.value();

				return workstation_id;
			})
	}
	getServiceMaps() {
		const {cb} = this.req;

		return Promise.map(this.permissions, department => cb.get(`registry_service_${department}`).catch(e => {}));
	}
	removeEveryWhere(id, device_type, registry = false) {
		const {cb, params} = this.req;
		const {entity} = params;

		const registries = _.map(this.permissions, item => `registry_workstation_${item}`);

		return Promise.map(registries, toDelete => {
			if (registry && (toDelete == registry)) {
				return true;
			}

			return cb
				.get(toDelete)
				.then((data) => {
					const path = 'value.content.' + device_type;
					const old = _.get(data, path, []);
					const index = old.indexOf(id);

					if (index === -1) {
						return true;
					}
					old.splice(index, 1);
					_.set(data, path, old);
					return cb.upsert(toDelete, data.value);
				});
		});
	}
	toggleService(id, list) {
		const {cb, params} = this.req;
		const {entity} = params;

		const registries = _.map(this.permissions, item => `registry_service_${item}`);

		return Promise.map(registries, toDelete => {
			return cb
				.get(toDelete)
				.then((data) => {
					const path = 'value.content';
					const old = _.get(data, path, []);
					const index = old.indexOf(id);

					if (list && (~ list.indexOf(toDelete)) && index === -1) {
						old.push(id);

					} else if (index === -1) {
						return true;
					} else {
						old.splice(index, 1);
					}

					_.set(data, path, old);

					return cb.upsert(toDelete, data.value);
				});
		});
	}

	getOffices() {
		const {cb} = this.req;
		return cb
			.get('global_org_structure')
			.then(data => _.get(data, 'value.content'))
	}

	getSchedules() {
		const {cb, params} = this.req;
		return cb
			.view(this.req.query('schedule'))
			.then(items => _.map(items, 'id'))
			.then(ids => cb.getMulti(ids));
	}

	getServiceGroups() {
		const {cb, params} = this.req;
		return cb
			.view(this.req.query('service_group'))
			.then(items => _.map(items, 'id'))
			.then(ids => cb.getMulti(ids));
	}

	addWorkstation(id, device_type, registry) {
		const {cb} = this.req;
		return cb
			.get(registry)
			.then((data) => {
				const path = 'value.content.' + device_type;
				const old = _.get(data, path, []);
				old.push(id);
				_.set(data, path, _.uniq(old));
				return cb.upsert(registry, data.value);
			})
	}
}

module.exports = Util;
