const Basic = require('./basic');

class Logout extends Basic {
	logout() {
		this
			.res
			.clearCookie('permissions');
		this
			.res
			.clearCookie('user');
		this
			.res
			.clearCookie('server');
		this
			.res
			.clearCookie('superadmin');
		this
			.res
			.json({status: 'success'});
	}
}

module.exports = Logout;
