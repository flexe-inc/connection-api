'use strict';

const YAML_LINE_BREAK = '\n';
const YAML_INDENT = '    ';
const YAML_KEY_VALUE_SEPARATOR = ': ';

/**
 * Print out the content of the object in YAML format
 * @param data An data to be converted. If the data is of primitive type or is an array, it will be printed a string.
 * If the data is an object or a map, it will be printed as a YAML string, with new line at both the beginning and the
 * end.
 * @param key Optional string name for the object to be printed as the header line
 * @returns {string}
 */
module.exports = function(data, key) {
    const stack = [];
    let result = '';
    let type = typeof data;
    let curObj;
    let i;
    let children;
    if (type === 'string') {
        return (key ? key + YAML_KEY_VALUE_SEPARATOR : '') + data;
    } else if (type !== 'object') {
        return (key ? key + YAML_KEY_VALUE_SEPARATOR : '') + data.toString();
    } else if (Array.isArray(data)) {
        return (key ? key + YAML_KEY_VALUE_SEPARATOR : '') + JSON.stringify(data);
    }

    if (key) {
        stack.push({ _key: key, _data: data, _depth: 0 });
    } else {
        if (data instanceof Map) {
            i = data.size;
            data.forEach(function (childValue, childKey) {
                stack[--i] = { _key: childKey, _data: childValue, _depth: 0 };
            });
        } else {
            children = Object.keys(data);
            i = children.length;
            while (i--) {
                stack.push({ _key: children[i], _data: data[children[i]] || '', _depth: 0 });
            }
        }
    }

    while (stack.length > 0) {
        curObj = stack.pop();
        if (result.length > 0 || !key) {
            result += YAML_LINE_BREAK;
        }

        for (i = 0; i < curObj._depth; i++) {
            result += YAML_INDENT;
        }

        result += curObj._key + YAML_KEY_VALUE_SEPARATOR;

        type = typeof curObj._data;

        if (type === 'string') {
            result += curObj._data;
        } else if (type !== 'object') {
            result += curObj._data.toString();
        } else if (Array.isArray(curObj._data)) {
            result += JSON.stringify(curObj._data);
        } else {
            if (curObj._data instanceof Map) {
                i = stack.length + curObj._data.size;
                for (let childKey in curObj._data) { // by the insertion order, so the first one will be on top
                    if (curObj._data.hasOwnProperty(childKey)) {
                        stack[--i] = { _key: childKey, _data: curObj._data[childKey], _depth: curObj._depth + 1 };
                    }
                }
            } else {
                children = Object.keys(curObj._data);
                i = children.length;
                while (i--) {
                    stack.push({ _key: children[i], _data: curObj._data[children[i]], _depth: curObj._depth + 1 });
                }
            }
        }
    }

    return result + YAML_LINE_BREAK;
};
