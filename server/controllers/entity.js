"use strict";

const couchbase = require('couchbase');

const Basic = require('./basic');
const serviceToLabels = (all_services) => _.transform(all_services, (acc, service) => {
	const id = _.get(service, 'value.@id');
	acc[id] = _.get(service, 'value.label');
}, {});

class Entity extends Basic {
	entityList() {
		const {entity} = this.req.params;
		const method = `_getList${_.upperFirst(_.camelCase(entity))}`;
		if (!this[method])
			return this.res.send({error: 'no such entity'});

		this[method]().then(data => this.res.json(data));

	}
	entitySave() {
		const {entity} = this.req.params;
		const {data} = this.req.body;
		const method = `_saveEntity${_.upperFirst(_.camelCase(entity))}`;
		if (!this[method])
			return this.res.send({error: 'no such entity'});

		this[method](data).then(res => this.res.json(res));
	}
	entityDelete() {
		const {entity} = this.req.params;
		const {data} = this.req.body;
		const method = `_deleteEntity${_.upperFirst(_.camelCase(entity))}`;
		if (!this[method])
			return this.res.send({error: 'no such entity'});

		this[method](data).then(res => this.res.json(res));
	}
	_saveEntitySystemWorkstation(data) {
		return this._saveEntityWorkstation(data);
	}
	_deleteEntitySystemWorkstation(data) {
		return this._deleteEntityWorkstation(data);
	}

	_saveEntityFields(data) {
		const {entity} = this.req.params;
		const {cb} = this.req;

		return cb.upsert('user_info_fields', {
			"@id": "user_info_fields",
			"@type": "Config",
			"content": data
		});
	}
	_saveEntityPriority(data) {
		const {entity} = this.req.params;
		const {cb} = this.req;

		return cb.upsert('global_priority_description', {
			"@id": "global_priority_description",
			"@type": "Description",
			"content": data
		});
	}

	_getListSystemWorkstations() {
		const {cb, cookies} = this.req;
		const permissions = this.permissions;
		const registries = _.map(permissions, item => `registry_workstation_${item}`);

		return Promise.props({
			reg: this
				.util
				.getWorkstationsId('call-center', 'registry'),
			webterm: cb.get('megatron-6')
		}).then(({reg, webterm}) => {
			const workstation_id = _
				.chain(reg)
				.concat(_.get(webterm, 'value.available_workstation', []))
				.value();

			const list = cb
				.getMulti(workstation_id)
				.then(data => _.map(data, 'value'));
			const helpers = Promise.props({
				offices: this
					.util
					.getOffices(),
				terminals: this
					.util
					.getWorkstationsId('terminal')
					.then(ids => cb.getMulti(ids).then(res => _.chain(res).map(({
						value = {}
					}) => [value["@id"], value.label]).fromPairs().value()))
			});
			return Promise.props({list, helpers})
		});

	}
	_getListGlobalsPriority() {
		const {cb} = this.req;

		return cb
			.get('global_priority_description')
			.then(data => {
				const list = _
					.chain(data)
					.get([
						'value', 'content'
					], [])
					.map((item, index) => {
						item.__index = index;
						return item;
					})
					.value();
				return {list};
			});
	}
	_getListGlobals() {
		const {cb} = this.req;

		return cb
			.get('user_info_fields')
			.then(data => {
				const list = _
					.chain(data)
					.get([
						'value', 'content'
					], [])
					.map((item, index) => {
						item.__index = index;
						return item;
					})
					.value();
				return {list};
			});
	}
	_getListDepartments() {
		const {department} = this.req.body;
		return this
			.req
			.cb
			.get('global_org_structure')
			.then(({value}) => {
				const {content} = value;

				return value;
			})
	}

	_getListWorkstations() {
		const {cb, cookies} = this.req;

		const registries = _.map(this.permissions, item => `registry_workstation_${item}`);

		return this
			.util
			.getWorkstationsId('control-panel')
			.then(workstation_id => {
				const list = cb
					.getMulti(workstation_id)
					.then(data => _.map(data, 'value'));

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
					service_labels: getServiceMaps.then(data => {
						return _
							.chain(data)
							.flatMap(item => item.value.content)
							.uniq()
							.value();
					}).then(data => {
						return cb
							.getMulti(data)
							.then(serviceToLabels);
					}),
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
					}),
					service_config: cb
						.get('iris_config_service_groups')
						.then(data => _.chain(data).get('value.main_group.roomdisplay.params.direction_types', {}).map((label, id) => ({label, id})).value())
				});

				return Promise.props({list, helpers})
			});
	}
}

module.exports = Entity;
