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

	_getListGlobalsPriority() {
		const {cb} = this.req;

		return cb
			.get('global_priority_description')
			.then(data => {
				const helpers = Promise.props({
					canedit: this
						.util
						.canEdit()
				});
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
				return Promise.props({list, helpers});
			});
	}
	_getListGlobals() {
		const {cb} = this.req;

		return cb
			.get('user_info_fields')
			.then(data => {
				const helpers = Promise.props({
					canedit: this
						.util
						.canEdit()
				});
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

				return Promise.props({list, helpers});
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
				console.log('workstation_id',workstation_id);
				const list = cb
					.getMulti(workstation_id)
					.then(data => _.map(data, 'value'));

				const getServiceMaps = this
					.util
					.getServiceMaps();

				const schedule = this
					.util
					.getSchedulesByView();

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
							.compact()
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
								_
									.get(item, 'value.@id', '')
									.substr(17) || 'not-found',
								_.get(item, 'value.content', [])
							])
							.fromPairs()
							.value();
					}),
					service_config: _.map({
						"okno": "окно",
						"kabinet": "кабинет",
						"kassa": "касса"
					}, (label, id) => ({label, id}))
				});

				return Promise.props({list, helpers})
			});
	}
	getServiceConnfigForWs() {
		return this
			.cb
			.get('iris_config_service_groups')
			.then(data => _.chain(data).get('value.main_group.roomdisplay.params.direction_types', {}).map((label, id) => ({label, id})).value())
	}
}

module.exports = Entity;
