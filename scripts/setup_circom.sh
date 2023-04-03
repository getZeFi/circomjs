#!/bin/bash

# exit on error
set -e

curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh -s -- -y
git clone https://github.com/iden3/circom.git
cd circom
cargo build --release
cargo install --path circom

npm install -g snarkjs
