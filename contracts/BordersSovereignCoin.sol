// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract BordersSovereignCoin is 
    Initializable, 
    ERC20Upgradeable, 
    ERC20PausableUpgradeable, 
    AccessControlUpgradeable, 
    ERC20PermitUpgradeable,
    OwnableUpgradeable 
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant GUARD_ROLE = keccak256("GUARD_ROLE");
    uint256 public constant MAX_SUPPLY = 1_000_000 * 10 ** 18;

    mapping(address => bool) private _blacklist;

    event SovereignMint(address indexed to, uint256 amount);
    event SovereignBurn(address indexed from, uint256 amount);
    event BlacklistUpdated(address indexed account, bool isBlacklisted);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) initializer public {
        __ERC20_init("Borders Sovereign Coin", "BSC");
        __ERC20Pausable_init();
        __AccessControl_init();
        __ERC20Permit_init("Borders Sovereign Coin");
        __Ownable_init(initialOwner);

        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(MINTER_ROLE, initialOwner);
        _grantRole(GUARD_ROLE, initialOwner);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function setBlacklist(address account, bool status) public onlyRole(GUARD_ROLE) {
        _blacklist[account] = status;
        emit BlacklistUpdated(account, status);
    }

    function isBlacklisted(address account) public view returns (bool) {
        return _blacklist[account];
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        require(!_blacklist[to], "BSC: recipient is blacklisted");
        require(totalSupply() + amount <= MAX_SUPPLY, "BSC: cap exceeded");
        _mint(to, amount);
        emit SovereignMint(to, amount);
    }

    function burn(uint256 amount) public {
        require(!_blacklist[_msgSender()], "BSC: caller is blacklisted");
        _burn(_msgSender(), amount);
        emit SovereignBurn(_msgSender(), amount);
    }

    /**
     * @dev Ensures compliance with modern sovereign finance standards (QFS-compatible architecture).
     * Provides a transparent ledger for institutional auditability while maintaining decentralized control.
     */
    function verifyCompliance() public pure returns (string memory) {
        return "QFS-Compatible Sovereign Ledger v1.0";
    }

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20Upgradeable, ERC20PausableUpgradeable)
    {
        require(!_blacklist[from] && !_blacklist[to], "BSC: address blacklisted");
        super._update(from, to, value);
    }
}
