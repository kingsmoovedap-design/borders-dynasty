// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BordersSovereignCoin is ERC20, Ownable {
    event SovereignMint(address indexed to, uint256 amount);
    event SovereignBurn(address indexed from, uint256 amount);

    constructor(address initialOwner) ERC20("Borders Sovereign Coin", "BSC") Ownable(initialOwner) {
        _mint(initialOwner, 1000000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
        emit SovereignMint(to, amount);
    }

    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
        emit SovereignBurn(msg.sender, amount);
    }
}
