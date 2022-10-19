// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/// @title An interface of a factory of custom ERC20 tokens
interface IBentureAdmin {
    /// @notice Checks it the provided address owns any admin token
    function checkOwner(address user) external view;

    /// @notice Checks if the provided user owns an admin token controlling the provided ERC20 token
    /// @param user The address of the user that potentially controls ERC20 token
    /// @param ERC20Address The address of the potentially controlled ERC20 token
    function verifyAdminToken(address user, address ERC20Address) external view;

    /// @notice Returns the address of the controlled ERC20 token
    /// @param tokenId The ID of ERC721 token to check
    /// @return The address of the controlled ERC20 token
    function getControlledAddressById(uint256 tokenId)
        external
        view
        returns (address);

    /// @notice Mints a new ERC721 token with the address of the controlled ERC20 token
    /// @param to The address of the receiver of the token
    /// @param ERC20Address The address of the controlled ERC20 token
    function mintWithERC20Address(address to, address ERC20Address) external;

    /// @notice Burns the token with the provided ID
    /// @param tokenId The ID of the token to burn
    function burn(uint256 tokenId) external;

    /// @dev Indicates that a new ERC721 token got minted
    event AdminTokenCreated(
        uint256 indexed tokenId,
        address indexed ERC20Address
    );

    /// @dev Indicates that an ERC721 token got burnt
    event AdminTokenBurnt(uint256 indexed tokenId);

    /// @dev Indicates that an ERC721 token got transferred
    event AdminTokenTransfered(
        address indexed from,
        address indexed to,
        uint256 tokenId
    );
}
