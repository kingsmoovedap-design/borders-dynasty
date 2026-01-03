// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// PSEUDO-CODE, DO NOT USE IN PRODUCTION WITHOUT AUDIT

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract BordersDynastyCoin is Initializable, ERC20Upgradeable, AccessControlUpgradeable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant GOVERNANCE_HOOK_ROLE = keccak256("GOVERNANCE_HOOK_ROLE");

    string public constant VERSION = "1.0.0";

    function initialize(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply_,
        address treasury_
    ) public initializer {
        __ERC20_init(name_, symbol_);
        __AccessControl_init();

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);

        _mint(treasury_, initialSupply_);
    }

    function version() external pure returns (string memory) {
        return VERSION;
    }

    // Example governance-tagged transfer (optional)
    function governanceTagTransfer(
        address from,
        address to,
        uint256 amount,
        bytes32 tag
    ) external onlyRole(GOVERNANCE_HOOK_ROLE) {
        // tag is purely informational at contract level
        _transfer(from, to, amount);
        // off-chain: you would log the tag via event or Codex
        // event GovernanceTaggedTransfer(from, to, amount, tag);
    }
}
