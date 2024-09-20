# Under-Constrained

* Id: iden3/circomlib/veridise-V-CIRCOMLIB-VUL-002
* Project: https://github.com/iden3/circomlib
* Commit: cff5ab6288b55ef23602221694a6a38a0239dcc0
* Fix Commit: 
* DSL: Circom
* Vulnerability: Under-Constrained
* Location
  - Path: circuits/montgomery.circom
  - Function: Edwards2Montgomery
  - Line: 7-8
* Source: Audit Report
  - Source Link: https://f8t2x8b2.rocketcdn.me/wp-content/uploads/2023/02/VAR-circom-bigint.pdf
  - Bug ID: V-CIRCOMLIB-VUL-002: Underconstrained points in Edwards2Montgomery
* Commands
  - Setup Environment: `./zkbugs_setup.sh`
  - Reproduce: `./zkbugs_exploit.sh`
  - Compile and Preprocess: `./zkbugs_compile_setup.sh`
  - Positive Test: `./zkbugs_positive_test.sh`
  - Find Exploit: `./zkbugs_find_exploit.sh`
  - Clean: `./zkbugs_clean.sh`

## Short Description of the Vulnerability

The circuit does not implement constraint to avoid division by zero. When setting the divisor to 0, `out[1]` is underconstrained and can be set to any value.

## Short Description of the Exploit

Set `in[0]` to 0 to trigger division by zero. Set `out[1]` to 1337 just to show that it can be set to any value.

## Proposed Mitigation

Send `in[0]` and `1 - in[1]` to `isZero` template and let the constraint there do the work.

## Similar Bugs

* circom-bigint_circomlib/veridise_decoder_accepting_bogus_output_signal
* circom-bigint_circomlib/veridise_underconstrained_outputs_in_bitElementMulAny
* circom-bigint_circomlib/veridise_underconstrained_points_in_montgomery2Edwards
* circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryAdd
* circom-bigint_circomlib/veridise_underconstrained_points_in_montgomeryDouble