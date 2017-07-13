"use strict";

const Basic = require('./basic.js');
const serviceToLabels = (all_services) => _.transform(all_services, (acc, service) => {
	const id = _.get(service, 'value.@id');
	acc[id] = _.get(service, 'value.label');
}, {});

class Departments extends Basic {
	save() {
		const {cb} = this.req;
		const {data} = this.req.body;
		const id = data["@id"];

		return cb
			.get('global_org_structure')
			.then(({value}) => {
				const content = value.content;
				const has = ~_.findIndex(content, {"@id": id});

				return has
					? this.update(data, value)
					: this.create(data, value);
			})
			.then(data => this.res.json(data));;
	}
	removeFields(data) {
		['services', 'qa_design', 'oper_design', 'routes'].map(item => _.unset(data, item));
	}
	updateSatelite(...designs) {
		const {cb} = this.req;
		return Promise.map(designs, design => design && cb.upsert(design["@id"], design));
	}
	update(data, value) {
		const {cb} = this.req;
		const id = data["@id"];

		const {services, qa_design, oper_design, routes} = data;
		this.removeFields(data);
		const index = _.findIndex(value.content, {"@id": id});

		value.content[index] = data;

		return Promise.props({
			update: cb.upsert('global_org_structure', value),
			satelites: this.updateSatelite(qa_design, oper_design),
			routes: cb.upsert(routes["@id"], routes),
			services: this.makeServiceRegistry(id, services)
		});
	}

	create(data, value) {
		const {cb} = this.req;
		const id = data["@id"];

		const {services, qa_design, oper_design, routes} = data;
		this.removeFields(data);

		value
			.content
			.push(data);

		return Promise.props({
			upsert: cb.upsert('global_org_structure', value),
			update_user: this.updateUser(id),
			satelites: this.makeSatelites(id, qa_design, oper_design),
			routing_map: this.makeServiceRoutingMap(id, routes),
			services: this.makeServiceRegistry(id, services)
		}).then(data => this.res.json(data));
	}
	setCookie(value) {
		const p = _.get(value, 'permissions.can-admin', {});
		const permissions = _.transform(p, (acc, item, index) => {
			item && acc.push(index)
		}, []);

		this
			.res
			.cookie('permissions', permissions.join(','));
	}
	unsetUser(id) {
		const {user} = this.req.cookies;
		const {cb} = this.req;

		return cb
			.get(user)
			.then(({value}) => {
				_.unset(value, 'permissions.can-admin.' + id);
				this.setCookie(value);
				return cb.upsert(user, value);
			});
	}
	updateUser(id) {
		const {user} = this.req.cookies;
		const {cb} = this.req;

		return cb
			.get(user)
			.then(({value}) => {
				_.set(value, 'permissions.can-admin.' + id, true);
				this.setCookie(value);
				return cb.upsert(user, value);
			});
	}

	delete() {
		const {data} = this.req.body;
		const {cb} = this.req;
		const id = data["@id"];

		return Promise.props({
			remove: cb
				.get('global_org_structure')
				.then(({value}) => {
					_.remove(value.content, {"@id": id});
					return cb.upsert('global_org_structure', value);
				}),
			satelites: this.deleteSatelites(id),
			routing_map: this.deleteServiceRoutingMap(id),
			unsetuser: this.unsetUser(id)
		}).then(data => this.res.json(data));
	}

	deleteServiceRoutingMap(id) {
		const {cb} = this.req;

		return cb.remove(`service-routing-map-${id}`);
	}

	deleteSatelites(id) {
		const {cb} = this.req;

		const satelites = ["qa", "operator-display"].map(type => `${type}--satellite--${id}--template`);

		return Promise.map(satelites, satelite => cb.remove(satelite));
	}

	makeServiceRegistry(id, value) {
		const {cb} = this.req;

		const map = {
			"@id": `registry_service_${id}`,
			"@type": "Registry",
			"@content_type": "Service",
			"content": value
		};

		return cb.upsert(map["@id"], map);
	}

	makeServiceRoutingMap(id, value) {
		const {cb} = this.req;

		const map = Object.assign({
			"@id": `service-routing-map-${id}`,
			"routes": {
				"include": [],
				"exclude": [
					{
						"from": "*",
						"to": "*"
					}
				]
			}
		}, value);

		return cb.upsert(map["@id"], map);
	}

	makeSatelites(id, qa, oper) {
		const {cb} = this.req;
		const satelites = [
			this._makeQaSatelite(id, qa),
			this._makeODSatelite(id, oper)
		];

		return Promise.map(satelites, satelite => cb.upsert(satelite["@id"], satelite));
	}

	_makeQaSatelite(id, data) {
		const type = "qa";
		const short_type = "Qa";

		return Object.assign({
			"@id": `${type}--satellite--${id}--template`,
			"@type": short_type,
			"label": `${short_type} ${id}`,
			"default_agent": "megatron-3",
			"attached_to": id,
			"device_type": type,
			"hold_screen_design": "/images/qa/landing.html"
		}, data);
	}

	_makeODSatelite(id, data) {
		const type = "operator-display";
		const short_type = "OperatorDisplay";

		return Object.assign({
			"@id": `${type}--satellite--${id}--template`,
			"@type": short_type,
			"label": `${short_type} ${id}`,
			"default_agent": "operator-display",
			"attached_to": id,
			"device_type": type,
			"hold_screen_design": "/production/operator-display/design/landing.html"
		}, data);
	}

	_linkToRegistry() {}

	_unlinkToRegistry() {}

	list() {
		const {cb} = this.req;
		const permissions = this.permissions;

		const qa_design = Promise.map(permissions, department => cb.get(`qa--satellite--${department}--template`).catch(e => {}));
		const oper_design = Promise.map(permissions, department => cb.get(`operator-display--satellite--${department}--template`).catch(e => {}));
		const routes = Promise.map(permissions, department => cb.get(`service-routing-map-${department}`).catch(e => {}));
		const all_services = cb
			.get('registry_service')
			.catch(e => ({content: []}));

		const services = this
			.util
			.getServiceMaps()
			.then(services => _.map(services, s => _.get(s, 'value.content', [])));

		return Promise
			.props({services, qa_design, oper_design, routes, all_services})
			.then(res => this._embedServices(res))
			.then(res => {
				return cb
					.get('global_org_structure')
					.then(({value}) => {
						const {content} = value;

						const list = _.map(permissions, (permission, index) => {
							const dep = _.find(content, {'@id': permission});
							if (dep["@type"] == "Office") 
								return dep;
							dep.services = res.services[index];
							dep.qa_design = _.get(res, [
								'qa_design', index, 'value'
							], {});
							dep.oper_design = _.get(res.oper_design[index], 'value', {});
							dep.routes = _.get(res.routes[index], 'value', {});
							return dep;
						});

						const helpers = {
							office: value.content,
							labels: serviceToLabels(res.all_services)
						};
						return {list, helpers};
					});
			})
			.then(data => this.res.json(data));
	}

	_embedServices(res) {
		const {cb} = this.req;
		const has_services = _
			.get(res, 'all_services.value.content', [])
			.length;
		const all_services = has_services
			? res.all_services.value.content
			: _
				.chain(res.services)
				.flatMap()
				.uniq()
				.value();

		return Promise.props(Object.assign(res, {
			all_services: cb.getMulti(all_services)
		}))
	}
}

module.exports = Departments;
