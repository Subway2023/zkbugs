/**
 * @module @zk-kit/utils
 * @version 1.2.1
 * @file Essential zero-knowledge utility library for JavaScript developers.
 * @copyright Ethereum Foundation 2024
 * @license MIT
 * @see [Github]{@link https://github.com/privacy-scaling-explorations/zk-kit/tree/main/packages/utils}
*/
'use strict';

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

exports.bits = bits;
exports.gt = gt;
exports.isOdd = isOdd;
exports.isZero = isZero;
exports.mul = mul;
exports.shiftRight = shiftRight;
