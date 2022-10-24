// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interfaces/IBenture.sol";
import "./interfaces/IBentureProducedToken.sol";

/// @title Dividend-Paying Token
contract Benture is IBenture, Ownable, ReentrancyGuard {
    /// @dev The contract must be able to receive ether to pay dividends with it
    receive() external payable {}

    /// @notice Distributes one token as dividends for holders of another token _equally _
    /// @param origToken The address of the token that is held by receivers
    ///        Can not be a zero address!
    ///        MUST be an address of a contract - not an address of EOA!
    /// @param distToken The address of the token that is to be distributed as dividends
    ///        Zero address for native token (ether, wei)
    /// @param amount The amount of distTokens to be distributed in total
    ///        NOTE: If dividends are to payed in ether then `amount` is the amount of wei (NOT ether!)
    function distributeDividendsEqual(
        address origToken,
        address distToken,
        uint256 amount
    ) external nonReentrant {
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
        // Get all holders of the origToken
        address[] memory receivers = IBentureProducedToken(origToken).holders();
        require(
            receivers.length > 0,
            "Benture: no dividends receivers were found!"
        );
        uint256 length = receivers.length;
        uint256 parts = length;
        // If one of the receivers is the `Benture` contract itself - do not distribute dividends to it
        // Reduce the number of receivers as well to calculate dividends correctly
        if (IBentureProducedToken(origToken).isHolder(address(this))) {
            parts -= 1;
        }
        // Distribute dividends to each of the holders
        for (uint256 i = 0; i < length; i++) {
            // No dividends should be distributed to a zero address
            require(receivers[i] != address(0), "Benture: no dividends for a zero address allowed!");
            // If `Benture` contract is a receiver, just ignore it and move to the next one
            if (receivers[i] != address(this)) {
                if (distToken == address(0)) {
                    // Native tokens (wei)
                    require(
                        amount <= address(this).balance,
                        "Benture: not enough native dividend tokens to distribute!"
                    );
                    (bool success, ) = receivers[i].call{value: amount / parts}(
                        ""
                    );
                    require(success, "Benture: dividends transfer failed!");
                } else {
                    // Other ERC20 tokens
                    require(
                        amount <=
                            IBentureProducedToken(distToken).balanceOf(
                                address(this)
                            ),
                        "Benture: not enough ERC20 dividend tokens to distribute!"
                    );
                    bool res = IBentureProducedToken(distToken).transfer(
                        receivers[i],
                        amount / parts
                    );
                    require(res, "Benture: dividends distribution failed!");
                }
            }
        }

        emit DividendsDistributed(distToken, amount);
    }

    /// @notice Distributes one token as dividends for holders of another token _according to each user's balance_
    /// @param origToken The address of the token that is held by receivers
    ///        Can not be a zero address!
    /// @param distToken The address of the token that is to be distributed as dividends
    ///        Zero address for native token (ether, wei)
    /// @param weight The amount of origTokens required to get a single distToken
    ///        NOTE: If dividends are payed in ether then `weight` is the amount of origTokens required to get a single ether (NOT a single wei!)
    function distributeDividendsWeighted(
        address origToken,
        address distToken,
        uint256 weight
    ) external nonReentrant {
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
        require(weight >= 1, "Benture: weight is too low!");
        // Get all holders of the origToken
        address[] memory receivers = IBentureProducedToken(origToken).holders();
        require(
            receivers.length > 0,
            "Benture: no dividends receivers were found!"
        );
        uint256 totalWeightedAmount = 0;
        // This function reverts if weight is incorrect.
        checkWeight(origToken, weight);
        uint256 length = receivers.length;
        // Distribute dividends to each of the holders
        for (uint256 i = 0; i < length; i++) {
            // No dividends should be distributed to a zero address
            require(receivers[i] != address(0), "Benture: no dividends for a zero address allowed!");
            // If `Benture` contract is a receiver, just ignore it and move to the next one
            if (receivers[i] != address(this)) {  
                uint256 userBalance = IBentureProducedToken(origToken)
                    .balanceOf(receivers[i]);
                uint256 weightedAmount = userBalance / weight;
                // This amount does not have decimals
                totalWeightedAmount += weightedAmount;
                if (distToken == address(0)) {
                    // Native tokens (wei)
                    require(
                        totalWeightedAmount * (1 ether) <=
                            address(this).balance,
                        "Benture: not enough dividend tokens to distribute with the provided weight!"
                    );
                    // Value is the same as `weightedAmount * (1 ether)`
                    (bool success, ) = receivers[i].call{
                        value: (userBalance * (1 ether)) / weight
                    }("");
                    require(success, "Benture: dividends transfer failed!");
                } else {
                    // Other ERC20 tokens
                    // If total assumed amount of tokens to be distributed as dividends is higher than current contract's balance, than it is impossible to
                    // distribute dividends.
                    require(
                        totalWeightedAmount <=
                            IBentureProducedToken(distToken).balanceOf(
                                address(this)
                            ),
                        "Benture: not enough dividend tokens to distribute with the provided weight!"
                    );
                    bool res = IBentureProducedToken(distToken).transfer(
                        receivers[i],
                        weightedAmount
                    );
                    require(res, "Benture: dividends distribution failed!");
                }
            }
        }

        emit DividendsDistributed(distToken, totalWeightedAmount);
    }

    /// @notice Checks if provided weight is valid for current receivers
    /// @param origToken The address of the token that is held by receivers
    ///        Can not be a zero address!
    /// @param weight The amount of origTokens required to get a single distToken
    function checkWeight(address origToken, uint256 weight) public view {
        require(
            origToken != address(0),
            "Benture: original token can not have a zero address!"
        );
        address[] memory receivers = IBentureProducedToken(origToken).holders();
        uint256 length = receivers.length;
        for (uint256 i = 0; i < length; i++) {
            uint256 singleBalance = IBentureProducedToken(origToken).balanceOf(
                receivers[i]
            );
            // If any of the receivers does not have at least `weight` tokens then it means that no dividends can be distributed
            require(
                singleBalance >= weight,
                "Benture: some of the receivers does not have enough tokens for the provided weight!"
            );
        }
    }

    /// @notice Calculates the minimum currently allowed weight.
    ///         Weight used in distributing dividends should be equal/greater than this
    /// @param origToken The address of the token that is held by receivers
    function calcMinWeight(address origToken) external view returns (uint256) {
        require(
            origToken != address(0),
            "Benture: original token can not have a zero address!"
        );
        address[] memory receivers = IBentureProducedToken(origToken).holders();
        uint256 minBalance = type(uint256).max;
        // Find the lowest balance
        for (uint256 i = 0; i < receivers.length; i++) {
            uint256 singleBalance = IBentureProducedToken(origToken).balanceOf(
                receivers[i]
            );
            if (singleBalance < minBalance) {
                minBalance = singleBalance;
            }
        }
        // Minimum weight is the lowest balance
        uint256 minWeight = minBalance;
        return minWeight;
    }
}
