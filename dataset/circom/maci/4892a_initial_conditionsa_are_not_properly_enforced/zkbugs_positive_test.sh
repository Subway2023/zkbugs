#!/bin/bash
source zkbugs_vars.sh

# Print message for computing witness
echo "Computing witness"

# Run the command to compute the witness
node $CIRCUITJS/generate_witness.js $CIRCUITWASM $INPUTJSON $WTNS

# Print message for producing proof
echo "Checking witness"

snarkjs wtns check $R1CS $WTNS

rm $WTNS
# Exit
exit 0
