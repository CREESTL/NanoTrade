// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IBentureProducedToken.sol";
import "./interfaces/IBentureAdmin.sol";

/// @title A custom ERC721 contract that allows to mint controlled ERC20 tokens
contract BentureAdmin is IBentureAdmin, ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter internal _tokenIds;
    using Strings for uint256;

    /// @dev Mapping from ERC721 token IDs to controlled ERC20 token addresses
    mapping(uint256 => address) private _adminToControlled;
    /// @dev Reverse mapping for `_adminToControlled`
    mapping(address => uint256) private _controlledToAdmin;
    /// @dev Mapping from admin address to IDs of admin tokens he owns
    /// @dev One admin can control several projects
    mapping(address => uint256[]) private _holderToIds;
    /// @dev Reverse mapping for `_holderToIds`
    mapping(uint256 => address) private _idToHolder;
    /// @dev Mapping of used ERC20 tokens addresses
    mapping(address => bool) private _usedControlled;
    /// @dev The address of the factory minting admin tokens
    address private _factoryAddress;

    /// @dev Checks if caller is a factory address
    modifier onlyFactory() {
        require(
            msg.sender == _factoryAddress,
            "BentureAdmin: caller is not a factory!"
        );
        _;
    }

    /// @dev Creates an "empty" NFT
    /// @param factoryAddress_ The address of the factory minting admin tokens
    constructor(address factoryAddress_)
        ERC721("Benture Manager Token", "BMNG")
    {
        require(
            factoryAddress_ != address(0),
            "BentureAdmin: factory address can not be zero address!"
        );
        _factoryAddress = factoryAddress_;
    }

    /// @notice Checks it the provided address owns any admin token
    function checkOwner(address user) external view {
        require(
            user != address(0),
            "BentureAdmin: zero address is an invalid user!"
        );
        require(
            _holderToIds[user].length != 0,
            "BentureAdmin: user does not have an admin token!"
        );
    }

    /// @notice Checks if the provided user owns an admin token controlling the provided ERC20 token
    /// @param user The address of the user that potentially controls ERC20 token
    /// @param ERC20Address The address of the potentially controlled ERC20 token
    function verifyAdminToken(address user, address ERC20Address)
        external
        view
    {
        require(
            user != address(0),
            "BentureAdmin: user can not have a zero address!"
        );
        require(
            ERC20Address != address(0),
            "BentureAdmin: token can not have a zero address!"
        );
        // Get the ID of the admin token for the provided ERC20 token address
        // No need to check if ID is 0 here
        uint256 id = _controlledToAdmin[ERC20Address];
        // Get the actual holder of the token with that ID and compare it to the provided user address
        require(
            _idToHolder[id] == user,
            "BentureAdmin: user does not have an admin token!"
        );
    }

    /// @notice Returns the address of the controlled ERC20 token
    /// @param tokenId The ID of ERC721 token to check
    /// @return The address of the controlled ERC20 token
    function getControlledAddressById(uint256 tokenId)
        external
        view
        returns (address)
    {
        require(
            _adminToControlled[tokenId] != address(0),
            "BentureAdmin: no controlled token exists for this admin token!"
        );
        _requireMinted(tokenId);

        return _adminToControlled[tokenId];
    }

    /// @notice Returns the list of all admin tokens of the user
    /// @param admin The address of the admin
    function getAdminTokenIds(address admin) external view returns(uint256[] memory) {
        require(admin != address(0), "BentureAdmin: admin address can not be a zero address!");
        return _holderToIds[admin];
    }

    /// @notice Creates a relatioship between controlled ERC20 token address and an admin ERC721 token ID
    /// @param tokenId The ID of the admin ERC721 token
    /// @param ERC20Address The address of the controlled ERC20 token
    function setControlledAddress(uint256 tokenId, address ERC20Address)
        internal
        onlyFactory
    {
        require(
            ERC20Address != address(0),
            "BentureAdmin: controlled token can not have a zero address!"
        );
        _requireMinted(tokenId);
        _adminToControlled[tokenId] = ERC20Address;
        _controlledToAdmin[ERC20Address] = tokenId;
    }

    /// @notice Deletes one admin token from the list of all project tokens owned by the admin
    /// @param admin The address of the admin of several projects
    /// @param tokenId The ID of the admin token to delete
    function deleteOneId(address admin, uint256 tokenId) internal {
        // Get all current admin token IDs
        uint256[] memory allIds = _holderToIds[admin];
        // This array will replace the current one
        uint256[] memory replacingIds = new uint256[](allIds.length - 1);
        uint256 index = 0;
        for (uint256 i = 0; i < allIds.length; i++) {
            // Copy all IDs except for the one that has to be deleted
            if (allIds[i] != tokenId) {
                replacingIds[index] = allIds[i];
                // Only increment index when actually adding a new value into the replacing array
                index++;
            }
        }
        // Replace an old array with a new one
        _holderToIds[admin] = replacingIds;
    }

    /// @notice Mints a new ERC721 token with the address of the controlled ERC20 token
    /// @param to The address of the receiver of the token
    /// @param ERC20Address The address of the controlled ERC20 token
    function mintWithERC20Address(address to, address ERC20Address)
        external
        onlyFactory
    {
        require(
            to != address(0),
            "BentureAdmin: admin token mint to zero address is not allowed!"
        );
        require(
            ERC20Address != address(0),
            "BentureAdmin: controlled token can not have a zero address!"
        );
        require(
            !_usedControlled[ERC20Address],
            "BentureAdmin: only a single admin token is allowed for a single controlled token!"
        );
        _tokenIds.increment();
        // NOTE The lowest token ID is 1
        uint256 tokenId = _tokenIds.current();
        // Mark that controlled token has been used once
        _usedControlled[ERC20Address] = true;
        // Mark that token with the current ID belongs to the user
        _holderToIds[to].push(tokenId);
        _idToHolder[tokenId] = to;

        emit AdminTokenCreated(tokenId, ERC20Address);

        // Mint the token
        super._safeMint(to, tokenId);
        // Connect admin token ID to controlled ERC20 address
        setControlledAddress(tokenId, ERC20Address);
    }

    /// @notice Burns the token with the provided ID
    /// @param tokenId The ID of the token to burn
    function burn(uint256 tokenId) external {
        require(
            ownerOf(tokenId) == msg.sender,
            "BentureAdmin: only owner of the token is allowed to burn it!"
        );
        _requireMinted(tokenId);
        // NOTE: `delete` does not change the length of any array. It replaces a "deleted" item
        //        with a default value
        // Clean 4 mappings at once
        delete _controlledToAdmin[_adminToControlled[tokenId]];
        delete _adminToControlled[tokenId];
        // This deletes `tokenId` from the list of all IDs owned by the admin
        deleteOneId(_idToHolder[tokenId], tokenId);
        delete _idToHolder[tokenId];

        super._burn(tokenId);

        emit AdminTokenBurnt(tokenId);
    }

    /// @notice Transfers admin token with the provided ID from one address to another address
    /// @param from The address to transfer from
    /// @param to The address to transfer to
    /// @param tokenId The ID of the token to be transferred
    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override {
        require(
            from != address(0),
            "BentureAdmin: sender can not be a zero address!"
        );
        require(
            to != address(0),
            "BentureAdmin: receiver can not be a zero address!"
        );
        _requireMinted(tokenId);
        // No need to check if sender has any admin tokens here because it is checked
        // in higher-level ERC721 functions such as `transferFrom` and `_safeTransfer`
        // The token moves to the other address
        _idToHolder[tokenId] = to;
        _holderToIds[to].push(tokenId);
        // Current holder loses one token
        deleteOneId(from, tokenId);

        super._transfer(from, to, tokenId);

        emit AdminTokenTransfered(from, to, tokenId);
    }
}
