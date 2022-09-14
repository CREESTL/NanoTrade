// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./interfaces/INano.sol";
import "./interfaces/INanoOptional.sol";

// TODO Use OZ SafeMath instead?
import "./math/SafeMathUint.sol";
import "./math/SafeMathInt.sol";



/// @title Dividend-Paying Token
/// @dev A mintable ERC20 token that allows anyone to pay and distribute ether
/// to token holders as dividends and allows token holders to withdraw their dividends.
contract Nano is ERC20, INano, INanoOptional {
  using SafeMath for uint256;
  using SafeMathUint for uint256;
  using SafeMathInt for int256;

  /**
   * With `magnitude`, we can properly distribute dividends even if the amount of received ether is small.
   * For more discussion about choosing the value of `magnitude`,
   * see https://github.com/ethereum/EIPs/issues/1726#issuecomment-472352728
   */
  uint256 constant internal magnitude = 2**128;


  /// @dev Dividend amount per single Nano token
  uint256 internal magnifiedDividendPerShare;

  /**
  * About dividendCorrection:
  * If the token balance of a user is never changed, the dividend of user can be computed with:
  * `dividendOf(user) = dividendPerShare * balanceOf(user)`.
  * When `balanceOf(user)` is changed (via minting/burning/transferring tokens),
  * `dividendOf(user)` should not be changed,
  * but the computed value of `dividendPerShare * balanceOf(user)` gets changed.
  * To keep the `dividendOf(user)` unchanged, we add a correction term:
  * `dividendOf(user) = dividendPerShare * balanceOf(user) + dividendCorrectionOf(user)`,
  * where `dividendCorrectionOf(user)` is updated whenever `balanceOf(user)` is changed:
  * `dividendCorrectionOf(user) = dividendPerShare * (old balanceOf(user)) - (new balanceOf(user))`.
  * So now `dividendOf(user)` returns the same value before and after `balanceOf(user)` is changed.
  */
  mapping(address => int256) internal magnifiedDividendCorrections;
  mapping(address => uint256) internal withdrawnDividends;

  /// @dev Distributes dividends whenever ether is paid to this contract.
  /// @dev It does not actually transfer tokens. Just changes dividend amount per single token for all token holders.
  receive() external payable{
    distributeDividends();
  }

  constructor() ERC20("Nano", "NANO") {}

  /// @notice Distributes ether to token holders as dividends.
  /// @dev It reverts if the total supply of tokens is 0.
  /// @dev It emits the `DividendsDistributed` event if the amount of received ether is greater than 0.

  /**
   * About undistributed ether:
   * In each distribution, there is a small amount of ether not distributed,
   * the magnified amount of which is
   * `(msg.value * magnitude) % totalSupply()`.
   * With a well-chosen `magnitude`, the amount of undistributed ether
   * (de-magnified) in a distribution can be less than 1 wei.
   * We can actually keep track of the undistributed ether in a distribution
   * and try to distribute it in the next distribution,
   * but keeping track of such data on-chain costs much more than
   * the saved ether, so we don't do that.
   */
  function distributeDividends() public payable {
    require(totalSupply() > 0, "Nano: no Nano tokens have been minted yet!");
    require(msg.value > 0, "Nano: no funds provided to disctribute!");
    magnifiedDividendPerShare = magnifiedDividendPerShare.add(
      (msg.value).mul(magnitude) / totalSupply()
    );
    emit DividendsDistributed(msg.sender, msg.value);
  }

  /// @notice Withdraws the ether distributed to the sender.
  /// @dev It emits a `DividendWithdrawn` event if the amount of withdrawn ether is greater than 0.
  function withdrawDividend() public {
    uint256 _withdrawableDividend = withdrawableDividendOf(msg.sender);
    require(_withdrawableDividend > 0, "Nano: no withdrawable dividends for this user!");
    withdrawnDividends[msg.sender] = withdrawnDividends[msg.sender].add(_withdrawableDividend);
    emit DividendWithdrawn(msg.sender, _withdrawableDividend);
    payable(msg.sender).transfer(_withdrawableDividend);
  }

  /// @notice View the amount of dividend in wei that an address can withdraw.
  /// @param owner The address of a token holder.
  /// @return The amount of dividend in wei that `owner` can withdraw.
  function withdrawableDividendOf(address owner) public view returns(uint256) {
    return accumulativeDividendOf(owner).sub(withdrawnDividendOf(owner);
  }

  /// @notice View the total earned dividend: available and withdrawn
  /// @dev accumulativeDividendOf(owner) = withdrawableDividendOf(owner) + withdrawnDividendOf(owner)
  /// = (magnifiedDividendPerShare * balanceOf(owner) + magnifiedDividendCorrections[owner]) / magnitude
  /// @param owner The address of a token holder.
  /// @return The amount of dividend in wei that `owner` has earned in total.
  function accumulativeDividendOf(address owner) public view returns(uint256) {
    return magnifiedDividendPerShare.mul(balanceOf(owner)).toInt256Safe()
      .add(magnifiedDividendCorrections[owner]).toUint256Safe() / magnitude;
  }

  /// @notice View the amount of dividend in wei that an address has withdrawn.
  /// @param owner The address of a token holder.
  /// @return The amount of dividend in wei that `owner` has withdrawn.
  function withdrawnDividendOf(address owner) public view returns(uint256) {
    return withdrawnDividends[owner];
  }

  /// @dev Internal function that transfers tokens from one address to another.
  /// @dev Update magnifiedDividendCorrections to keep dividends unchanged.
  /// @param from The address to transfer from.
  /// @param to The address to transfer to.
  /// @param value The amount to be transferred.
  function _transfer(address from, address to, uint256 value) internal override{
    super._transfer(from, to, value);

    int256 _magCorrection = magnifiedDividendPerShare.mul(value).toInt256Safe();
    magnifiedDividendCorrections[from] = magnifiedDividendCorrections[from].add(_magCorrection);
    magnifiedDividendCorrections[to] = magnifiedDividendCorrections[to].sub(_magCorrection);
  }

  /// @dev Internal function that mints tokens to an account.
  /// Update magnifiedDividendCorrections to keep dividends unchanged.
  /// @param account The account that will receive the created tokens.
  /// @param value The amount that will be created.
  function _mint(address account, uint256 value) internal override{
    super._mint(account, value);

    magnifiedDividendCorrections[account] = magnifiedDividendCorrections[account]
      .sub( (magnifiedDividendPerShare.mul(value)).toInt256Safe() );
  }

  /// @dev Internal function that burns an amount of the token of a given account.
  /// Update magnifiedDividendCorrections to keep dividends unchanged.
  /// @param account The account whose tokens will be burnt.
  /// @param value The amount that will be burnt.
  function _burn(address account, uint256 value) internal override{
    super._burn(account, value);

    magnifiedDividendCorrections[account] = magnifiedDividendCorrections[account]
      .add( (magnifiedDividendPerShare.mul(value)).toInt256Safe() );
  }
}