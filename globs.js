global._ = require('lodash');
global.Promise = require('bluebird');

global.Util = {
	mapID(item) {
		item.id = item['@id'];
		return item;
	}
}
