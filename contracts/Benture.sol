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
        // Check that provided amount does not exceed contract's balance
        _checkAmount(distToken, amount);
        // Get all holders of the origToken
        address[] memory receivers = IBentureProducedToken(origToken).holders();
        uint256 length = receivers.length;
        uint256 parts = length;
        require(
            length > 0,
            "Benture: no dividends receivers were found!"
        );
        // It is impossible to distribute dividends if the amount is less then the number of receivers
        require(amount >= length, "Benture: too many receivers for the provided amount!");
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
                    require(
                        amount / parts <= address(this).balance,
                        "Benture: not enough native dividend tokens to distribute!"
                    );
                    (bool success, ) = receivers[i].call{value: amount / parts}(
                        ""
                    );
                    require(success, "Benture: dividends transfer failed!");
                } else {
                    require(
                        amount / parts <=
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
        uint256 length = receivers.length;
        require(
            length > 0,
            "Benture: no dividends receivers were found!"
        );
        uint256 totalWeightedAmount = 0;
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
                // How many tokens current receiver should get
                // Float division will be rounded down to the lower number e.g. 4001 / 2 = 2000
                // and that follows the logic: to get 2001 distTokens one should have 4002 origTokens
                // and he does not. 1 token above 4000 does not change the weightedAmount
                uint256 weightedAmount = userBalance / weight;
                // If user's balance is lower than weight then `weightAmount` is 0
                // If any of the users does not have at least `weight` origTokens then it is impossible
                // to distribute dividends to him
                require(weightedAmount > 0, "Benture: some of the receivers does not have enough tokens for the provided weight!");
                // Increase the total amount of distributed tokens
                totalWeightedAmount += weightedAmount;
                if (distToken == address(0)) {
                    // Native tokens (wei)
                    require(
                        // Check that the amount we are trying to transfer does not exceed contract's balance
                        // The same as `weightedAmount * (1 ether)`
                        userBalance * (1 ether) / weight <=
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
                        weightedAmount <=
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

    /// @dev Checks that the Benture contract has enough tokens to distribute 
    ///      all dividends
    /// @param distToken The address of the token to check
    /// @param amount The amount of tokens planned to distribute
    function _checkAmount(address distToken, uint256 amount) private view {
        if (distToken == address(0)) {
            require (amount <= address(this).balance,
                "Benture: not enough native dividend tokens to distribute!"
            );
        } else {
            require (amount <=
                IBentureProducedToken(distToken).balanceOf(
                    address(this)
                ),
            "Benture: not enough ERC20 dividend tokens to distribute!"
            );
        }
    }
}
