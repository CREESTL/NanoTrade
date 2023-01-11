// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

/// @title Dividend-Paying Token Interface

/// @dev An interface for dividends distributing contract
interface IBenture {

    /// @dev Status of a distribution
    enum DistStatus {
        inProgress,
        fulfilled
    }

    /// @notice Creates a new pool
    /// @param token The token that will be locked in the pool
    function createPool(address token) external;

    /// @notice Deletes a pool
    ///         After that all operations with the pool will fail
    /// @param token The token of the pool
    function deletePool(address token) external;

    /// @notice Locks the provided amount of user's tokens in the pool
    /// @param origToken The address of the token to lock
    /// @param amount The amount of tokens to lock
    function lockTokens(address origToken, uint256 amount) external;

    /// @notice Locks all user's tokens in the pool
    /// @param origToken The address of the token to lock
    function lockAllTokens(address origToken) external;

    /// @notice Allows admin to distribute dividends among lockers
    /// @param origToken The tokens to the holders of which the dividends will be paid
    /// @param distToken The token that will be paid
    ///        Use zero address for native tokens
    /// @param amount The amount of ERC20 tokens that will be paid
    /// @param isEqual Indicates whether distribution will be equal
    function distributeDividends (
        address origToken,
        address distToken,
        uint256 amount,
        bool isEqual
    ) external payable;

    /// @notice Returns info about the pool of a given token
    /// @param token The address of the token of the pool
    /// @return The address of the tokens in the pool.
    /// @return The number of users who locked their tokens in the pool
    /// @return The amount of locked tokens
    function getPool(address token) external view returns(address, uint256, uint256);

    /// @notice Checks if user has locked tokens in the pool
    /// @param token The address of the token of the pool
    /// @return True if user has locked tokens. Otherwise - false
    function hasLockedTokens(address token) external view returns(bool);

    /// @notice Checks if user has unlocked tokens from the pool
    /// @param token The address of the token of the pool
    /// @return True if user has unlocked tokens. Otherwise - false
    function hasUnlockedTokens(address token) external view returns(bool);

    /// @notice Returns the amount of tokens locked by the caller
    /// @param token The address of the token of the pool
    /// @return The amount of tokens locked by the caller inside the pool
    function getAmountLocked(address token) external view returns(uint256);

    /// @notice Returns the list of IDs of all active distributions the admin has started
    /// @param admin The address of the admin
    /// @return The list of IDs of all active distributions the admin has started
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
        returns (uint256, address, address, uint256, bool, DistStatus);

    /// @notice Checks if the distribution with the given ID was started by the given admin
    /// @param id The ID of the distribution to check
    /// @param admin The address of the admin to check
    /// @return True if admin has started the distribution with the given ID. Otherwise - false.
    function checkStartedByAdmin(
        uint256 id,
        address admin
    ) external view returns (bool);


    /// @dev Indicates that a new pool has been created
    event PoolCreated(address indexed token);

    /// @dev Indicates that a pool has been deleted
    event PoolDeleted(address indexed token);

    /// @dev Indicated that tokens have been locked
    event TokensLocked(address indexed user, address indexed token, uint256 amount);

    /// @dev Indicates that new dividends distribution was started
    /// @param origToken The tokens to the holders of which the dividends will be paid
    /// @param distToken The token that will be paid
    /// @param amount The amount of tokens that will be paid
    /// @param isEqual Indicates whether distribution will be equal
    event DividendsStarted (
        address indexed origToken,
        address indexed distToken,
        uint256 indexed amount,
        bool isEqual
    );

    /// @dev Indicates that dividends distribution was fulfilled
    /// @param id The ID of the fulfilled distribution
    event DividendsFulfilled(uint256 indexed id);

}
