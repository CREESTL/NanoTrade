// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

/// @title Dividend-Paying Token Interface

/// @dev An interface for dividends distributing contract
interface IBenture {

    /// @dev Status of a distribution
    enum DistStatus {
        pending,
        // TODO delete it
        cancelled,
        fulfilled
    }


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

    // TODO change it to DividendsStarted
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

}
