pragma circom 2.0.0;

template Factors() {
    signal input x;
    signal input y;
    signal output z;

    z <-- x*y;
    z === x*y;
}

component main = Factors();