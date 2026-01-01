// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ScrollHashRegistry {
    address public sovereign;
    mapping(bytes32 => bool) public verifiedHashes;

    event ScrollVerified(bytes32 indexed hash, address indexed verifier);

    constructor() {
        sovereign = msg.sender;
    }

    function verifyScroll(bytes32 hash) external {
        verifiedHashes[hash] = true;
        emit ScrollVerified(hash, msg.sender);
    }

    function isVerified(bytes32 hash) external view returns (bool) {
        return verifiedHashes[hash];
    }
}
