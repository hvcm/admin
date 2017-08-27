"use strict";

const Basic = require('./basic.js');

class Services extends Basic {
	save() {
		const {data} = this.req.body;
		const {cb} = this.req;
		const id = data["@id"];
		const excludes = data.linked_to;

		return cb
			.upsert(id, data)
			.then(() => this.unlink(data, excludes))
			.then(() => this.link(data))
			.then(data => this.res.json(data));
	}
	delete() {
		const {data} = this.req.body;
		const {cb, cookies} = this.req;

		const id = data["@id"];
		data.__REMOVED = true;

		return cb
			.upsert(id, data)
			.then(() => this.unlink(data))
			.then(data => this.res.json(data));
	}
	link(data) {
		const linked_to = data.linked_to;

		if (!linked_to) {
			return Promise.resolve({});
		}

		const {cb} = this.req;
		const id = data["@id"];

		_.unset(data, 'linked_to');

		const local_ids = _
			.chain(linked_to)
			.castArray()
			.map(item => `registry_service_${item}`)
			.concat('registry_service')
			.value();

		const pushes = Promise.map(local_ids, local_id => cb.get(local_id).then(({value}) => {
			if (!value) {
				return;
			}
			const {content} = value;
			content.push(id);
			value.content = _.uniq(_.compact(content));
			return cb.upsert(local_id, value)
		}));

		return pushes;
	}
	unlink(data, excludes = []) {
		const {cb} = this.req;
		const id = data["@id"];

		const registries = _
			.chain(this.permissions)
			.difference(excludes)
			.map(item => `registry_service_${item}`)
			.concat('registry_service')
			.value();

		const deletions = Promise.map(registries, item => cb.get(item).catch(() => ({value: false})).then(({value}) => {
			if (!value) {
				return;
			}

			const {content} = value;
			if (!content.includes(id)) {
				return;
			}

			value.content = _.without(content, id);
			return cb.upsert(item, value);
		}));

		return deletions;
	}
	list() {
		const {cb} = this.req;

		const getServiceMaps = this
			.util
			.getServiceMaps();

		const schedule = this
			.util
			.getSchedulesByView();

		const offices = this
			.util
			.getOffices();

		const groups = this
			.util
			.getServiceGroups()
			.then(data => _.map(data, item => _.pick(item.value, ['content', 'label'])));

		const fields = this
			.util
			.fieldsMap();

		const helpers = Promise.props({
			schedule,
			groups,
			fields,
			offices: offices.then(items => this.permissions.map(p => _.find(items, {"@id": p}))),
			service_map: getServiceMaps.then(data => _.transform(data, (acc, item) => {
				const key = _
					.get(item, 'value.@id', '')
					.substr(17);
				const value = item.value.content;
				if (key) {
					acc[key] = value;
				}

			}, {}))
		});

		const list = getServiceMaps
			.then(data => _.chain(data).flatMap('value.content').uniq().value())
			.then(data => cb.getMulti(data))
			.then(data => _.map(data, 'value'));

		return Promise
			.props({list, helpers})
			.then(data => this.res.json(data));
	}
}

module.exports = Services;
