"use strict";

const Basic = require('./basic');
const cfg = require('../../config/default');

const auth = require("iris-auth-util");
const _ = require('lodash');
auth.configure({data: cfg.buckets.main, session: cfg.buckets.auth});

class Login extends Basic {
	login() {
		const user = this.req.body.user;
		const password_hash = this.req.body.password;

		auth
			.authorize({user, password_hash})
			.then(res => {
				if (!res.state) {
					return res;
				}

				const {user_id} = res.value;
				const {cb} = this.req;

				return cb
					.get(user_id)
					.then(data => {
						const user = data && data.value;

						if (!_.get(user, ['permissions', 'can-admin'])) {
							return res;
						}

						res.value.user = user;
						const permissions = _.get(user, [
							'permissions', 'can-admin'
						], {});
						const admins = _.reduce(permissions, (acc, item, index) => ((item && acc.push(index)), acc), []);
						const opts = {
							expires: new Date(Date.now() + 12 * 60 * 60 * 1000)
						};
						this
							.res
							.cookie('permissions', admins, opts);
						this
							.res
							.cookie('user', user["@id"], opts);
						this
							.res
							.cookie('username', this.getUsername(user), opts);

						return cb
							.get('global_org_structure')
							.then(structure => _.chain(structure.value.content).filter(item => ~ admins.indexOf(item['@id'])).map(Util.mapID).value())
							.then(globals => {
								res.value.admins = globals;
								return res;
							})

					})
			})
			.then(res => this.res.status(200).send(res));

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
