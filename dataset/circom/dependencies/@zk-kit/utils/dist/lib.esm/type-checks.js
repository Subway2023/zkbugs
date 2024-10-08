/**
 * @module @zk-kit/utils
 * @version 1.2.1
 * @file Essential zero-knowledge utility library for JavaScript developers.
 * @copyright Ethereum Foundation 2024
 * @license MIT
 * @see [Github]{@link https://github.com/privacy-scaling-explorations/zk-kit/tree/main/packages/utils}
*/
import { Buffer } from 'buffer';

/**
 * @module TypeChecks
 * This module provides utility functions to check data types.
 * It defines a set of supported types and includes functions to check if
 * a value is defined and if it matches a supported type. These functions
 * are useful for type checking and validation in the other libraries,
 * enhancing code robustness and reliability.
 */
/** @internal */
const supportedTypes = [
    "number",
    "string",
    "function",
    "Array",
    "Uint8Array",
    "Buffer",
    "object",
    "bigint",
    "stringified-bigint",
    "hexadecimal",
    "bignumber",
    "bignumberish"
];
/**
 * Returns true if the value is defined, false otherwise.
 * @param value The value to be checked.
 */
function isDefined(value) {
    return typeof value !== "undefined";
}
/**
 * Returns true if the value is a number, false otherwise.
 * @param value The value to be checked.
 */
function isNumber(value) {
    return typeof value === "number";
}
/**
 * Returns true if the value is a string, false otherwise.
 * @param value The value to be checked.
 */
function isString(value) {
    return typeof value === "string";
}
/**
 * Returns true if the value is a function, false otherwise.
 * @param value The value to be checked.
 */
function isFunction(value) {
    return typeof value === "function";
}
/**
 * Returns true if the value is an object, false otherwise.
 * Please, note that arrays are also objects in JavaScript.
 * @param value The value to be checked.
 */
function isObject(value) {
    return typeof value === "object";
}
/**
 * Returns true if the value is an Array instance, false otherwise.
 * @param value The value to be checked.
 */
function isArray(value) {
    return isObject(value) && Array.isArray(value);
}
/**
 * Returns true if the value is a Uint8Array instance, false otherwise.
 * @param value The value to be checked.
 */
function isUint8Array(value) {
    return value instanceof Uint8Array;
}
/**
 * Returns true if the value is a Buffer instance, false otherwise.
 * @param value The value to be checked.
 */
function isBuffer(value) {
    return Buffer.isBuffer(value);
}
/**
 * Returns true if the value is a bigint, false otherwise.
 * @param value The value to be checked.
 */
function isBigInt(value) {
    return typeof value === "bigint";
}
/**
 * Checks if the given value is a string that represents a valid bigint.
 * @param value The value to be checked if it's a stringified bigint.
 */
function isStringifiedBigInt(value) {
    // Check if value is a string first.
    if (!isString(value)) {
        return false;
    }
    try {
        // Attempt to convert the string to BigInt.
        BigInt(value);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Checks if a string is a valid hexadecimal string representation.
 * If 'prefix' is 'true', the string must start with '0x' or '0X' followed by one or more
 * hexadecimal digits (0-9, a-f, A-F), otherwise no prefix is expected. 'prefix' is optional and
 * if its value it is not explicitly defined it will be set to 'true' by default.
 * @param value The string to be tested.
 * @param prefix A boolean to include or not a '0x' or '0X' prefix.
 */
function isHexadecimal(value, prefix = true) {
    if (!isString(value)) {
        return false;
    }
    if (prefix) {
        return /^(0x|0X)[0-9a-fA-F]+$/.test(value);
    }
    return /^[0-9a-fA-F]+$/.test(value);
}
/**
 * Checks if the given value can be considered as BigNumber.
 * A value is considered a BigNumber if it is a bigint or a string
 * that can be converted to a bigint (via `Bigint(s)`).
 * @param value The value to check.
 */
function isBigNumber(value) {
    return isBigInt(value) || isStringifiedBigInt(value);
}
/**
 * Checks if the given value can be considered as BigNumberish.
 * A value is considered BigNumberish if it meets
 * any of the following conditions: it's a number, a bigint, a string
 * that can be converted to a bigint, a hexadecimal
 * string, or a Buffer object.
 * @param value The value to check.
 */
function isBigNumberish(value) {
    return (isNumber(value) ||
        isBigInt(value) ||
        isStringifiedBigInt(value) ||
        isHexadecimal(value) ||
        isBuffer(value) ||
        isUint8Array(value));
}
/**
 * Returns true if the value type is the same as the type passed
 * as the second parameter, false otherwise.
 * @param value
 * @param type The expected type.
 */
function isType(value, type) {
    switch (type) {
        case "number":
            return isNumber(value);
        case "string":
            return isString(value);
        case "function":
            return isFunction(value);
        case "Array":
            return isArray(value);
        case "Uint8Array":
            return isUint8Array(value);
        case "Buffer":
            return isBuffer(value);
        case "object":
            return isObject(value);
        case "bigint":
            return isBigInt(value);
        case "stringified-bigint":
            return isStringifiedBigInt(value);
        case "hexadecimal":
            return isHexadecimal(value);
        case "bignumber":
            return isBigNumber(value);
        case "bignumberish":
            return isBigNumberish(value);
        default:
            return false;
    }
}
/**
 * Returns true if the type is being supported by this utility
 * functions, false otherwise.
 * @param type The type to be checked.
 */
function isSupportedType(type) {
    return supportedTypes.includes(type);
}

export { isArray, isBigInt, isBigNumber, isBigNumberish, isBuffer, isDefined, isFunction, isHexadecimal, isNumber, isObject, isString, isStringifiedBigInt, isSupportedType, isType, isUint8Array, supportedTypes };
