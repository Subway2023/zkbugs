# Under-Constrained

* Id: iden3/circomlib/veridise-V-CIRCOMLIB-VUL-001
* Project: https://github.com/iden3/circomlib
* Commit: cff5ab6288b55ef23602221694a6a38a0239dcc0
* Fix Commit: 
* DSL: Circom
* Vulnerability: Under-Constrained
* Location
  - Path: circuits/multiplexer.circom
  - Function: Decoder
  - Line: 10-11
* Source: Audit Report
  - Source Link: https://f8t2x8b2.rocketcdn.me/wp-content/uploads/2023/02/VAR-circom-bigint.pdf
  - Bug ID: V-CIRCOMLIB-VUL-001: Decoder accepting bogus output signal
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

## Short Description of the Vulnerability

The circuit does not constrain `out` properly, malicious prover can set a bogus `out` and set `success` to 0, the circuit won't throw error. This makes integration error-prone.

## Short Description of the Exploit

Set `out` to be full of zeroes and set `success` to 0.

## Proposed Mitigation

Send `inp - i` to `isZero` template and let the constraint there do the work.

## Similar Bugs

* circom-bigint_circomlib/veridise_underconstrained_outputs_in_bitElementMulAny
* circom-bigint_circomlib/veridise_underconstrained_points_in_edwards2Montgomery
* circom-bigint_circomlib/veridise_underconstrained_points_in_montgomery2Edwards
* circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryAdd
* circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryDouble
