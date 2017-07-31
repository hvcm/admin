"use strict";

const Basic = require('./basic.js');

class Services extends Basic {
	save() {
		const {data} = this.req.body;
		const {cb} = this.req;
		const id = data["@id"];

		return cb
			.upsert(id, data)
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
		const {cb} = this.req;
		const id = data["@id"];
		const linked_to = data.linked_to;

		if (!linked_to) {
			return Promise.resolve({});
		}

		_.unset(data, 'linked_to');

		const local_ids = _.concat(_.map(_.castArray(linked_to), item => `registry_service_${item}`), 'registry_service');

		const pushes = Promise.map(local_ids, local_id => cb.get(local_id).then(({value}) => {
			if (!value) {
				return;
			}
			const {content} = value;
			content.push(id);
			value.content = _.compact(content);
			return cb.upsert(local_id, value)
		}));

		return pushes;
	}
	unlink(data) {
		const {cb} = this.req;
		const id = data["@id"];

		const deletions = Promise.map(_.concat(this.permissions, 'registry_service'), item => cb.get(`registry_service_${item}`).then(({value}) => {
			if (!value) {
				return;
			}

			const {content} = value;
			if (!content.includes(id)) {
				return;
			}

			value.content = _.without(content, id);
			return cb.upsert(`registry_service_${item}`, value)
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

		const helpers = Promise.props({
			schedule,
			offices: this
				.util
				.getOffices()
				.then(items => this.permissions.map(p => _.find(items, {"@id": p}))),
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
