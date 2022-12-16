// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interfaces/IBenture.sol";
import "./interfaces/IBentureProducedToken.sol";

/// @title Dividends distributing contract
contract Benture is IBenture, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    /// @dev The contract must be able to receive ether to pay dividends with it
    receive() external payable {}

    /// @dev Stores information about a specific dividends distribution
    struct Distribution {
        uint256 id;
        address origToken;
        address distToken;
        uint256 amount;
        uint256 dueDate;
        bool isEqual;
        DistStatus status;
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
    /// @param amount The amount of tokens that will be paid
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
    ) external {
        require(
            origToken != address(0),
            "Benture: original token can not have a zero address!"
        );
        // Check if the contract with the provided address has `holders()` function
        // NOTE: If `origToken` is not a contract address(e.g. EOA) this call will revert without a reason
        (bool yes, ) = origToken.call(abi.encodeWithSignature("holders()"));
        require(
            yes,
            "Benture: provided original token does not support required functions!"
        );
        // Check that amount is not zero
        require(amount > 0, "Benture: dividends amount can not be zero!");
        // Check that caller is an admin of `origToken`
        IBentureProducedToken(origToken).checkAdmin(msg.sender);
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
            // Set a `pending` status for each new distribution
            status: DistStatus.pending
        });
        // Add this distribution to the list of all distributions of all admins
        distributions.push(distribution);
        // Get the index of the added distribution
        uint256 lastIndex = distributions.length - 1;
        // Mark that a new distribution has this index in the global array
        idsToIndexes[distributionId] = lastIndex;

        emit DividendsAnnounced(origToken, distToken, amount, dueDate, isEqual);
    }

    /// @notice Cancels previously announced distribution
    /// @param id The ID of the distribution to cancel
    function cancelDividends(uint256 id) external {
        // Check that distribution with the provided ID was announced previously
        require(
            distributionsToAdmins[id] != address(0),
            "Benture: distribution with the given ID has not been annouced yet!"
        );
        // Get the distribution with the provided id
        Distribution storage distribution = distributions[idsToIndexes[id]];
        // Check that caller is an admin of the origToken project
        IBentureProducedToken(distribution.origToken).checkAdmin(msg.sender);
        // All we need is to change distribution's status to `cancelled`
        distribution.status = DistStatus.cancelled;

        emit DividendsCancelled(id);
    }

    /// @notice Returns the list of IDs of all distributions the admin has ever announced
    /// @param admin The address of the admin
    /// @return The list of IDs of all distributions the admin has ever announced
    function getDistributions(address admin)
        public
        view
        returns (uint256[] memory)
    {
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
    function getDistribution(uint256 id)
        public
        view
        returns (
            uint256,
            address,
            address,
            uint256,
            uint256,
            bool,
            DistStatus
        )
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
    function checkAnnounced(uint256 id, address admin)
        public
        view
        returns (bool)
    {
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

    /// @notice Distributes one token as dividends for holders of another token _equally _
    /// @param id The ID of the distribution that is being fulfilled
    /// @param origToken The address of the token that is held by receivers;
    ///        Can not be a zero address!
    ///        MUST be an address of a contract - not an address of EOA!
    /// @param distToken The address of the token that is to be distributed as dividends
    ///        Zero address for native token (ether, wei)
    /// @param amount The amount of distTokens to be distributed in total
    ///        NOTE: This amount takes `decimals` into account. For example 4 USDT = 4 000 000 units
    function distributeDividendsEqual(
        uint256 id,
        address origToken,
        address distToken,
        uint256 amount
    ) external payable nonReentrant {
        require(
            origToken != address(0),
            "Benture: original token can not have a zero address!"
        );
        // Check if the contract with the provided address has `holders()` function
        // NOTE: If `origToken` is not a contract address(e.g. EOA) this call will revert without a reason
        (bool yes, ) = origToken.call(abi.encodeWithSignature("holders()"));
        require(
            yes,
            "Benture: provided original token does not support required functions!"
        );
        // Check that caller is an admin of `origToken`
        IBentureProducedToken(origToken).checkAdmin(msg.sender);
        // Check that distribution can be fulfilled
        canFulfill(id, origToken, distToken, amount, true);
        if (distToken == address(0)) {
            // Check that enough native tokens were sent with the transaction
            require(
                msg.value >= amount,
                "Benture: not enough native dividend tokens were provided!"
            );
        } else {
            // Transfer the `amount` of tokens to the contract
            // NOTE This transfer should be approved by the owner of tokens before calling this function
            bool transferred = IERC20(distToken).transferFrom(
                msg.sender,
                address(this),
                amount
            );
            // In this case there can't be *not* enough tokens
            require(
                transferred,
                "Benture: transfer of dividend tokens to the contract has failed!"
            );
        }
        // The initial balance before distribution
        uint256 startBalance;
        if (distToken != address(0)) {
            startBalance = IERC20(distToken).balanceOf(address(this));
        } else {
            startBalance = address(this).balance;
        }
        // Get all holders of the origToken
        address[] memory receivers = IBentureProducedToken(origToken).holders();
        uint256 length = receivers.length;
        uint256 parts = length;
        require(length > 0, "Benture: no dividends receivers were found!");
        // It is impossible to distribute dividends if the amount is less then the number of receivers
        // (mostly used for ERC20 tokens)
        require(
            amount >= length,
            "Benture: too many receivers for the provided amount!"
        );
        // If one of the receivers is the `Benture` contract itself - do not distribute dividends to it
        // Reduce the number of receivers as well to calculate dividends correctly
        if (IBentureProducedToken(origToken).isHolder(address(this))) {
            parts -= 1;
        }
        // Distribute dividends to each of the holders
        for (uint256 i = 0; i < length; i++) {
            // No dividends should be distributed to a zero address
            require(
                receivers[i] != address(0),
                "Benture: no dividends for a zero address allowed!"
            );
            // If `Benture` contract is a receiver, just ignore it and move to the next one
            if (receivers[i] != address(this)) {
                if (distToken == address(0)) {
                    // Native tokens (wei)
                    (bool transferred, ) = receivers[i].call{
                        value: amount / parts
                    }("");
                    require(transferred, "Benture: dividends transfer failed!");
                } else {
                    // ERC20 tokens
                    bool transferred = IBentureProducedToken(distToken)
                        .transfer(receivers[i], amount / parts);
                    require(
                        transferred,
                        "Benture: dividends distribution failed!"
                    );
                }
            }
        }

        // The balance after the distribution
        uint256 endBalance;
        if (distToken != address(0)) {
            endBalance = IERC20(distToken).balanceOf(address(this));
        } else {
            endBalance = address(this).balance;
        }
        // All distTokens that were for some reason not distributed are returned
        // to the admin
        uint256 reallyDistributed = startBalance - endBalance;
        if (reallyDistributed != amount) {
            if (distToken != address(0)) {
                IERC20(distToken).transfer(
                    msg.sender,
                    amount - reallyDistributed
                );
            } else {
                msg.sender.call{value: amount - reallyDistributed};
            }
        }

        // Change distribution status to `fulfilled`
        Distribution storage distribution = distributions[idsToIndexes[id]];
        distribution.status = DistStatus.fulfilled;

        emit DividendsFulfilled(id);
        emit DividendsDistributed(distToken, reallyDistributed);
    }

    /// @notice Distributes one token as dividends for holders of another token _according to each user's balance_
    /// @param id The ID of the distribution that is being fulfilled
    /// @param origToken The address of the token that is held by receivers
    ///        Can not be a zero address!
    /// @param distToken The address of the token that is to be distributed as dividends
    ///        Zero address for native token (ether, wei)
    /// @param amount The amount of distTokens to be distributed in total
    ///        NOTE: This amount takes `decimals` into account. For example 4 USDT = 4 000 000 units
    function distributeDividendsWeighted(
        uint256 id,
        address origToken,
        address distToken,
        uint256 amount
    ) external payable nonReentrant {
        // It is impossible to give distTokens for zero origTokens
        require(
            origToken != address(0),
            "Benture: original token can not have a zero address!"
        );
        // Check if the contract with the provided address has `holders()` function
        // NOTE: If `origToken` is not a contract address(e.g. EOA) this call will revert without a reason
        (bool yes, ) = origToken.call(abi.encodeWithSignature("holders()"));
        require(
            yes,
            "Benture: provided original token does not support required functions!"
        );
        // Check that caller is an admin of `origToken`
        IBentureProducedToken(origToken).checkAdmin(msg.sender);
        // Check that distribution can be fulfilled
        canFulfill(id, origToken, distToken, amount, false);
        if (distToken == address(0)) {
            // Check that enough native tokens were sent with the transaction
            require(
                msg.value >= amount,
                "Benture: not enough native dividend tokens were provided!"
            );
        } else {
            // Transfer the `amount` of tokens to the contract
            // NOTE This transfer should be approved by the owner of tokens before calling this function
            bool transferred = IERC20(distToken).transferFrom(
                msg.sender,
                address(this),
                amount
            );
            // In this case there can't be *not* enough tokens
            require(
                transferred,
                "Benture: transfer of dividend tokens to the contract has failed!"
            );
        }
        // The initial balance before distribution
        uint256 startBalance;
        if (distToken != address(0)) {
            startBalance = IERC20(distToken).balanceOf(address(this));
        } else {
            startBalance = address(this).balance;
        }
        // Get all holders of the origToken
        address[] memory receivers = IBentureProducedToken(origToken).holders();
        uint256 length = receivers.length;
        require(length > 0, "Benture: no dividends receivers were found!");

        // NOTE formula [A] of amount of distTokens each user receives:
        // `tokensToReceive = userBalance * amount / totalBalance`
        // Where `amount / totalBalance = weight` but it's *not* calculated in a separate operation
        // in order to avoid zero result, e.g:
        // 1) `weight = 5 / 100 = 0`
        // 2) `tokensToReceive = 240 * 0 = 0`
        // But `tokensToReceive = 240 * 5 / 100 = 1200 / 100 = 12` <- different result

        // NOTE this inequation [B] should meet for *each* user in order for them to get minimum
        // possible dividends (1 wei+):
        // userBalance * amount * 10 ^ (distToken decimals) / totalBalance >= 1
        // Otherwise, the user will get 0 dividends

        // If `amount` is less than `length` then none of the users will receive any dividends
        // NOTE Only users with balance >= `totalBalance / amount` will receive their dividends
        require(
            amount >= length,
            "Benture: amount should be greater than the number of dividends receivers!"
        );
        // Get total holders` balance of origTokens
        uint256 totalBalance = _getTotalBalance(receivers, origToken);
        // Distribute dividends to each of the holders
        for (uint256 i = 0; i < length; i++) {
            // No dividends should be distributed to a zero address
            require(
                receivers[i] != address(0),
                "Benture: no dividends for a zero address allowed!"
            );
            // If `Benture` contract is a receiver, just ignore it and move to the next one
            if (receivers[i] != address(this)) {
                uint256 userBalance = IBentureProducedToken(origToken)
                    .balanceOf(receivers[i]);
                // Native tokens
                if (distToken == address(0)) {
                    (bool success, ) = receivers[i]
                        .call{// Some of the holders might receive no dividends // Formulas [A] and [B] can be used here
                    value: (userBalance * amount) / totalBalance}("");
                    require(success, "Benture: dividends transfer failed!");
                    // Other ERC20 tokens
                } else {
                    bool res = IBentureProducedToken(distToken).transfer(
                        receivers[i],
                        // Formulas [A] and [B] can be used here
                        // Some of the holders might receive no dividends
                        (userBalance * amount) / totalBalance
                    );
                    require(res, "Benture: dividends transfer failed!");
                }
            }
        }

        // The balance after the distribution
        uint256 endBalance;
        if (distToken != address(0)) {
            endBalance = IERC20(distToken).balanceOf(address(this));
        } else {
            endBalance = address(this).balance;
        }

        // All distTokens that were for some reason not distributed are returned
        // to the admin
        uint256 reallyDistributed = startBalance - endBalance;
        if (reallyDistributed != amount) {
            if (distToken != address(0)) {
                IERC20(distToken).transfer(
                    msg.sender,
                    amount - reallyDistributed
                );
            } else {
                msg.sender.call{value: amount - reallyDistributed};
            }
        }

        // Change distribution status to `fulfilled`
        Distribution storage distribution = distributions[idsToIndexes[id]];
        distribution.status = DistStatus.fulfilled;

        emit DividendsFulfilled(id);
        emit DividendsDistributed(distToken, reallyDistributed);
    }

    /// @notice Returns the total users` balance of the given token
    /// @param users The list of users to calculate the total balance of
    /// @param token The token which balance must be calculated
    /// @return The total users' balance of the given token
    function _getTotalBalance(address[] memory users, address token)
        internal
        view
        returns (uint256)
    {
        uint256 totalBalance;
        for (uint256 i = 0; i < users.length; i++) {
            // If this contract is holder - ignore its balance
            // It should not affect amount of tokens distributed to real holders
            if (users[i] != address(this)) {
                uint256 singleBalance = IERC20(token).balanceOf(users[i]);
                totalBalance += singleBalance;
            }
        }
        return totalBalance;
    }
}
