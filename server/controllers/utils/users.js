"use strict";

const _ = require('lodash');
const prop_mapping = {
	login: "login",
	password: "password"
};

module.exports = {
	authorize: function authorize({
		user,
		password
	}, {db_main}) {

		return db_main
			.get('global_membership_description')
			.then(data => {
				const keys = _
					.chain(data)
					.get('value.content', [])
					.map('member')
					.uniq()
					.value();

				return db_main.getMulti(keys);
			})
			.then(users => {
				const res = _.find(users, (val) => (_.get(val, 'value.login', null) === user || _.get(val, 'login', null) === user));

				if (!res) {
					return Promise.reject(new Error("No such user."));
				}

				const usr = res.value || res;

				if (!_.isEqual(usr[prop_mapping.password], password)) {
					return Promise.reject(new Error("Incorrect password."));
				}
				console.log(usr);
				return {state: true, value: usr["@id"]};
			})
			.catch(err => ({state: false, reason: err.message}));
	}
};
