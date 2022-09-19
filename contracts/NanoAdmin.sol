// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IProducedToken.sol";
import "./interfaces/INanoAdmin.sol";


/// @title A custom ERC721 contract allowing managing over ERC20 tokens
/// @dev This contract clones ERC721URIStorage's contract but instead of URIs it stores ERC20 addresses
contract NanoAdmin is INanoAdmin, ERC721, Ownable {

    using Counters for Counters.Counter;
    Counters.Counter internal tokenIds;
    using Strings for uint256;
    
    /// @dev Mapping from ERC721 token to controlled ERC20 token addresses
    mapping(uint256 => address) private adminToControlled;
    /// @dev Mapping of admin token owners and token IDs they hold
    mapping(address => uint256) private holderToId;
    /// @dev Reverse mapping for `holderToId`
    mapping(uint256 => address) private IdToHolder;
    /// @dev Mapping of used ERC20 tokens addresses
    mapping(address => bool) private usedControlled;


    /// @dev Checks if an ERC20 token with the given address exists
    ///      It might have been burnt by the owner
    // TODO not sure if that's the proper way to check it...
    modifier ERC20Exists(address ERC20Address) {
        require(IProducedToken(ERC20Address).decimals() > 0, "NanoAdmin: controlled token with the provided address does not exist!");
        _;   
    }

    /// @dev Creates an "empty" NFT
    constructor() ERC721("", "") {}

    /// @notice Mints a new ERC721 token with the address of the controlled ERC20 token
    /// @param to The address of the receiver of the token
    /// @param ERC20Address The address of the controlled ERC20 token
    function mintWithERC20Address(address to, address ERC20Address) public onlyOwner ERC20Exists(ERC20Address) {
        require(!usedControlled[ERC20Address], "NanoAdmin: only a single admin token is allowed for a single controlled token!");
        require(to != address(0), "NanoAdmin: admin token mint to zero address is not allowed!");
        tokenIds.increment();
        // First ID is 1
        uint256 tokenId = tokenIds.current();
        // Mint the token
        _safeMint(to, tokenId);
        // Set the controlled token
        setControlledAddress(tokenId, ERC20Address);
        // Mark that controlled token has been used once
        usedControlled[ERC20Address] = true;
        // Mark that token with the current ID belongs to the user
        holderToId[to] = tokenId;
        IdToHolder[tokenId] = to;
        emit AdminTokenCreated(tokenId, ERC20Address);
    }


    /// @notice Checks it the provided address owns an admin token
    /// @param user The user address to check
    /// @return The ID of the owned token
    function checkOwner(address user) public view returns(uint256) {
        require(holderToId[user] != 0, "NanoAdmin: user does not have an admin token!");
        return holderToId[user];
    }

    
    /// @notice Returns the address of the controlled ERC20 token 
    /// @param tokenId The ID of ERC721 token to check
    /// @return The address of the controlled ERC20 token
    function getControlledAddressById(uint256 tokenId) public view returns (address) {
        _requireMinted(tokenId);
        require(adminToControlled[tokenId] != address(0), "NanoAdmin: no controlled token exists for this admin token!");
        
        return adminToControlled[tokenId];
    }


    /// @notice Sets the address of the controlled ERC20 token for ERC721 token
    /// @param tokenId The ID of minted ERC721 token
    /// @param ERC20Address The address of the controlled ERC20 token
    function setControlledAddress(uint256 tokenId, address ERC20Address) internal onlyOwner ERC20Exists(ERC20Address) {
        require(_exists(tokenId), "NanoAdmin: admin token with the given ID does not exist!");
        require(ERC20Address != address(0), "NanoAdmin: controlled token can not have a zero address!");
        adminToControlled[tokenId] = ERC20Address;

    }

    /// @notice Burns the token with the provided ID
    /// @param tokenId The ID of the token to burn
    function burn(uint256 tokenId) public onlyOwner {
        super._burn(tokenId);
        // Clean 3 mappings at once
        delete adminToControlled[tokenId];
        delete holderToId[IdToHolder[tokenId]];
        delete IdToHolder[tokenId];

        emit AdminTokenBurnt(tokenId);
    }
}