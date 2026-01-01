// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract DynasticIdentity is Initializable, ERC721Upgradeable, AccessControlUpgradeable {
    bytes32 public constant ROYAL_HERALD_ROLE = keccak256("ROYAL_HERALD_ROLE");
    
    mapping(uint256 => string) private _titles;

    event TitleConferred(address indexed sovereign, uint256 tokenId, string title);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) initializer public {
        __ERC721_init("Codex Dynastic Identity", "CDI");
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(ROYAL_HERALD_ROLE, initialOwner);
    }

    function conferTitle(address to, uint256 tokenId, string memory title) public onlyRole(ROYAL_HERALD_ROLE) {
        _safeMint(to, tokenId);
        _titles[tokenId] = title;
        emit TitleConferred(to, tokenId, title);
    }

    function getTitle(uint256 tokenId) public view returns (string memory) {
        return _titles[tokenId];
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert("CDI: Soulbound tokens cannot be transferred");
        }
        return super._update(to, tokenId, auth);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721Upgradeable, AccessControlUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
