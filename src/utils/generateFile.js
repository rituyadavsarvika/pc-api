const fs = require('fs');
const fileType = require('file-type');
const s3service = require('./../../service/s3service');

const functionWithPromise = location => {
	//a function that returns a promise
	return Promise.resolve(location);
};

const generateFile = async path => {
	const buffer = fs.readFileSync(path);
	const type = fileType(buffer);
	const fileName = `${Date.now().toString()}`;
	const data = await s3service.uploadFile(buffer, fileName, type);
	// return data.Location;
	return functionWithPromise(data.Location);
};

// iterate over imageList and upload each image
const getData = async list => {
	return Promise.all(list.map(item => generateFile(item.path)));
};

module.exports = {
	generateFile,
	getData
};
