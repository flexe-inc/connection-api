'use strict';

function equals(array1, array2) {
    if (array1 === array2) {
        return true;
    }
    if (!array1 || !array2 || array1.length !== array2.length) {
        return false;
    }

    for (let i = 0; i < array1.length; i++) {
        // Check if we have nested arrays
        if (array1[i] instanceof Array && array2[i] instanceof Array) {
            // Recurse into the nested arrays
            if (!equals(array1[i], array2[i])) {
                return false;
            }
        } else if (array1[i] !== array2[i]) {
            return false;
        }
    }
    return true;
}

module.exports = {
    getIn: function (object, key, defaultValue = null) {
        let currentObj = object;
        if (key) {
            let props = key.split('.');
            for (let i = 0, len = props.length; i < len; i++) {
                if (currentObj.hasOwnProperty(props[i])) {
                    currentObj = currentObj[props[i]];
                } else if (defaultValue) {
                    return defaultValue;
                } else {
                    return null;
                }
            }
            return currentObj;
        } else {
            return currentObj;
        }
    },

    isArrayEqual: function (array1, array2) {
        return equals(array1, array2);
    },
};

