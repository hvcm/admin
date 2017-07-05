class Util {
	constructor(req) {
		this.req = req;
	}
	getWorkstationsId(...types) {
		const {cb, cookies} = this.req;
		const permissions = cookies
			.permissions
			.split(',');
		const registries = _.map(permissions, item => `registry_workstation_${item}`);
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
		const {cb, cookies} = this.req;
		const permissions = cookies
			.permissions
			.split(',');

		return Promise.map(permissions, department => cb.get(`registry_service_${department}`).catch(e => {}));
	}
	removeEveryWhere(id, device_type, registry = false) {
		const {cb, cookies, params} = this.req;
		const {entity} = params;

		const permissions = cookies
			.permissions
			.split(',');
		const registries = _.map(permissions, item => `registry_workstation_${item}`);

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
	getOffices() {
		const {cb} = this.req;
		return cb
			.get('global_org_structure')
			.then(data => _.get(data, 'value.content'))
	}

	getSchedules() {
		const {cb, cookies, params} = this.req;
		const schedule = cb
			.view(this.req.query('schedule'))
			.then(items => _.map(items, 'id'))
			.then(ids => cb.getMulti(ids));

		return schedule;
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
