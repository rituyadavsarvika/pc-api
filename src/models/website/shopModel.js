const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const shopSchema = Schema({
	data: Object,
	franchiseeId: {
		type: Schema.Types.ObjectId,
		ref: 'Franchisee',
		required: [true, 'A Product must have a franchisee value']
	}
});

module.exports = mongoose.model('Shop', shopSchema);
