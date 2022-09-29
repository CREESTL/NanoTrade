// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/INanoProducedToken.sol";
import "./interfaces/INanoAdmin.sol";

/// @title A custom ERC721 contract allowing managing over ERC20 tokens
/// @dev This contract clones ERC721URIStorage's contract but instead of URIs it stores ERC20 addresses
contract NanoAdmin is INanoAdmin, ERC721, Ownable {

    using Counters for Counters.Counter;
    Counters.Counter internal _tokenIds;
    using Strings for uint256;
    
    /// @dev Mapping from ERC721 token ID to controlled ERC20 token addresses
    mapping(uint256 => address) private _adminToControlled;
    /// @dev Reverse mapping for `_adminToControlled`
    mapping(address => uint256) private _controlledToAdmin;
    /// @dev Mapping of holders of admin tokens
    /// @dev Value for each key (each holder) is the ID of the *last* admin token
    ///      that was minted to that holder. For example
    ///      - Admin token with ID = 1 gets minted to holder with address A
    ///      - _holderToId[A] = 1
    ///      - Admin token with ID = 2 gets minted to holder with address A
    ///      - _holderToId[A] = 2 and so on
    ///      This way the key always has some corresponding value except for the case
    ///      when *no admin tokens* were minted.
    ///      If there is any ID - it means that the address has at least one admin token
    mapping(address => uint256) private _holderToId;
    /// @dev Reverse mapping for `_holderToId`
    mapping(uint256 => address) private _IdToHolder
    /// @dev Mapping of used ERC20 tokens addresses
    mapping(address => bool) private _usedControlled;
    /// @dev The address of the factory minting admin tokens
    address private _factoryAddress;


    /// @dev Checks if caller is a factory address
    modifier onlyFactory() {
        require(msg.sender == _factoryAddress, "NanoAdmin: caller is not a factory!");
        _;
    }

    /// @dev Creates an "empty" NFT
    /// @param factoryAddress_ The address of the factory minting admin tokens
    constructor(address factoryAddress_) ERC721("", "") {
        require(factoryAddress_ != address(0), "NanoAdmin: factory address can not be zero address!");
        _factoryAddress = factoryAddress_;
    }

    /// @notice Checks it the provided address owns some admin token
    function checkOwner(address user) public view returns(uint256) {
        require(user != address(0), "NanoAdmin: zero address is an invalid user!");
        require(_holderToId[user] != 0, "NanoAdmin: user does not have an admin token!");
    }

    /// @notice Checks if the provided user owns an admin token controlling the provided ERC20 token
    /// @param user The address of the user that potentially controls ERC20 token
    /// @param ERC20Address The address of the potentially controlled ERC20 token 
    function verifyAdminToken(address user, address ERC20Address) public view returns(bool) {
        require(user != address(0), "NanoAdmin: user can not have a zero address!");
        require(ERC20Address != address(0), "NanoAdmin: token can not have a zero address!");
        // Get the ID of admin token for the provided ERC20 token address
        // No need to check if id is 0 here
        uint256 id = _controlledToAdmin(ERC20Address);
        // Get the actual holder of the token with that ID and compare it to the provided user address
        require(_IdToHolder[id] == user, "NanoAdmin: caller does not have an admin token!");
    }

    /// @notice Returns the address of the controlled ERC20 token 
    /// @param tokenId The ID of ERC721 token to check
    /// @return The address of the controlled ERC20 token
    function getControlledAddressById(uint256 tokenId) public view returns (address) {
        _requireMinted(tokenId);
        require(_adminToControlled[tokenId] != address(0), "NanoAdmin: no controlled token exists for this admin token!");
        
        return _adminToControlled[tokenId];
    }


    /// @notice Creates a relatioship between controlled ERC20 token address and an admin ERC721 token ID
    /// @param tokenId The ID of minted ERC721 token
    /// @param ERC20Address The address of the controlled ERC20 token
    function setControlledAddress(uint256 tokenId, address ERC20Address) internal onlyFactory {
        _requireMinted(tokenId);
        require(ERC20Address != address(0), "NanoAdmin: controlled token can not have a zero address!");
        _adminToControlled[tokenId] = ERC20Address;
        _controlledToAdmin[ERC20Address] = tokenId;

    }


    /// @notice Mints a new ERC721 token with the address of the controlled ERC20 token
    /// @param to The address of the receiver of the token
    /// @param ERC20Address The address of the controlled ERC20 token
    function mintWithERC20Address(address to, address ERC20Address) public onlyFactory {
        require(to != address(0), "NanoAdmin: admin token mint to zero address is not allowed!");
        require(ERC20Address != address(0), "NanoAdmin: controlled token can not have a zero address!");
        require(!_usedControlled[ERC20Address], "NanoAdmin: only a single admin token is allowed for a single controlled token!");
        _tokenIds.increment();
        // NOTE The lowest token ID is 1
        uint256 tokenId = _tokenIds.current();
        // Mint the token
        _safeMint(to, tokenId);
        // Connect admin token ID to controlled ERC20 address
        setControlledAddress(tokenId, ERC20Address);
        // Mark that controlled token has been used once
        _usedControlled[ERC20Address] = true;
        // Mark that token with the current ID belongs to the user
        _holderToId[to] = tokenId;
        _IdToHolder[tokenId] = to;

        emit AdminTokenCreated(tokenId, ERC20Address);
    }


    /// @notice Burns the token with the provided ID
    /// @param tokenId The ID of the token to burn
    function burn(uint256 tokenId) public {
        _requireMinted(tokenId);
        require(ownerOf(tokenId) == msg.sender, "NanoAdmin: only owner of the token is allowed to burn it!");
        super._burn(tokenId);
        // Clean 4 mappings at once
        delete _controlledToAdmin[_adminToControlled[tokenId]];
        delete _adminToControlled[tokenId];
        delete _holderToId[_IdToHolder[tokenId]];
        delete _IdToHolder[tokenId];

        emit AdminTokenBurnt(tokenId);
    }


    
}