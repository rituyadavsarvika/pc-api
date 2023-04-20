const slugify = require('slugify');
const generateUniqueId = require('generate-unique-id');

// generate hierarchy
const generateHierarchy = items => {
    return new Promise((resolve, reject) => {
        // check if items is array or not
        if (!items || !Array.isArray(items))
            reject({
                name: 'Argument type mismatch.',
                message: 'provided value should be an array.'
            });

        var tree = [],
            mappedArr = {};
        // Build a hash table and map items to objects
        items.forEach(function (item) {
            var id = item._id;
            if (!mappedArr.hasOwnProperty(id)) {
                // in case of duplicates
                mappedArr[id] = {
                    id,
                    name: item.name,
                    parentId: item.parentId ? item.parentId : undefined
                }; // the extracted id as key, and the item as value
                mappedArr[id].child = []; // under each item, add a key "children" with an empty array as value
            }
        });
        // If root-level nodes are not included in hash table, include them
        items.forEach(function (item) {
            var parentId = item.parentId;
            if (parentId && !mappedArr.hasOwnProperty(parentId)) {
                // make up an item for root-level node
                newItem = {
                    id: parentId,
                    name: item.name
                };
                mappedArr[parentId] = newItem; // the parent id as key, and made-up an item as value
                mappedArr[parentId].child = [];
            }
        });
        // Loop over hash table
        for (var id in mappedArr) {
            // console.log('id', id);
            if (mappedArr.hasOwnProperty(id)) {
                mappedElem = mappedArr[id];
                // If the element is not at the root level, add it to its parent array of children.
                // Note this will continue till we have only root level elements left
                if (mappedElem.parentId) {
                    var parentId = mappedElem.parentId;
                    mappedArr[parentId].child.push({
                        id: mappedElem.id,
                        name: mappedElem.name,
                        child: []
                    });
                }
                // If the element is at the root level, directly push to the tree
                else {
                    tree.push(mappedElem);
                }
            }
        }
        resolve(tree);
    });
};

const generateUniqueNumber = (length, useLetters, useNumbers) => {
    return new Promise((resolve, reject) => {
        const uniqueNumber = generateUniqueId({
            length: length,
            useLetters: useLetters,
            useNumbers: useNumbers
        });

        resolve(uniqueNumber);
    });
};

// middleware to slugify a field
const generateSlug = field => {
    return new Promise((resolve, reject) => {
        if (field) {
            // remove some special characters from domain
            slug = slugify(field, {
                remove: /[*?+/~.,%^$=()#&'"!:@]/g,
                lower: true
            });
            resolve(slug);
        } else reject({ message: 'Nothing to slugify', statusCode: 400 });
    });
};

module.exports = {
    generateHierarchy,
    generateUniqueNumber,
    generateSlug
};
