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
    mapping(uint256 => address) private controlledERC20s;
    /// @dev Mapping of used ERC20 tokens addresses
    mapping(address => bool) private usedERC20s;


    /// @dev Checks if an ERC20 token with the given address exists
    ///      It might have been burnt by the owner
    // TODO not sure if that's the proper way to check it...
    modifier ERC20Exists(address ERC20Address) {
        require(IProducedToken(ERC20Address).decimals() > 0, "NanoAdmin: ERC20 token with the provided address does not exist!");
        _;   
    }

    /// @dev Creates an "empty" NFT
    constructor() ERC721("", "") {}

    /// @notice Mints a new ERC721 token with the address of the controlled ERC20 token
    /// @param to The address of the receiver of the token
    /// @param ERC20Address The address of the controlled ERC20 token
    function mintWithERC20Address(address to, address ERC20Address) public onlyOwner ERC20Exists(ERC20Address) {
        require(!usedERC20s[ERC20Address], "NanoAdmin: only a single ERC721 is allowed for a single ERC20!");
        tokenIds.increment();
        // First ID is 1
        uint256 tokenId = tokenIds.current();
        setERC20Address(tokenId, ERC20Address);
        _safeMint(to, tokenId);
        usedERC20s[ERC20Address] = true;

        emit AdminTokenCreated(tokenId, ERC20Address);
    }


    /// @notice Returns the address of the controlled ERC20 token 
    /// @param tokenId The ID of ERC721 token to check
    /// @return The address of the controlled ERC20 token
    function getERC20AddressById(uint256 tokenId) public view onlyOwner returns (address) {
        _requireMinted(tokenId);
        require(controlledERC20s[tokenId] != address(0), "NanoAdmin: no controlled ERC20 exists for this admin token!");
        
        return controlledERC20s[tokenId];
    }

    /// @notice Sets the address of the controlled ERS20 token for already minted ERC721 token
    /// @dev There is no reverse function like `deleteERC20Address` because there can not be any
    ///      ERC721 tokens without controlled tokens
    /// @param tokenId The ID of minted ERC721 token
    /// @param ERC20Address The address of the controlled ERC20 token
    function setERC20Address(uint256 tokenId, address ERC20Address) public onlyOwner ERC20Exists(ERC20Address) {
        // It is implied that the token has been minted with _safeMint
        require(_exists(tokenId), "ERC721URIStorage: URI set of nonexistent token");
        controlledERC20s[tokenId] = ERC20Address;
    }

    /// @notice Burns the token with the provided ID
    /// @param tokenId The ID of the token to burn
    function burn(uint256 tokenId) public onlyOwner {
        super._burn(tokenId);

        if (controlledERC20s[tokenId] != address(0)) {
            delete controlledERC20s[tokenId];
        }

        emit AdminTokenBurnt(tokenId);
    }
}