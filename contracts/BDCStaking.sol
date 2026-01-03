// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// PSEUDO-CODE – NOT AUDITED

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BDCStaking {
    IERC20 public immutable bdc;

    mapping(address => uint256> public staked;

    event BDCStaked(address indexed staker, uint256 amount);
    event BDCUnstaked(address indexed staker, uint256 amount);

    constructor(address bdcToken) {
        bdc = IERC20(bdcToken);
    }

    function stake(uint256 amount) external {
        require(amount > 0, "amount > 0");
        bdc.transferFrom(msg.sender, address(this), amount);
        staked[msg.sender] += amount;
        emit BDCStaked(msg.sender, amount);
    }

    function unstake(uint256 amount) external {
        require(amount > 0, "amount > 0");
        require(staked[msg.sender] >= amount, "insufficient staked");
        staked[msg.sender] -= amount;
        bdc.transfer(msg.sender, amount);
        emit BDCUnstaked(msg.sender, amount);
    }

    function stakedBalanceOf(address account) external view returns (uint256) {
        return staked[account];
    }
}
