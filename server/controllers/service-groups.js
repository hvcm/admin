"use strict";

const Basic = require('./basic.js');

class ServiceGroups extends Basic {
	save(tosave) {
		let data = tosave || this.req.body.data;
		data = _.castArray(data);

		const {cb} = this.req;

		return Promise.map(data, item => cb.upsert(item["@id"], item)).then(() => this.update()).then(data => this.res.json(data));
	}
	update() {
		const {cb} = this.req;

		return cb.view(this.req.query('service_group').stale(3))
	}
	delete() {
		const {data} = this.req.body;
		const {cb, cookies} = this.req;

		const id = data["@id"];

		return cb
			.remove(id)
			.then(res => this.update())
			.then(res => this._unlinkFromSg(id))
			.then(res => this._unlinkFromTerm(id))
			.then(data => this.res.json(data));
	}
	_unlinkFromTerm(id) {
		const {cb} = this.req;

		return this
			.util
			.getWorkstationsId('terminal')
			.then(workstation_id => cb.getMulti(_.uniq(workstation_id)))
			.then(data => _.map(data, 'value'))
			.then(terms => {
				return Promise.all(terms, term => {
					if (term.bound_service_groups !== id) 
						return true;
					_.unset(term, 'bound_service_groups');

					return cb.upsert(term["@id"], term);
				})
			});
	}
	_unlinkFromSg(id) {
		return this
			.util
			.getServiceGroups()
			.then(data => _.map(data, 'value'))
			.then(groups => {
				return Promise.map(groups, group => {
					const content = _.get(group, 'content', []);

					if (!content.includes(id)) {
						return true;
					}

					_.remove(group.content, id);

					return this.save(group);
				});
			});
	}
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
			.then(data => _.map(data, 'value'));

		const helpers = Promise.props({services});
		return Promise
			.props({list, helpers})
			.then(data => this.res.json(data));
	}
}

module.exports = ServiceGroups;
