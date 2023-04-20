const request = require('supertest');
const app = require('../src/app');
const catchAsync = require('./../src/utils/error/catchAsync');
const User = require('./../src/models/usersModel');

beforeEach(async () => {
	// try {
	await User.deleteOne({ role: 'SUPERADMIN' });
	console.log('Superadmin deleted');
	// } catch (error) {
	// console.log(error);
	// }
});

// Test case
test('Should Sign up a new franchisee', async () => {
	// try {
	await request(app)
		.post('/api/v1/users/test')
		.send({
			firstName: 'shariful',
			lastName: 'Islam',
			email: 'shariful.prolific@gmail.com',
			phone: '+8801742023458',
			password: 'rosh@1996#',
			confirmPassword: 'rosh@1996#'
		})
		.expect(201);
	// } catch (error) {
	// 	expect(500);
	// }
});
