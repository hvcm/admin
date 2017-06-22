"use strict";

const Basic = require('./basic');

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
	_getListHumans() {
		const {department} = this.req.body;
		const {cb} = this.req;
		return cb
			.get('global_membership_description')
			.then(({value}) => {
				const {content} = value;
				const ids = _
					.chain(content)
					.filter({organization: department})
					.map('member')
					.value();

				return Promise.props({
					data: cb.getMulti(ids),
					helpers: cb.get('global_org_structure')
				})
			})
			.then(({data, helpers}) => {
				return {
					list: _.map(data, 'value'),
					helpers: helpers.value.content
				}
			})

	}
	_getListDepartments() {
		const {cb, cookies} = this.req;
		const permissions = cookies
			.permissions
			.split(',');
		return Promise.props({
			services: Promise
				.map(permissions, department => cb.get(`registry_service_${department}`).catch(e => {}))
				.then(services => _.map(services, 'value.content')),
			qa_design: Promise.map(permissions, department => cb.get(`qa--satellite--${department}--template`).catch(e => {})),
			oper_design: Promise.map(permissions, department => cb.get(`operator-display--satellite--${department}--template`).catch(e => {})),
			routes: Promise.map(permissions, department => cb.get(`service-routing-map-${department}`).catch(e => {})),
			all_services: cb
				.get(`registry_service_global`)
				.catch(e => ({content: []}))
		}).then(res => {
			let all_services;
			if (res.all_services.content.length) {
				all_services = res.all_services.content
			} else {
				all_services = _
					.chain(res.services)
					.flatMap()
					.uniq()
					.value();
			}

			return Promise.props(Object.assign(res, {
				all_services: cb.getMulti(all_services)
			}))
		}).then(res => {
			return cb
				.get('global_org_structure')
				.then(({value}) => {
					const {content} = value;

					const list = _.map(permissions, (permission, index) => {
						const dep = _.find(content, {'@id': permission});
						dep.services = res.services[index];
						dep.qa_design = res.qa_design[index].value;
						dep.oper_design = _.get(res.oper_design[index], 'value', {});
						dep.routes = _.get(res.routes[index], 'value', {});
						return dep;
					});

					const helpers = {
						office: value.content,
						labels: _.transform(res.all_services, (acc, service) => {
							const id = _.get(service, 'value.@id');
							acc[id] = _.get(service, 'value.label');
						}, {})
					};
					return {list, helpers};
				});
		});
	}
}

module.exports = Entity;
