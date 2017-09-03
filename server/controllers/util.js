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
	fieldsMap() {
		const {cb} = this.req;
		return cb
			.get('user_info_fields')
			.then(data => _.chain(data).get('value.content', []).map((item, index) => ({id: index, include: item.include, label: item.label})).value());
	}
	canEdit() {
		return this
			.getOffices()
			.then(content => _.reduce(this.permissions, (acc, item) => (_.get(_.find(content, {"@id": item}), '@type') == 'Office') || acc, false))
	}
	getServiceMaps() {
		const {cb} = this.req;

		return Promise
			.map(this.permissions, department => cb.get(`registry_service_${department}`).catch(e => {}))
			.then(res => _.compact(res));
	}
	getServiceMapsObj() {
		return this
			.getServiceMaps()
			.then(data => _.transform(data, (acc, item) => {
				const key = _
					.get(item, 'value.@id', '')
					.substr(17);
				const value = item.value.content;
				if (key) {
					acc[key] = value;
				}
			}, {}));
	}
	removeEveryWhere(id, device_type, registry = false) {
		const {cb, params} = this.req;
		const {entity} = params;

		const registries = _.map(this.permissions, item => `registry_workstation_${item}`);

		return Promise.map(registries, toDelete => {
			if (registry && (toDelete == registry)) {
				return true;
			}

			if (toDelete.includes('registry_workstation_office')) {
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
					_.set(data, path, _.without(old, id));
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
	getSchedulesByView() {
		const {cb} = this.req;
		return cb
			.view(this.req.query('schedule'))
			.then(items => _.chain(items).filter(item => item.id !== "schedule-0").map(item => ({
				id: item.id,
				label: item.value || item
					.id
					.replace('schedule-', 'Расписание ')
			})).value());
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

		if (registry.includes('registry_workstation_office')) {
			return Promise.resolve('office');
		}
		return cb
			.get(registry)
			.then((data) => {
				const path = 'value.content.' + device_type;
				const old = _.get(data, path, []);
				(!old.includes(id)) && old.push(id);
				_.set(data, path, _.uniq(old));
				return cb.upsert(registry, data.value);
			})
	}
}

module.exports = Util;
