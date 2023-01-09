// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./BentureProducedToken.sol";
import "./interfaces/IBenture.sol";
import "./interfaces/IBentureProducedToken.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title Dividends distributing contract
contract Benture is IBenture, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    using SafeERC20 for IERC20;
    using SafeERC20 for IBentureProducedToken;

    /// @dev The contract must be able to receive ether to pay dividends with it
    receive() external payable {}

    /// @dev Mapping showing how much tokens a holder has locked in a each distribution
    mapping(uint256 => mapping(address => uint256)) lockedByHolders;
    /// @dev Mapping showing shares of holder in each distribution
    mapping(uint256 => mapping(address => uint256)) sharesOfHolders;

    /// @dev Stores information about a specific dividends distribution
    struct Distribution {
        uint256 id; // ID of distributiion
        address origToken; // The token owned by holders
        address distToken; // The token distributed to holders
        uint256 amount; // The amount of `distTokens` or native tokens paid to holders
        uint256 dueDate; // Time that should pass from announcement till the beginning of distribution
        bool isEqual; // True if distribution is equal, false if it's weighted
        uint256 totalLocked; // The total amount of locked tokens (ERC20 of native)
        uint256 totalLockers; // The number of holders (lockers) that locked their tokens
        DistStatus status; // Current status of distribution
    }

    /// @dev Incrementing IDs of distributions
    Counters.Counter internal distributionIds;
    /// @dev Mapping from distribution ID to the address of the admin
    ///      who announced the distribution
    mapping(uint256 => address) internal distributionsToAdmins;
    /// @dev Mapping from admin address to the list of IDs of active distributions he announced
    mapping(address => uint256[]) internal adminsToDistributions;
    /// @dev An array of all distributions
    /// @dev NOTE: Each of them can have any status of 3 available
    Distribution[] internal distributions;
    /// @dev Mapping from distribution ID to its index inside the `distributions` array
    mapping(uint256 => uint256) internal idsToIndexes;

    /// @notice Allows admin to annouce the next distribution of dividends
    /// @param origToken The tokens to the holders of which the dividends will be paid
    /// @param distToken The token that will be paid
    ///        Use zero address for native tokens
    /// @param amount The amount of ERC20 tokens that will be paid
    /// @param dueDate The number of seconds in which the dividends will be paid
    ///        *after the announcement*
    ///         Use `0` to announce an immediate distribution
    /// @param isEqual Indicates whether distribution will be equal
    /// @dev Announcement does not guarantee that dividends will be distributed. It just shows
    ///      that the admin is willing to do that
    function announceDividends(
        address origToken,
        address distToken,
        uint256 amount,
        uint256 dueDate,
        bool isEqual
    ) external payable {
        require(
            origToken != address(0),
            "Benture: original token can not have a zero address!"
        );
        // Check that caller is an admin of `origToken`
        IBentureProducedToken(origToken).checkAdmin(msg.sender);
        // Amount can not be zero
        require(amount > 0, "Benture: dividends amount can not be zero!");
        if (distToken != address(0)) {
            // NOTE: Caller should approve transfer of at least `amount` of tokens with `ERC20.approve()`
            // before calling this function
            // Transfer tokens from caller to the contract
            IERC20(distToken).safeTransferFrom(
                msg.sender,
                address(this),
                amount
            );
        } else {
            // Check that enough native tokens were provided
            require(
                msg.value >= amount,
                "Benture: not enough native tokens were provided!"
            );
        }
        distributionIds.increment();
        // NOTE The lowest distribution ID is 1
        uint256 distributionId = distributionIds.current();
        // Mark that this admin announced a distribution with the new ID
        distributionsToAdmins[distributionId] = msg.sender;
        // Add this distribution's ID to the list of all distributions he announced
        adminsToDistributions[msg.sender].push(distributionId);
        // Create a new distribution
        Distribution memory distribution = Distribution({
            id: distributionId,
            origToken: origToken,
            distToken: distToken,
            amount: amount,
            dueDate: dueDate,
            isEqual: isEqual,
            totalLocked: 0,
            totalLockers: 0,
            // Set a `pending` status for each new distribution
            status: DistStatus.pending
        });
        // Add this distribution to the list of all distributions of all admins
        distributions.push(distribution);
        // Get the index of the added distributionBenture.sol
        uint256 lastIndex = distributions.length - 1;
        // Mark that a new distribution has this index in the global array
        idsToIndexes[distributionId] = lastIndex;

        emit DividendsAnnounced(origToken, distToken, amount, dueDate, isEqual);
    }


    /// @notice Returns the list of IDs of all distributions the admin has ever announced
    /// @param admin The address of the admin
    /// @return The list of IDs of all distributions the admin has ever announced
    function getDistributions(
        address admin
    ) public view returns (uint256[] memory) {
        // Do not check wheter the given address is actually an admin
        require(
            admin != address(0),
            "Benture: admin can not have a zero address!"
        );
        return adminsToDistributions[admin];
    }

    /// @notice Returns the distribution with the given ID
    /// @param id The ID of the distribution to search for
    /// @return All information about the distribution
    function getDistribution(
        uint256 id
    )
        public
        view
        returns (uint256, address, address, uint256, uint256, bool, DistStatus)
    {
        require(id >= 1, "Benture: ID of distribution must be greater than 1!");
        require(
            distributionsToAdmins[id] != address(0),
            "Benture: distribution with the given ID has not been annouced yet!"
        );
        Distribution storage distribution = distributions[idsToIndexes[id]];
        return (
            distribution.id,
            distribution.origToken,
            distribution.distToken,
            distribution.amount,
            distribution.dueDate,
            distribution.isEqual,
            distribution.status
        );
    }

    /// @notice Checks if the distribution with the given ID was announced by the given admin
    /// @param id The ID of the distribution to check
    /// @param admin The address of the admin to check
    /// @return True if admin has announced the distribution with the given ID. Otherwise - false.
    function checkAnnounced(
        uint256 id,
        address admin
    ) public view returns (bool) {
        require(id >= 1, "Benture: ID of distribution must be greater than 1!");
        require(
            distributionsToAdmins[id] != address(0),
            "Benture: distribution with the given ID has not been annouced yet!"
        );
        require(
            admin != address(0),
            "Benture: admin can not have a zero address!"
        );
        if (distributionsToAdmins[id] == admin) {
            return true;
        }
        return false;
    }

    /// @notice Checks if distribution can be fulfilled
    /// @param id The ID of the distribution that is going to be fulfilled
    /// @param origToken The address of the token that is held by receivers;
    /// @param distToken The address of the token that is to be distributed as dividends
    /// @param amount The amount of distTokens to be distributed in total
    /// @param isEqual Indicates whether the distribution is equal or weighted
    function canFulfill(
        uint256 id,
        address origToken,
        address distToken,
        uint256 amount,
        bool isEqual
    ) internal view {
        Distribution storage distribution = distributions[idsToIndexes[id]];
        require(
            distribution.status == DistStatus.pending,
            "Benture: distribution is not pending!"
        );
        require(
            block.timestamp >= distribution.dueDate,
            "Benture: too early for distribution!"
        );
        require(
            distribution.origToken == origToken,
            "Benture: origToken is different!"
        );
        require(
            distribution.distToken == distToken,
            "Benture: distToken is different!"
        );
        require(distribution.amount == amount, "Benture: amount is different!");
        require(
            distribution.isEqual == isEqual,
            "Benture: another type of distribution!"
        );
    }

    /// @dev Makes sanitary checks before token distribution
    /// @param origToken The address of the token that is held by receivers;
    ///        Can not be a zero address!
    ///        MUST be an address of a contract - not an address of EOA!
    /// @param distToken The address of the token that is to be distributed as dividends
    ///        Zero address for native token (ether, wei)
    /// @param id The ID of the distribution that is being fulfilled
    /// @param amount The amount of distTokens to be distributed in total
    /// @param isEqual Indicates whether the distribution is equal or not
    function preDistChecks(
        address origToken,
        address distToken,
        uint256 id,
        uint256 amount,
        bool isEqual
    ) internal view {
        require(
            origToken != address(0),
            "Benture: original token can not have a zero address!"
        );
        // Check that caller is an admin of `origToken`
        IBentureProducedToken(origToken).checkAdmin(msg.sender);
        // Check that distribution can be fulfilled
        canFulfill(id, origToken, distToken, amount, isEqual);
    }

    /// @dev Checks that `Benture` has enough tokens to distribute
    ///      the required amount
    /// @param distToken The address of the token that is to be distributed as dividends
    ///        Zero address for native token (ether, wei)
    /// @param amount The amount of distTokens to be distributed in total
    function preDistTransfer(address distToken, uint256 amount) internal {
        if (distToken == address(0)) {
            // Check that enough native tokens were sent with the transaction
            require(
                msg.value >= amount,
                "Benture: not enough native dividend tokens were provided!"
            );
        } else {
            // Transfer the `amount` of tokens to the contract
            // NOTE This transfer should be approved by the owner of tokens before calling this function
            IERC20(distToken).safeTransferFrom(
                msg.sender,
                address(this),
                amount
            );
        }
    }

    /// @dev Returns tokens that were not distributed back to the admin
    /// @param distToken The address of the token that is to be distributed as dividends
    ///        Zero address for native token (ether, wei)
    /// @param amount The amount of distTokens to be distributed in total
    /// @param startBalance The balance of the the `distToken` before distribution
    /// @param endBalance The balance of the the `distToken` after distribution
    function returnLeft(
        address distToken,
        uint256 amount,
        uint256 startBalance,
        uint256 endBalance
    ) internal {
        uint256 reallyDistributed = startBalance - endBalance;
        if (reallyDistributed != amount) {
            if (distToken != address(0)) {
                IERC20(distToken).safeTransfer(
                    msg.sender,
                    amount - reallyDistributed
                );
            } else {
                (bool success, ) = msg.sender.call{
                    value: amount - reallyDistributed
                }("");
                require(success, "Benture: return of tokens failed!");
            }
        }
    }

    /// @dev Returns the current `distToken` address of this contract
    /// @param distToken The address of the token to get the balance in
    /// @return The `distToken` balance of this contract
    function getCurrentBalance(
        address distToken
    ) internal view returns (uint256) {
        uint256 balance;
        if (distToken != address(0)) {
            balance = IERC20(distToken).balanceOf(address(this));
        } else {
            balance = address(this).balance;
        }

        return balance;
    }

    // TODO add it to `claimDividends` later
    /// @notice Calculates locker's share in the distribution
    /// @param id The ID of the distribution to calculates shares in
    /// @dev Shares must be calculated *after* the `dueDate`
    function calculateShare(uint256 id) internal {
        Distribution storage distribution = distributions[idsToIndexes[id]];
        // Calculate shares if equal distribution
        if (distribution.isEqual == true) {
            // NOTE: result gets rounded up to the lower integer, some "change" might be left after division
            uint256 share = distribution.amount / distribution.totalLockers;
            sharesOfHolders[id][msg.sender] = share;
            // Calculate shares in weighted distribution
        } else {
            uint256 share = (distribution.amount *
                lockedByHolders[id][msg.sender]) / distribution.totalLocked;
            sharesOfHolders[id][msg.sender] = share;
        }
    }

    /// @notice Locks user's tokens in order for him to receive dividends later
    /// @param id The ID of the distribution to lock tokens for
    /// @param amount The amount of tokens to lock
    function lockTokens(uint256 id, uint256 amount) external payable {
        require(amount > 0, "Benture: can not lock zero tokens!");
        // Check that this distribution was announced
        require(
            distributionsToAdmins[id] != address(0),
            "Benture: distribution with the given ID has not been annouced yet!"
        );
        Distribution storage distribution = distributions[idsToIndexes[id]];
        // Can only lock tokens when distribution is pending (not cancelled)
        require(
            distribution.status == DistStatus.pending,
            "Benture: distribution is not pending!"
        );
        // User should have origTokens to be able to take part in dividends distribution
        require(
            IBentureProducedToken(distribution.origToken).isHolder(msg.sender),
            "Benture: user does not have project tokens!"
        );
        // Can only lock tokens before the distribution starts
        require(
            block.timestamp <= distribution.dueDate,
            "Benture: too late for locking!"
        );
        // Locking ERC20 tokens
        if (distribution.distToken != address(0)) {
            IBentureProducedToken(distribution.origToken).safeTransferFrom(
                msg.sender,
                address(this),
                amount
            );
            // Mark that user locked this amount of tokens
            lockedByHolders[id][msg.sender] = amount;
            // Increase the total amount of locked tokens
            distribution.totalLocked += amount;
            distribution.totalLockers += 1;
        } else {
            // Locking native tokens
            // If user pays more than `amount` the excess just stays on contract's balance
            require(
                msg.value >= amount,
                "Benture: not enough native tokens was provided to lock!"
            );
            // Mark that user locked this amount of tokens
            lockedByHolders[id][msg.sender] = amount;
            // Increase the total amount of locked tokens
            distribution.totalLocked += amount;
            distribution.totalLockers += 1;
        }
    }
}
