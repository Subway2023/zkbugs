/**
 * @module @zk-kit/utils
 * @version 1.2.1
 * @file Essential zero-knowledge utility library for JavaScript developers.
 * @copyright Ethereum Foundation 2024
 * @license MIT
 * @see [Github]{@link https://github.com/privacy-scaling-explorations/zk-kit/tree/main/packages/utils}
*/
import { Buffer } from 'buffer';
export { Buffer } from 'buffer';
import { randomBytes } from 'crypto';

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

var typeChecks = /*#__PURE__*/Object.freeze({
    __proto__: null,
    isArray: isArray,
    isBigInt: isBigInt,
    isBigNumber: isBigNumber,
    isBigNumberish: isBigNumberish,
    isBuffer: isBuffer,
    isDefined: isDefined,
    isFunction: isFunction,
    isHexadecimal: isHexadecimal,
    isNumber: isNumber,
    isObject: isObject,
    isString: isString,
    isStringifiedBigInt: isStringifiedBigInt,
    isSupportedType: isSupportedType,
    isType: isType,
    isUint8Array: isUint8Array,
    supportedTypes: supportedTypes
});

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
    if (!isDefined(parameterValue)) {
        throw new TypeError(`Parameter '${parameterName}' is not defined`);
    }
}
/**
 * @throws Throws a type error if the parameter value is not a number.
 * @param parameterValue The parameter value.
 * @param parameterName The parameter name.
 */
function requireNumber(parameterValue, parameterName) {
    if (!isNumber(parameterValue)) {
        throw new TypeError(`Parameter '${parameterName}' is not a number, received type: ${typeof parameterValue}`);
    }
}
/**
 * @throws Throws a type error if the parameter value is not a string.
 * @param parameterValue The parameter value.
 * @param parameterName The parameter name.
 */
function requireString(parameterValue, parameterName) {
    if (!isString(parameterValue)) {
        throw new TypeError(`Parameter '${parameterName}' is not a string, received type: ${typeof parameterValue}`);
    }
}
/**
 * @throws Throws a type error if the parameter value is not a function.
 * @param parameterValue The parameter value.
 * @param parameterName The parameter name.
 */
function requireFunction(parameterValue, parameterName) {
    if (!isFunction(parameterValue)) {
        throw new TypeError(`Parameter '${parameterName}' is not a function, received type: ${typeof parameterValue}`);
    }
}
/**
 * @throws Throws a type error if the parameter value is not an Array.
 * @param parameterValue The parameter value.
 * @param parameterName The parameter name.
 */
function requireArray(parameterValue, parameterName) {
    if (!isArray(parameterValue)) {
        throw new TypeError(`Parameter '${parameterName}' is not an Array instance`);
    }
}
/**
 * @throws Throws a type error if the parameter value is not a Uint8Array.
 * @param parameterValue The parameter value.
 * @param parameterName The parameter name.
 */
function requireUint8Array(parameterValue, parameterName) {
    if (!isUint8Array(parameterValue)) {
        throw new TypeError(`Parameter '${parameterName}' is not a Uint8Array instance`);
    }
}
/**
 * @throws Throws a type error if the parameter value is not a Buffer.
 * @param parameterValue The parameter value.
 * @param parameterName The parameter name.
 */
function requireBuffer(parameterValue, parameterName) {
    if (!isBuffer(parameterValue)) {
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
    if (!isObject(parameterValue)) {
        throw new TypeError(`Parameter '${parameterName}' is not an object, received type: ${typeof parameterValue}`);
    }
}
/**
 * @throws Throws a type error if the parameter value is not a bigint.
 * @param parameterValue The parameter value.
 * @param parameterName The parameter name.
 */
function requireBigInt(parameterValue, parameterName) {
    if (!isBigInt(parameterValue)) {
        throw new TypeError(`Parameter '${parameterName}' is not a bigint, received type: ${typeof parameterValue}`);
    }
}
/**
 * @throws Throws a type error if the parameter value is not a stringified bigint.
 * @param parameterValue The parameter value.
 * @param parameterName The parameter name.
 */
function requireStringifiedBigInt(parameterValue, parameterName) {
    if (!isStringifiedBigInt(parameterValue)) {
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
    if (!isHexadecimal(parameterValue, prefix)) {
        throw new TypeError(`Parameter '${parameterName}' is not a hexadecimal string`);
    }
}
/**
 * @throws Throws a type error if the parameter value is not a bignumber.
 * @param parameterValue The parameter value.
 * @param parameterName The parameter name.
 */
function requireBigNumber(parameterValue, parameterName) {
    if (!isBigNumber(parameterValue)) {
        throw new TypeError(`Parameter '${parameterName}' is not a bignumber`);
    }
}
/**
 * @throws Throws a type error if the parameter value is not a bignumber-ish.
 * @param parameterValue The parameter value.
 * @param parameterName The parameter name.
 */
function requireBigNumberish(parameterValue, parameterName) {
    if (!isBigNumberish(parameterValue)) {
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
        if (!isSupportedType(type)) {
            throw new Error(`Type '${type}' is not supported`);
        }
    }
    for (const type of types) {
        if (isType(parameterValue, type)) {
            return;
        }
    }
    throw new TypeError(`Parameter '${parameterName}' is none of the following types: ${types.join(", ")}`);
}

var errorHandlers = /*#__PURE__*/Object.freeze({
    __proto__: null,
    requireArray: requireArray,
    requireBigInt: requireBigInt,
    requireBigNumber: requireBigNumber,
    requireBigNumberish: requireBigNumberish,
    requireBuffer: requireBuffer,
    requireDefined: requireDefined,
    requireFunction: requireFunction,
    requireHexadecimal: requireHexadecimal,
    requireNumber: requireNumber,
    requireObject: requireObject,
    requireString: requireString,
    requireStringifiedBigInt: requireStringifiedBigInt,
    requireTypes: requireTypes,
    requireUint8Array: requireUint8Array
});

/**
 * @module Conversions
 * This module provides a collection of utility functions for converting
 * between different numerical formats, particularly focusing on
 * conversions involving bigints, hexadecimals and buffers.
 * The module is structured with clear function naming to indicate
 * the conversion direction (e.g., `bigIntToHexadecimal` for BigInt
 * to hexadecimal, `bufferToBigInt` for buffer to bigint) and employs
 * type checks to ensure the correct handling of various input types.
 * It also includes variations for both big-endian (`be`) and little-endian
 * (`le`) conversions. It is important to note that when there is no prefix,
 * the order of bytes is always big-endian.
 */
/**
 * Converts a bigint to a hexadecimal string.
 * @param value The bigint value to convert.
 * @returns The hexadecimal representation of the bigint.
 */
function bigIntToHexadecimal(value) {
    requireBigInt(value, "value");
    let hex = value.toString(16);
    // Ensure even length.
    if (hex.length % 2 !== 0) {
        hex = `0${hex}`;
    }
    return hex;
}
/**
 * Converts a hexadecimal string to a bigint. The input is interpreted as hexadecimal
 * with or without a '0x' prefix. It uses big-endian byte order.
 * @param value The hexadecimal string to convert.
 * @returns The bigint representation of the hexadecimal string.
 */
function hexadecimalToBigInt(value) {
    if (!isHexadecimal(value) && !isHexadecimal(value, false)) {
        throw new TypeError(`Parameter 'value' is not a hexadecimal string`);
    }
    // Ensure the hex string starts with '0x'.
    const formattedHexString = value.startsWith("0x") ? value : `0x${value}`;
    return BigInt(formattedHexString);
}
/**
 * Converts a buffer of bytes to a bigint using big-endian byte order.
 * It accepts 'Buffer' or 'Uint8Array'.
 * @param value The buffer to convert.
 * @returns The bigint representation of the buffer's contents.
 */
function beBufferToBigInt(value) {
    requireTypes(value, "value", ["Buffer", "Uint8Array"]);
    return BigInt(`0x${Buffer.from(value).toString("hex")}`);
}
/**
 * Converts a buffer to a bigint using little-endian byte order.
 * It accepts 'Buffer' or 'Uint8Array'.
 * @param value The buffer to convert.
 * @returns The bigint representation of the buffer's contents in little-endian.
 */
function leBufferToBigInt(value) {
    requireTypes(value, "value", ["Buffer", "Uint8Array"]);
    return BigInt(`0x${Buffer.from(value).reverse().toString("hex")}`);
}
/**
 * Converts a buffer to a bigint. Alias for beBufferToBigInt.
 * @param value The buffer to convert.
 * @returns The bigint representation of the buffer's contents.
 */
function bufferToBigInt(value) {
    return beBufferToBigInt(value);
}
/**
 * Converts a bigint to a buffer and fills with zeros if a valid
 * size (i.e. number of bytes) is specified. If the size is not defined,
 * it gets the size from the given bigint. If the specified size is smaller than
 * the size of the bigint (i.e. `minSize`), an error is thrown.
 * It uses big-endian byte order.
 * @param value The bigint to convert.
 * @param size The number of bytes of the buffer to return.
 * @returns The buffer representation of the bigint.
 */
function beBigIntToBuffer(value, size) {
    const hex = bigIntToHexadecimal(value);
    // Calculate the minimum buffer size required to represent 'n' in bytes.
    // Each hexadecimal character represents 4 bits, so 2 characters are 1 byte.
    const minSize = Math.ceil(hex.length / 2);
    if (!size) {
        size = minSize;
    }
    else if (size < minSize) {
        throw Error(`Size ${size} is too small, need at least ${minSize} bytes`);
    }
    // Allocate buffer of the desired size, filled with zeros.
    const buffer = Buffer.alloc(size, 0);
    const fromHex = Buffer.from(hex, "hex");
    fromHex.copy(buffer, size - fromHex.length);
    return buffer;
}
/**
 * Converts a bigint to a buffer and fills with zeros if a valid
 * size (i.e. number of bytes) is specified. If the size is not defined,
 * it gets the size from the given bigint. If the specified size is smaller than
 * the size of the bigint (i.e. `minSize`), an error is thrown.
 * It uses little-endian byte order.
 * @param value The bigint to convert.
 * @param size The number of bytes of the buffer to return.
 * @returns The buffer representation of the bigint in little-endian.
 */
function leBigIntToBuffer(value, size) {
    const hex = bigIntToHexadecimal(value);
    // Calculate the minimum buffer size required to represent 'n' in bytes.
    // Each hexadecimal character represents 4 bits, so 2 characters are 1 byte.
    const minSize = Math.ceil(hex.length / 2);
    if (!size) {
        size = minSize;
    }
    else if (size < minSize) {
        throw Error(`Size ${size} is too small, need at least ${minSize} bytes`);
    }
    // Allocate buffer of the desired size, filled with zeros.
    const buffer = Buffer.alloc(size, 0);
    const fromHex = Buffer.from(hex, "hex").reverse();
    fromHex.copy(buffer, 0);
    return buffer;
}
/**
 * Converts a bigint to a buffer. Alias for beBigIntToBuffer.
 * @param value The bigint to convert.
 * @returns The buffer representation of the bigint.
 */
function bigIntToBuffer(value) {
    return beBigIntToBuffer(value);
}
/**
 * Converts a BigNumberish type to a bigint. If the input is already a bigint,
 * the return value will be the bigint itself, otherwise it will be converted
 * to a bigint using big-endian byte order.
 * @param value The BigNumberish value to convert.
 * @returns The bigint representation of the BigNumberish value.
 */
function bigNumberishToBigInt(value) {
    requireBigNumberish(value, "value");
    if (isBuffer(value) || isUint8Array(value)) {
        return bufferToBigInt(value);
    }
    return BigInt(value);
}
/**
 * Converts a BigNumberish type to a buffer. If the input is already a buffer,
 * the return value will be the buffer itself, otherwise it will be converted
 * to a buffer using big-endian byte order.
 * @param value The BigNumberish value to convert.
 * @returns The buffer representation of the BigNumberish value.
 */
function bigNumberishToBuffer(value) {
    requireBigNumberish(value, "value");
    if (isBuffer(value) || isUint8Array(value)) {
        return Buffer.from(value);
    }
    return bigIntToBuffer(bigNumberishToBigInt(value));
}
/**
 * Converts an hexadecimal string to a buffer. The hexadecimal string
 * should not start with '0x' or '0X'. It keeps the bytes in the same order.
 * @param value The hexadecimal string to convert.
 * @returns The buffer representation of the hexadecimal string.
 */
function hexadecimalToBuffer(value) {
    requireHexadecimal(value, "value", false);
    // Ensure even length before converting to buffer.
    if (value.length % 2 !== 0) {
        value = `0${value}`;
    }
    return Buffer.from(value, "hex");
}
/**
 * Converts a buffer to a hexadecimal string. It accepts 'Buffer' or 'Uint8Array'.
 * The hexadecimal string will not start with '0x' or '0X'. It keeps the bytes in the same order.
 * @param value The buffer to convert.
 * @returns The converted hexadecimal string.
 */
function bufferToHexadecimal(value) {
    requireTypes(value, "value", ["Buffer", "Uint8Array"]);
    return Buffer.from(value).toString("hex");
}
/**
 * Converts bytes to a base64 string. It accepts 'Buffer' or 'Uint8Array'.
 * @param value The bytes to convert.
 * @returns The converted base64 string.
 */
function bufferToBase64(value) {
    requireTypes(value, "value", ["Buffer", "Uint8Array"]);
    return Buffer.from(value).toString("base64");
}
/**
 * Converts a base64 string to bytes (i.e. a buffer). This function does not check
 * if the input value is a valid base64 string. If there are unsupported characters
 * they will be ignored.
 * @param value The base64 string to convert.
 * @returns The converted buffer.
 */
function base64ToBuffer(value) {
    requireString(value, "value");
    return Buffer.from(value, "base64");
}
/**
 * Converts text (utf8) to a base64 string.
 * @param value The text to convert.
 * @returns The converted base64 string.
 */
function textToBase64(value) {
    requireString(value, "value");
    return Buffer.from(value, "utf8").toString("base64");
}
/**
 * Converts a base64 string to text (utf8). This function does not check
 * if the input value is a valid base64 string. If there are unsupported characters
 * they could be ignored and the result may be unexpected.
 * @param value The base64 string to convert.
 * @returns The converted text.
 */
function base64ToText(value) {
    requireString(value, "value");
    return Buffer.from(value, "base64").toString("utf8");
}

var conversions = /*#__PURE__*/Object.freeze({
    __proto__: null,
    base64ToBuffer: base64ToBuffer,
    base64ToText: base64ToText,
    beBigIntToBuffer: beBigIntToBuffer,
    beBufferToBigInt: beBufferToBigInt,
    bigIntToBuffer: bigIntToBuffer,
    bigIntToHexadecimal: bigIntToHexadecimal,
    bigNumberishToBigInt: bigNumberishToBigInt,
    bigNumberishToBuffer: bigNumberishToBuffer,
    bufferToBase64: bufferToBase64,
    bufferToBigInt: bufferToBigInt,
    bufferToHexadecimal: bufferToHexadecimal,
    hexadecimalToBigInt: hexadecimalToBigInt,
    hexadecimalToBuffer: hexadecimalToBuffer,
    leBigIntToBuffer: leBigIntToBuffer,
    leBufferToBigInt: leBufferToBigInt,
    textToBase64: textToBase64
});

/**
 * Generates a random sequence of bytes securely using Node.js's crypto module.
 * @param size The number of bytes to generate.
 * @returns A Uint8Array containing the generated random bytes.
 */
/* eslint-disable import/prefer-default-export */
function getRandomValues(size) {
    if (size <= 0)
        throw Error(`size ${size} is too small, need at least 1`);
    const buffer = randomBytes(size);
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}

var crypto_node = /*#__PURE__*/Object.freeze({
    __proto__: null,
    getRandomValues: getRandomValues
});

/**
 * @module Scalar
 * This module provides utility functions for performing scalar operations
 * within a field, especially designed to handle operations on bigints.
 * The operations include scalar inversion (`inv`), scalar exponentiation (`pow`),
 * and modular reduction. Functions are carefully implemented to ensure
 * mathematical correctness and efficiency, supporting both positive and
 * negative bigint values. The module aims to provide robust tools for
 * cryptographic calculations and other applications requiring high-precision
 * arithmetic in fields.
 */
/**
 * Checks if a bigint scalar value is zero.
 * @param a The bigint scalar value to check.
 * @returns True if 'a' is zero, false otherwise.
 */
function isZero(a) {
    return !a;
}
/**
 * Determines whether a bigint scalar value is odd.
 * @param a The bigint scalar value to check.
 * @returns True if 'a' is odd, false if it is even.
 */
function isOdd(a) {
    return (a & BigInt(1)) === BigInt(1);
}
/**
 * Performs a bitwise right shift on a bigint scalar value.
 * This operation is equivalent to dividing by 2^n, but it operates directly
 * on the binary representation, making it efficient for certain types of calculations.
 * @param a The bigint scalar value to shift.
 * @param n The number of bits to shift 'a' by.
 * @returns The result of shifting 'a' right by 'n' bits.
 */
function shiftRight(a, n) {
    return a >> n;
}
/**
 * Multiplies two bigint scalar values.
 * @param a The first bigint scalar value.
 * @param b The second bigint scalar value.
 * @returns The product of 'a' and 'b'.
 */
function mul(a, b) {
    return a * b;
}
/**
 * Compares two bigint scalar values to determine if the first is greater than the second.
 * @param a The first bigint scalar value to compare.
 * @param b The second bigint scalar value to compare.
 * @returns True if 'a' is greater than 'b', false otherwise.
 */
function gt(a, b) {
    return a > b;
}
/**
 * Converts a bigint scalar value into an array of bits, represented as numbers.
 * This function is particularly useful for examining the binary structure of bigints,
 * which can be necessary for bit manipulation and understanding the representation
 * of numbers at a lower level.
 * @param n The bigint scalar value to convert into bits.
 * @returns An array of numbers representing the bits of 'n', starting from the least significant bit.
 */
function bits(n) {
    const res = [];
    let E = n;
    while (E) {
        if (E & BigInt(1)) {
            res.push(1);
        }
        else {
            res.push(0);
        }
        E >>= BigInt(1);
    }
    return res;
}

var scalar = /*#__PURE__*/Object.freeze({
    __proto__: null,
    bits: bits,
    gt: gt,
    isOdd: isOdd,
    isZero: isZero,
    mul: mul,
    shiftRight: shiftRight
});

/**
 * @class F1Field
 * Represents a finite field of order 'order' providing arithmetic operations under modulus.
 * This class includes operations such as addition, subtraction, multiplication, division,
 * and inversion, all performed modulo the field's order. It's designed to work with bigints,
 * supporting large numbers for cryptographic purposes and other applications requiring
 * modular arithmetic.
 * Note that the outputs of the functions will always be within the field if and only if
 * the input values are within the field. Devs need to make sure of that.
 *
 * @property one Represents the scalar value 1 in the field.
 * @property zero Represents the scalar value 0 in the field.
 * @property _order The order of the finite field (i.e., the modulus).
 * @property _half Half the order of the field, used for certain comparisons.
 * @property _negone The scalar value -1 in the field, represented positively.
 */
class F1Field {
    constructor(order) {
        this.one = 1n;
        this.zero = 0n;
        this._order = order;
        this._half = order >> this.one;
        this._negone = this._order - this.one;
    }
    /**
     * Ensures a given result falls within the field by applying modular reduction.
     * This method also handles negative inputs, correctly mapping them into the field.
     * @param res The result to be normalized to the field.
     * @returns The equivalent value within the field.
     */
    e(res) {
        res %= this._order;
        return res < 0 ? res + this._order : res;
    }
    /**
     * Performs modular multiplication of two bigint values within the field.
     * @param a The first value.
     * @param b The second value.
     * @returns The product of 'a' and 'b' modulo the field's order.
     */
    mul(a, b) {
        return (a * b) % this._order;
    }
    /**
     * Subtracts one bigint from another under modulus.
     * It ensures the result is within the field if and only if the input values are within the field.
     * @param a The value from which to subtract.
     * @param b The value to be subtracted.
     * @returns The difference of 'a' and 'b' modulo the field's order.
     */
    sub(a, b) {
        return a >= b ? a - b : this._order - b + a;
    }
    /**
     * Adds two bigint values together under modulus.
     * It ensures the result is within the field if and only if the input values are within the field.
     * @param a The first value.
     * @param b The second value.
     * @returns The sum of 'a' and 'b' modulo the field's order.
     */
    add(a, b) {
        const res = a + b;
        return res >= this._order ? res - this._order : res;
    }
    /**
     * Computes the multiplicative inverse of a given value within the field.
     * This method uses the Extended Euclidean Algorithm to find the inverse,
     * ensuring the result is always a positive value less than the field's order.
     * If the input value is zero, which has no inverse, an error is thrown.
     * @param a The value for which to compute the inverse.
     * @returns The multiplicative inverse of 'a' modulo the field's order.
     * @throws if 'a' is zero.
     */
    inv(a) {
        if (a === this.zero) {
            throw new Error("Zero has no inverse");
        }
        let t = this.zero;
        let r = this._order;
        let newt = this.one;
        let newr = a % this._order;
        while (newr) {
            const q = r / newr;
            [t, newt] = [newt, t - q * newt];
            [r, newr] = [newr, r - q * newr];
        }
        if (t < this.zero) {
            t += this._order;
        }
        return t;
    }
    /**
     * Divides one bigint by another within the field by multiplying the first value
     * by the multiplicative inverse of the second.
     * @param a The dividend.
     * @param b The divisor.
     * @returns The result of the division of 'a' by 'b' modulo the field's order.
     */
    div(a, b) {
        return this.mul(a, this.inv(b));
    }
    /**
     * Checks if two bigint values are equal within the context of the field.
     * It ensures the result is within the field if and only if the input values are within the field.
     * @param a The first value to compare.
     * @param b The second value to compare.
     * @returns True if 'a' equals 'b', false otherwise.
     */
    eq(a, b) {
        return a === b;
    }
    /**
     * Squares a bigint value within the field.
     * This is a specific case of multiplication where the value is multiplied by itself,
     * optimized for performance where applicable.
     * It ensures the result is within the field if and only if the input values are within the field.
     * @param a The value to square.
     * @returns The square of 'a' modulo the field's order.
     */
    square(a) {
        return (a * a) % this._order;
    }
    /**
     * Compares two bigint values to determine if the first is less than the second,
     * taking into account the field's order for modular comparison.
     * It ensures the result is within the field if and only if the input values are within the field.
     * @param a The first value to compare.
     * @param b The second value to compare.
     * @returns True if 'a' is less than 'b', false otherwise.
     */
    lt(a, b) {
        const aa = a > this._half ? a - this._order : a;
        const bb = b > this._half ? b - this._order : b;
        return aa < bb;
    }
    /**
     * Compares two bigint values to determine if the first is greater than or equal to the second,
     * considering the field's modular context.
     * It ensures the result is within the field if and only if the input values are within the field.
     * @param a The first value to compare.
     * @param b The second value to compare.
     * @returns True if 'a' is greater than or equal to 'b', false otherwise.
     */
    geq(a, b) {
        const aa = a > this._half ? a - this._order : a;
        const bb = b > this._half ? b - this._order : b;
        return aa >= bb;
    }
    /**
     * Computes the negation of a bigint value within the field.
     * The result is the modular additive inverse that, when added to the original value,
     * yields zero in the field's modulus.
     * It ensures the result is within the field if and only if the input values are within the field.
     * @param a The value to negate.
     * @returns The negation of 'a' modulo the field's order.
     */
    neg(a) {
        return a ? this._order - a : a;
    }
    /**
     * Checks if a bigint value is zero within the context of the field.
     * @param a The value to check.
     * @returns True if 'a' is zero, false otherwise.
     */
    isZero(a) {
        return a === this.zero;
    }
    /**
     * Raises a base to an exponent within the field, efficiently computing
     * scalar exponentiation using the square-and-multiply algorithm.
     * Supports both positive and negative exponents through the use of the `inv` method for negatives.
     * @param base The base to be exponentiated.
     * @param e The exponent.
     * @returns The result of raising 'base' to the power 'e' modulo the field's order.
     */
    pow(base, e) {
        if (isZero(e)) {
            return this.one;
        }
        if (e < 0n) {
            base = this.inv(base);
            e = -e;
        }
        const n = bits(e);
        if (n.length === 0) {
            return this.one;
        }
        let res = base;
        for (let i = n.length - 2; i >= 0; i -= 1) {
            res = this.square(res);
            if (n[i]) {
                res = this.mul(res, base);
            }
        }
        return res;
    }
}

/**
 * @module ProofPacking
 *
 * This module provides utility functions to pack and unpack
 * various types of objects, making it easier to export or use
 * them externally.
 */
/**
 * Packs a Snarkjs Groth16 proof into a single list usable as calldata in Solidity (public signals are not included).
 * @param proof The Groth16 proof generated with SnarkJS.
 * @returns Solidity calldata.
 */
function packGroth16Proof(proof) {
    return [
        proof.pi_a[0],
        proof.pi_a[1],
        proof.pi_b[0][1],
        proof.pi_b[0][0],
        proof.pi_b[1][1],
        proof.pi_b[1][0],
        proof.pi_c[0],
        proof.pi_c[1]
    ];
}
/**
 * Unpacks a PackedGroth16Proof Solidity calldata into its original form which is a SnarkJS Groth16 proof.
 * @param proof Solidity calldata.
 * @returns The Groth16 proof compatible with SnarkJS.
 */
function unpackGroth16Proof(proof) {
    return {
        pi_a: [proof[0], proof[1]],
        pi_b: [
            [proof[3], proof[2]],
            [proof[5], proof[4]]
        ],
        pi_c: [proof[6], proof[7]],
        protocol: "groth16",
        curve: "bn128"
    };
}

var proofPacking = /*#__PURE__*/Object.freeze({
    __proto__: null,
    packGroth16Proof: packGroth16Proof,
    unpackGroth16Proof: unpackGroth16Proof
});

export { F1Field, base64ToBuffer, base64ToText, beBigIntToBuffer, beBufferToBigInt, bigIntToBuffer, bigIntToHexadecimal, bigNumberishToBigInt, bigNumberishToBuffer, bufferToBase64, bufferToBigInt, bufferToHexadecimal, conversions, crypto_node as crypto, errorHandlers, hexadecimalToBigInt, hexadecimalToBuffer, isArray, isBigInt, isBigNumber, isBigNumberish, isBuffer, isDefined, isFunction, isHexadecimal, isNumber, isObject, isString, isStringifiedBigInt, isSupportedType, isType, isUint8Array, leBigIntToBuffer, leBufferToBigInt, packGroth16Proof, proofPacking as packing, requireArray, requireBigInt, requireBigNumber, requireBigNumberish, requireBuffer, requireDefined, requireFunction, requireHexadecimal, requireNumber, requireObject, requireString, requireStringifiedBigInt, requireTypes, requireUint8Array, scalar, supportedTypes, textToBase64, typeChecks, unpackGroth16Proof };
