'use strict';

const logger = require('./logger');
const CHARSET = '0123456789abcdef';
const BASE = CHARSET.length;
const KEY_LENGTH = 32;

function makeKeyOfEightChars(base) {
    const TEXT_LENGTH = 8;
    let maxNumber = Math.pow(base, TEXT_LENGTH);
    let id = Math.floor(Math.random() * maxNumber);
    let str = new Array(TEXT_LENGTH);
    let curDigit;
    for (let i = TEXT_LENGTH - 1; i > -1; i--) {
        maxNumber = Math.pow(base, i);
        curDigit = id > maxNumber ? Math.floor(id / maxNumber) : 0;
        str[TEXT_LENGTH - i - 1] = CHARSET.charAt(curDigit);
        id = id - curDigit * maxNumber;
    }
    str = str.join('');
    return str;
}

(function generate() {
    let result = '';
    for (let i = 0; i < KEY_LENGTH / 8; i++) {
        result += makeKeyOfEightChars(BASE);
    }
    logger.info(result);
})();

