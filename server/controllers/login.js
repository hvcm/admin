"use strict";

const Basic = require('./basic');
const cfg = require('../../config/default');

const User = require("./utils/users");
const _ = require('lodash');

class Login extends Basic {
	login() {
		const user = this.req.body.user;
		const password_hash = this.req.body.password;
		const opts = {
			expires: new Date(Date.now() + 12 * 60 * 60 * 1000)
		};

		const db_main = this.req.cb;

		User.authorize({
			user,
			password_hash
		}, {db_main}).then(res => {
			if (!res.state) {
				return res;
			}
			const user_id = res.value;
			const {cb} = this.req;
			const response = this.res;

			return cb
				.get(user_id)
				.then(data => {
					const user = data && data.value;

					if (!_.get(user, ['permissions', 'can-admin'])) {
						return res;
					}

					const permissions = _.get(user, 'permissions.can-admin', {});
					const superadmin = _.get(user, 'permissions.superadmin', false);
					const admins = _.reduce(permissions, (acc, item, index) => ((item && acc.push(index)), acc), []);
					const user_id = user["@id"];

					response.cookie('permissions', admins, opts);
					response.cookie('superadmin', superadmin, opts);
					response.cookie('user', user_id, opts);
					response.cookie('username', this.getUsername(user), opts);
					response.cookie('server', this.req.server_id, opts);

					return cb
						.get('global_org_structure')
						.then(structure => _.chain(structure.value.content).filter(item => ~ admins.indexOf(item['@id'])).map(Util.mapID).value())
						.then(() => user);
				})
		}).then(res => this.res.status(200).send(res));

	}
	getUsername(user) {
		const name = _.isString(user.first_name)
			? user.first_name[0] + '.'
			: '';
		const middle = _.isString(user.middle_name)
			? user.middle_name[0] + '.'
			: '';
		const last = user.last_name;

		return `${last} ${name} ${middle}`;
	}
}

module.exports = Login;
