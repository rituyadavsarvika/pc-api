// validate if an object is empty or not. return true if empty else false
const isEmptyObject = Obj =>
    Obj === undefined ||
    Obj === null ||
    (typeof Obj === 'object' && Object.keys(Obj).length === 0);

// utility to check is duplicate
const isDuplicate = async (query, value, field = '') => {
    const data = await query;
    const optionalMessage = field ? `for field '${field}'` : '';
    return new Promise((resolve, reject) => {
        if (!isEmptyObject(data))
            reject(`Multiple '${value}' ${optionalMessage} are not allowed`);
        else resolve(data);
    });
};

// utility to check is duplicate
const isValidId = async (query, value, field = '') => {
    const data = await query;
    return new Promise((resolve, reject) => {
        if (isEmptyObject(data)) reject(`${value} is invalid ${field}`);
        else resolve(data);
    });
};

// utilities to check if user is valid admin
const isAdmin = async (roleList, userRole) => {
    let isError = true;
    let errorString = "You don't have enough permission";

    if (
        !isEmptyObject(userRole) &&
        Array.isArray(roleList) &&
        roleList.includes(userRole)
    )
        isError = false;

    return new Promise((resolve, reject) => {
        if (isError) reject(errorString);
        else resolve();
    });
};

module.exports = { isEmptyObject, isDuplicate, isValidId, isAdmin };
