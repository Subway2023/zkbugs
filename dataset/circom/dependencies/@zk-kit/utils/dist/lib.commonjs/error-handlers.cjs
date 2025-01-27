/**
 * @module @zk-kit/utils
 * @version 1.2.1
 * @file Essential zero-knowledge utility library for JavaScript developers.
 * @copyright Ethereum Foundation 2024
 * @license MIT
 * @see [Github]{@link https://github.com/privacy-scaling-explorations/zk-kit/tree/main/packages/utils}
*/
'use strict';

var typeChecks = require('./type-checks.cjs');

/**
 * @module ErrorHandlers
 * This module is designed to provide utility functions for validating
 * function parameters. It includes functions that throw type errors if
 * the parameters do not meet specified criteria, such as being defined,
 * a number, a string, a function, or an array. This module helps ensure
 * that functions receive the correct types of inputs, enhancing code
 * reliability and reducing runtime errors.
 */
/**
 * @throws Throws a type error if the parameter value has not been defined.
 * @param parameterValue The parameter value.
 * @param parameterName The parameter name.
 */
function requireDefined(parameterValue, parameterName) {
    if (!typeChecks.isDefined(parameterValue)) {
        throw new TypeError(`Parameter '${parameterName}' is not defined`);
    }
}
/**
 * @throws Throws a type error if the parameter value is not a number.
 * @param parameterValue The parameter value.
 * @param parameterName The parameter name.
 */
function requireNumber(parameterValue, parameterName) {
    if (!typeChecks.isNumber(parameterValue)) {
        throw new TypeError(`Parameter '${parameterName}' is not a number, received type: ${typeof parameterValue}`);
    }
}
/**
 * @throws Throws a type error if the parameter value is not a string.
 * @param parameterValue The parameter value.
 * @param parameterName The parameter name.
 */
function requireString(parameterValue, parameterName) {
    if (!typeChecks.isString(parameterValue)) {
        throw new TypeError(`Parameter '${parameterName}' is not a string, received type: ${typeof parameterValue}`);
    }
}
/**
 * @throws Throws a type error if the parameter value is not a function.
 * @param parameterValue The parameter value.
 * @param parameterName The parameter name.
 */
function requireFunction(parameterValue, parameterName) {
    if (!typeChecks.isFunction(parameterValue)) {
        throw new TypeError(`Parameter '${parameterName}' is not a function, received type: ${typeof parameterValue}`);
    }
}
/**
 * @throws Throws a type error if the parameter value is not an Array.
 * @param parameterValue The parameter value.
 * @param parameterName The parameter name.
 */
function requireArray(parameterValue, parameterName) {
    if (!typeChecks.isArray(parameterValue)) {
        throw new TypeError(`Parameter '${parameterName}' is not an Array instance`);
    }
}
/**
 * @throws Throws a type error if the parameter value is not a Uint8Array.
 * @param parameterValue The parameter value.
 * @param parameterName The parameter name.
 */
function requireUint8Array(parameterValue, parameterName) {
    if (!typeChecks.isUint8Array(parameterValue)) {
        throw new TypeError(`Parameter '${parameterName}' is not a Uint8Array instance`);
    }
}
/**
 * @throws Throws a type error if the parameter value is not a Buffer.
 * @param parameterValue The parameter value.
 * @param parameterName The parameter name.
 */
function requireBuffer(parameterValue, parameterName) {
    if (!typeChecks.isBuffer(parameterValue)) {
        throw new TypeError(`Parameter '${parameterName}' is not a Buffer instance`);
    }
}
/**
 * @throws Throws a type error if the parameter value is not an object.
 * Please, note that arrays are also objects in JavaScript.
 * @param parameterValue The parameter value.
 * @param parameterName The parameter name.
 */
function requireObject(parameterValue, parameterName) {
    if (!typeChecks.isObject(parameterValue)) {
        throw new TypeError(`Parameter '${parameterName}' is not an object, received type: ${typeof parameterValue}`);
    }
}
/**
 * @throws Throws a type error if the parameter value is not a bigint.
 * @param parameterValue The parameter value.
 * @param parameterName The parameter name.
 */
function requireBigInt(parameterValue, parameterName) {
    if (!typeChecks.isBigInt(parameterValue)) {
        throw new TypeError(`Parameter '${parameterName}' is not a bigint, received type: ${typeof parameterValue}`);
    }
}
/**
 * @throws Throws a type error if the parameter value is not a stringified bigint.
 * @param parameterValue The parameter value.
 * @param parameterName The parameter name.
 */
function requireStringifiedBigInt(parameterValue, parameterName) {
    if (!typeChecks.isStringifiedBigInt(parameterValue)) {
        throw new TypeError(`Parameter '${parameterName}' is not a stringified bigint`);
    }
}
/**
 * @throws Throws a type error if the parameter value is not a hexadecimal string.
 * If 'prefix' is 'true', the string must start with '0x' or '0X' followed by one or more
 * hexadecimal digits (0-9, a-f, A-F), otherwise no prefix is expected. 'prefix' is optional and
 * if its value it is not explicitly defined it will be set to 'true' by default.
 * @param parameterValue The parameter value.
 * @param parameterName The parameter name.
 * @param prefix A boolean to include or not a '0x' or '0X' prefix.
 */
function requireHexadecimal(parameterValue, parameterName, prefix = true) {
    if (!typeChecks.isHexadecimal(parameterValue, prefix)) {
        throw new TypeError(`Parameter '${parameterName}' is not a hexadecimal string`);
    }
}
/**
 * @throws Throws a type error if the parameter value is not a bignumber.
 * @param parameterValue The parameter value.
 * @param parameterName The parameter name.
 */
function requireBigNumber(parameterValue, parameterName) {
    if (!typeChecks.isBigNumber(parameterValue)) {
        throw new TypeError(`Parameter '${parameterName}' is not a bignumber`);
    }
}
/**
 * @throws Throws a type error if the parameter value is not a bignumber-ish.
 * @param parameterValue The parameter value.
 * @param parameterName The parameter name.
 */
function requireBigNumberish(parameterValue, parameterName) {
    if (!typeChecks.isBigNumberish(parameterValue)) {
        throw new TypeError(`Parameter '${parameterName}' is not a bignumber-ish`);
    }
}
/**
 * @throws Throws a type error if the parameter value type is not part of the list of types.
 * @param parameterValue The parameter value.
 * @param parameterName The parameter name.
 */
function requireTypes(parameterValue, parameterName, types) {
    for (const type of types) {
        if (!typeChecks.isSupportedType(type)) {
            throw new Error(`Type '${type}' is not supported`);
        }
    }
    for (const type of types) {
        if (typeChecks.isType(parameterValue, type)) {
            return;
        }
    }
    throw new TypeError(`Parameter '${parameterName}' is none of the following types: ${types.join(", ")}`);
}

exports.requireArray = requireArray;
exports.requireBigInt = requireBigInt;
exports.requireBigNumber = requireBigNumber;
exports.requireBigNumberish = requireBigNumberish;
exports.requireBuffer = requireBuffer;
exports.requireDefined = requireDefined;
exports.requireFunction = requireFunction;
exports.requireHexadecimal = requireHexadecimal;
exports.requireNumber = requireNumber;
exports.requireObject = requireObject;
exports.requireString = requireString;
exports.requireStringifiedBigInt = requireStringifiedBigInt;
exports.requireTypes = requireTypes;
exports.requireUint8Array = requireUint8Array;
