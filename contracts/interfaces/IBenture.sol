// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

/// @title Dividend-Paying Token Interface

/// @dev An interface for dividends distributing contract
interface IBenture {
    /// @dev Status of a distribution
    enum DistStatus {
        pending,
        cancelled,
        fulfilled
    }

    /// @notice Allows admin to annouce the next distribution of dividends
    /// @param origToken The tokens to the holders of which the dividends will be paid
    /// @param distToken The token that will be paid
    ///        Use zero address for native tokens
    /// @param amount The amount of ERC20 tokens that will be paid
    /// @param dueDate The number of seconds in which the dividends will be paid
    ///        *after the announcement*
    /// @param isEqual Indicates whether distribution will be equal
    /// @dev Announcement does not guarantee that dividends will be distributed. It just shows
    ///      that the admin is willing to do that
    function announceDividends(
        address origToken,
        address distToken,
        uint256 amount,
        uint256 dueDate,
        bool isEqual
    ) external payable;

    /// @notice Cancels previously announced distribution
    /// @param id The ID of the distribution to cancel
    function cancelDividends(uint256 id) external;

    /// @notice Returns the list of IDs of all active distributions the admin has announced
    /// @param admin The address of the admin
    /// @return The list of IDs of all active distributions the admin has announced
    function getDistributions(
        address admin
    ) external view returns (uint256[] memory);

    /// @notice Returns the distribution with the given ID
    /// @param id The ID of the distribution to search for
    /// @return All information about the distribution
    function getDistribution(
        uint256 id
    )
        external
        view
        returns (uint256, address, address, uint256, uint256, bool, DistStatus);

    /// @notice Checks if the distribution with the given ID was announced by the given admin
    /// @param id The ID of the distribution to check
    /// @param admin The address of the admin to check
    /// @return True if admin has announced the distribution with the given ID. Otherwise - false.
    function checkAnnounced(
        uint256 id,
        address admin
    ) external view returns (bool);

    /// @notice Locks user's tokens in order for him to receive dividends later
    /// @param id The ID of the distribution to lock tokens for
    /// @param amount The amount of tokens to lock
    function lockTokens(uint256 id, uint256 amount) external payable;

    /// @notice Distributes one token as dividends for holders of another token _equally _
    /// @param id The ID of the distribution that is being fulfilled
    /// @param origToken The address of the token that is held by receivers
    ///        Can not be a zero address!
    ///        MUST be an address of a contract - not an address of EOA!
    /// @param distToken The address of the token that is to be distributed as dividends
    ///        Zero address for native token (ether, wei)
    /// @param amount The amount of distTokens to be distributed in total
    ///        NOTE: If dividends are to payed in ether then `amount` is the amount of wei (NOT ether!)
    function distributeDividendsEqual(
        uint256 id,
        address origToken,
        address distToken,
        uint256 amount
    ) external payable;

    /// @notice Distributes one token as dividends for holders of another token _according to each user's balance_
    /// @param id The ID of the distribution that is being fulfilled
    /// @param origToken The address of the token that is held by receivers
    ///        Can not be a zero address!
    /// @param distToken The address of the token that is to be distributed as dividends
    ///        Zero address for native token (ether, wei)
    /// @param weight The amount of origTokens required to get a single distToken
    ///        NOTE: If dividends are payed in ether then `weight` is the amount of origTokens required to get a single ether (NOT a single wei!)
    function distributeDividendsWeighted(
        uint256 id,
        address origToken,
        address distToken,
        uint256 weight
    ) external payable;

    /// @dev Indicates that dividends were distributed
    /// @param distToken The address of dividend token that gets distributed
    /// @param amount The amount of distTokens to be distributed in total
    event DividendsDistributed(
        address indexed distToken,
        uint256 indexed amount
    );

    /// @dev Indicates that new dividends distribution was announced
    /// @param origToken The tokens to the holders of which the dividends will be paid
    /// @param distToken The token that will be paid
    /// @param amount The amount of tokens that will be paid
    /// @param dueDate The number of seconds in which the dividends will be paid
    ///        *after the announcement*
    /// @param isEqual Indicates whether distribution will be equal
    event DividendsAnnounced(
        address indexed origToken,
        address indexed distToken,
        uint256 indexed amount,
        uint256 dueDate,
        bool isEqual
    );

    /// @dev Indicates that dividends distribution was fulfilled
    /// @param id The ID of the fulfilled distribution
    event DividendsFulfilled(uint256 indexed id);

    /// @dev Indicates that dividends distribution was cancelled
    /// @param id The ID of the cancelled distribution
    event DividendsCancelled(uint256 indexed id);
}
