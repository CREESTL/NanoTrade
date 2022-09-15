// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./interfaces/INano.sol";

// TODO Use OZ SafeMath instead?
import "./math/SafeMathUint.sol";
import "./math/SafeMathInt.sol";



/// @title Dividend-Paying Token
/// @dev A mintable ERC20 token that allows anyone to pay and distribute ether
/// to token holders as dividends and allows token holders to withdraw their dividends.
contract Nano is INano {

  /// @notice Distributes one token as dividends for holders of another token _equally _
  // TODO what if its too large? 
  /// @param receivers The list of addresses of all receivers of dividends
  /// @param distToken The address of the token that is to be disctributed as dividends
  ///        Zero address for native token (ether, wei)
  /// @param amount The amount of distTokens to be distributed in total
  function distributeDividendsEqual(address[] memory receivers, address distToken, uint256 amount) external {
    uint256 length = receivers.length;
    for (uint256 i = 0; i < length; i++) {
      if (distToken == address(0)){
        // Native tokens (wei)
        (bool success, ) = receivers[i].call{value: amount / length}("");
        require(success, "Nano: dividends transfer failed!");
      } else {
        // Other ERC20 tokens
        IERC20(distToken).transfer(receivers[i], amount / length);
      }

    emit DividendsDistributed(distToken, amount);

    
    }
  }

  /// @notice Distributes one token as dividends for holders of another token _according to each user's balance_
  // TODO what if its too large? 
  /// @param receivers The list of addresses of all receivers of dividends
  /// @param origToken The address of the token that is held by receivers
  /// @param distToken The address of the token that is to be disctributed as dividends
  ///        Zero address for native token (ether, wei)
  /// @param amount The amount of distTokens to be distributed in total
  // TODO which way should the weight work? 
  /// @param weight The amount of distTokens per single origToken on user's balance. Must be greater than or equal to 1!
  function distributeDividendsWeighted(address[] memory receivers, address origToken, address distToken, uint256 amount, uint256 weight) external {
    // This function reverts if weight is incorrect. Use it to check.
    calcMaxWeight(receivers, origToken, amount);
    for (uint256 i = 0; i < receivers.length; i++) {
      uint256 userBalance = receivers[i].balance;
      uint256 weightedAmount = weight * userBalance;
      if (distToken == address(0)) {
        // Native tokens (wei)
        (bool success, ) = receivers[i].call{value: weightedAmount}("");
        require(success, "Nano: dividends transfer failed!");
      } else {
        // Other ERC20 tokens
        IERC20(distToken).transfer(receivers[i], weightedAmount);
      }
    }
    
    emit DividendsDistributed(distToken, amount);
  
  }

  /// @notice Calculates the maximum currently allowed weight.
  ///         Use this before distributing the dividends
  /// @param receivers The list of addresses of all receivers of dividends
  /// @param origToken The address of the token that is held by receivers
  /// @param amount The amount of distTokens to be distributed in total
  function calcMaxWeight(address[] memory receivers, address origToken, uint256 amount) public view returns(uint256) {
    // Total amount of original tokens of all receivers
    uint256 totalBalance = 0;
    for (uint256 i = 0; i < receivers.length; i++) {
      uint256 singleBalance = IERC20(origToken).balanceOf(receivers[i]);
      totalBalance += singleBalance;
    }
    require(amount >= totalBalance, "Nano: not enough tokens even for the lowest possible weight!");
    // NOTE If amount < totalBalance than maxWeight should be < 1, but since Solidity does not support float numbers
    // the minimum maxWeight is 1.
    uint256 maxWeight = amount / totalBalance;
    return maxWeight;
  }


}