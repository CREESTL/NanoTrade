// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


/// @title An interface of a factory of custom ERC20 tokens
interface INanoAdmin {

    /// @notice Mints a new ERC721 token with the address of the controlled ERC20 token
    /// @param to The address of the receiver of the token
    /// @param ERC20Address The address of the controlled ERC20 token
    function mintWithERC20Address(address to, address ERC20Address) external;

    /// @notice Returns the address of the controlled ERC20 token 
    /// @param tokenId The ID of ERC721 token to check
    /// @return The address of the controlled ERC20 token
    function getERC20AddressById(uint256 tokenId) external view returns (address);
    
    /// @notice Sets the address of the controlled ERS20 token for already minted ERC721 token
    /// @dev There is no reverse function like `deleteERC20Address` because there can not be any
    ///      ERC721 tokens without controlled tokens
    /// @param tokenId The ID of minted ERC721 token
    /// @param ERC20Address The address of the controlled ERC20 token
    function setERC20Address(uint256 tokenId, address ERC20Address) external;

    /// @notice Burns the token with the provided ID
    /// @param tokenId The ID of the token to burn
    function burn(uint256 tokenId) external;
    
    /// @dev Event gets emmited each time a new ERC721 token gets minted
    event AdminTokenCreated(
        uint256 indexed tokenId,
        address indexed ERC20Address
    );
    
    /// @dev Event gets emmited each time an ERC721 token gets burnt
    event AdminTokenBurnt(
        uint256 indexed tokenId
    );
}
