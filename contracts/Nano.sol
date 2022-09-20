// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/INano.sol";


/// @title Dividend-Paying Token
/// @dev A mintable ERC20 token that allows anyone to pay and distribute ether
/// to token holders as dividends and allows token holders to withdraw their dividends.
contract Nano is INano, Ownable{

  /// @notice Distributes one token as dividends for holders of another token _equally _
  // TODO what if its too large? 
  /// @param receivers The list of addresses of all receivers of dividends
  /// @param distToken The address of the token that is to be disctributed as dividends
  ///        Zero address for native token (ether, wei)
  /// @param amount The amount of distTokens to be distributed in total
  function distributeDividendsEqual(address[] memory receivers, address distToken, uint256 amount) external onlyOwner {
    require(receivers.length > 0, "Nano: no dividends receivers provided!");
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
  ///        Can not be a zero address!
  /// @param distToken The address of the token that is to be disctributed as dividends
  ///        Zero address for native token (ether, wei)
  /// @param amount The amount of distTokens to be distributed in total
  /// @param weight The amount of origTokens required to get a single distToken
  function distributeDividendsWeighted(address[] memory receivers, address origToken, address distToken, uint256 amount, uint256 weight) external onlyOwner {
    require(receivers.length > 0, "Nano: no dividends receivers provided!");
    require(origToken != address(0), "Nano: original token can not have a zero address!");
    // It is impossible to give distTokens for zero origTokens
    require(weight >= 1, "Nano; weight is too low!");
    // This function reverts if weight is incorrect. Use it to check.
    calcMaxWeight(receivers, origToken, amount);
    for (uint256 i = 0; i < receivers.length; i++) {
      uint256 userBalance = IERC20(origToken).balanceOf(receivers[i]);
      uint256 weightedAmount = userBalance / weight;
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
    // Weight is the amount of origTokens required to get a single distToken
    // The highest balance of origTokens among receivers
    uint256 maxBalance = 0;
    for (uint256 i = 0; i < receivers.length; i++) {
      uint256 singleBalance = IERC20(origToken).balanceOf(receivers[i]);
      if (singleBalance > maxBalance) {
        maxBalance = singleBalance;
      }
    }
    require(amount < maxBalance, "Nano: none of the receivers has enough tokens for current weight!");
    // Max weight is the highes balance
    uint256 maxWeight = maxBalance;
    return maxWeight;
  }


}