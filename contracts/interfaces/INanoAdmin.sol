// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


/// @title An interface of a factory of custom ERC20 tokens
interface INanoAdmin {

    /// @notice Mints a new ERC721 token with the address of the controlled ERC20 token
    /// @param to The address of the receiver of the token
    /// @param ERC20Address The address of the controlled ERC20 token
    function mintWithERC20Address(address to, address ERC20Address) external;

    /// @notice Checks it the provided address owns an admin token
    /// @param user The user address to check
    /// @return The ID of the owned token
    function checkOwner(address user) external view returns(uint256);

    /// @notice Returns the address of the controlled ERC20 token 
    /// @param tokenId The ID of ERC721 token to check
    /// @return The address of the controlled ERC20 token
    function getControlledAddressById(uint256 tokenId) external view returns (address);

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
