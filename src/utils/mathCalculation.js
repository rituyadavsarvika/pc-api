// return sum from a array Object
const arrayObjectSum = (arrayObject, key) =>
	arrayObject.reduce((accumulator, current) => accumulator + current[key], 0);

module.exports = { arrayObjectSum };
