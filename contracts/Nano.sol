// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/INano.sol";
import "./interfaces/INanoProducedToken.sol";


/// @title Dividend-Paying Token
/// @dev A mintable ERC20 token that allows anyone to pay and distribute ether
/// to token holders as dividends and allows token holders to withdraw their dividends.
contract Nano is INano, Ownable{

  /// @dev The contract must be able to receive ether to pay dividends with it
  receive() external payable {}

  /// @notice Distributes one token as dividends for holders of another token _equally _
  /// @param origToken The address of the token that is held by receivers
  ///        Can not be a zero address!
  /// @param distToken The address of the token that is to be distributed as dividends
  ///        Zero address for native token (ether, wei)
  /// @param amount The amount of distTokens to be distributed in total
  function distributeDividendsEqual(address origToken, address distToken, uint256 amount) external onlyOwner {
    // Get all holders of the origToken
    address[] memory receivers = INanoProducedToken(origToken).holders();
    require(receivers.length > 0, "Nano: no dividends receivers were found!");
    uint256 length = receivers.length;
    for (uint256 i = 0; i < length; i++) {
      if (distToken == address(0)){
        // Native tokens (wei)
        require(amount <= address(this).balance, "Nano: not enough dividend tokens to distribute!");
        // TODO make sure it's not necessary to amount * 10 ** 18
        (bool success, ) = receivers[i].call{value: amount / length}("");
        require(success, "Nano: dividends transfer failed!");
      } else {
        // Other ERC20 tokens
        IERC20(distToken).transfer(receivers[i], amount / length);
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
  function distributeDividendsWeighted(address origToken, address distToken, uint256 weight) external onlyOwner {
    // Get all holders of the origToken
    address[] memory receivers = INanoProducedToken(origToken).holders();
    require(receivers.length > 0, "Nano: no dividends receivers were found!");
    require(origToken != address(0), "Nano: original token can not have a zero address!");
    // It is impossible to give distTokens for zero origTokens
    require(weight >= 1, "Nano: weight is too low!");
    uint256 totalWeightedAmount = 0;
    // This function reverts if weight is incorrect.
    checkWeight(origToken, weight);
    for (uint256 i = 0; i < receivers.length; i++) {
      uint256 userBalance = IERC20(origToken).balanceOf(receivers[i]);
      uint256 weightedAmount = userBalance / weight;
      // This amount does not have decimals
      totalWeightedAmount += weightedAmount;
      if (distToken == address(0)) {
        // Native tokens (wei)
        require(totalWeightedAmount * (1 ether) <= address(this).balance, "Nano: not enough dividend tokens to distribute with the provided weight!");
        (bool success, ) = receivers[i].call{value: weightedAmount * (1 ether)}("");
        require(success, "Nano: dividends transfer failed!");
      } else {
        // Other ERC20 tokens
        // If total assumed amount of tokens to be distributed as dividends is higher than current contract's balance, than it it impossible to
        // distribute dividends.
        require(totalWeightedAmount <= IERC20(distToken).balanceOf(address(this)), "Nano: not enough dividend tokens to distribute with the provided weight!");
        IERC20(distToken).transfer(receivers[i], weightedAmount);
      }
    }
    
    emit DividendsDistributed(distToken, totalWeightedAmount);
  
  }

  /// @notice Checks if provided weight is valid for current receivers
  /// @param origToken The address of the token that is held by receivers
  ///        Can not be a zero address!
  /// @param weight The amount of origTokens required to get a single distToken
  function checkWeight(address origToken, uint256 weight) public view {
    require(origToken != address(0), "Nano: original token can not have a zero address!");
    address[] memory receivers = INanoProducedToken(origToken).holders();
    // The lowest balance of origTokens among receivers
    uint256 minBalance = type(uint256).max;
    for (uint256 i = 0; i < receivers.length; i++) {
      uint256 singleBalance = IERC20(origToken).balanceOf(receivers[i]);
      if (singleBalance < minBalance) {
        minBalance = singleBalance;
      }
    }
    // If none of the receivers has at least `weight` tokens then it means that no dividends can be distributed
    require(minBalance >= weight, "Nano: none of the receivers has enough tokens for the provided weight!");
  }


  /// @notice Calculates the minimum currently allowed weight.
  ///         Weight used in distributing dividends should be equal/greater than this
  /// @param origToken The address of the token that is held by receivers
  function calcMinWeight(address origToken) public view returns(uint256) {
    require(origToken != address(0), "Nano: original token can not have a zero address!");
    address[] memory receivers = INanoProducedToken(origToken).holders();
    // The lowest balance of origTokens among receivers
    uint256 minBalance = type(uint256).max;
    for (uint256 i = 0; i < receivers.length; i++) {
      uint256 singleBalance = IERC20(origToken).balanceOf(receivers[i]);
      if (singleBalance < minBalance) {
        minBalance = singleBalance;
      }
    }
    // Minimum weight is the lowest balance
    uint256 minWeight = minBalance;
    return minWeight;
  }

}