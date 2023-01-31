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
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

// TODO delete it!
import "hardhat/console.sol";

/// @title Dividends distributing contract
contract Benture is IBenture, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    using SafeERC20 for IERC20;
    using SafeERC20 for IBentureProducedToken;
    using EnumerableSet for EnumerableSet.AddressSet;

    /// @dev Pool to lock tokens
    /// @dev `lockers` and `lockersArray` basically store the same list of addresses
    ///       but they are used for different purposes
    struct Pool {
        // The address of the token inside the pool
        address token;
        // The list of all lockers of the pool
        EnumerableSet.AddressSet lockers;
        // The amount of locked tokens
        uint256 totalLocked;
        // Mapping from user address to the amount of tokens currently locked by the user in the pool
        // Could be 0 if user has unlocked all his tokens
        mapping(address => uint256) lockedByUser;
        // Mapping from user address to distribution ID to locked tokens amount
        // Shows "to what amount was the user's locked changed before the distribution with the given ID"
        // If the value for ID10 is 0, that means that user's lock amount did not change before that distribution
        // If the value for ID10 is 500, that means that user's lock amount changed to 500 before that distibution.
        // Amounts locked for N-th distribution (used to calculate user's dividends) can only
        // be updated since the start of (N-1)-th distribution and till the start of the N-th
        // distribution. `distributionIds.current()` is the (N-1)-th distribution in our case.
        // So we have to increase it by one to get the ID of the upcoming distribution and
        // the amount locked for that distribution.
        // For example, if distribution ID476 has started and Bob adds 100 tokens to his 500 locked tokens
        // the pool, then his lock for the distribution ID477 should be 600.
        mapping(address => mapping(uint256 => uint256)) lockHistory;
        // Mapping from user address to a list of IDs of distributions *before which* user's lock amount was changed
        // For example an array of [1, 2] means that user's lock amount changed before 1st and 2nd distributions
        // `EnumerableSet` can't be used here because it does not *preserve* the order of IDs and we need that
        mapping(address => uint256[]) lockChangesIds;
        // Mapping indicating that before the distribution with the given ID, user's lock amount was changed
        // Basically, a `true` value for `[user][ID]` here means that this ID is *in* the `lockChangesIds[user]` array
        // So it's used to check if a given ID is in the array.
        mapping(address => mapping(uint256 => bool)) changedBeforeId;
    }

    /// @dev Stores information about a specific dividends distribution
    struct Distribution {
        // ID of distributiion
        uint256 id;
        // The token owned by holders
        address origToken;
        // The token distributed to holders
        address distToken;
        // The amount of `distTokens` or native tokens paid to holders
        uint256 amount;
        // True if distribution is equal, false if it's weighted
        bool isEqual;
        // Mapping showing that holder has withdrawn his dividends
        mapping(address => bool) hasClaimed;
        // Copies the length of `lockers` set from the pool
        uint256 formulaLockers;
        // Copies the value of Pool.totalLocked when creating a distribution
        uint256 formulaLocked;
        // The number of calls of `claimDividends` function
        uint256 numCalls;
    }

    /// @notice Address of the factory used for projects creation
    address public factory;

    /// @dev All pools
    mapping(address => Pool) pools;

    /// @dev Incrementing IDs of distributions
    Counters.Counter internal distributionIds;
    /// @dev Mapping from distribution ID to the address of the admin
    ///      who started the distribution
    mapping(uint256 => address) internal distributionsToAdmins;
    /// @dev Mapping from admin address to the list of IDs of active distributions he started
    mapping(address => uint256[]) internal adminsToDistributions;
    /// @dev Mapping from distribution ID to the distribution
    mapping(uint256 => Distribution) distributions;

    error NativeTokenDividendsTransferFailed();
    error PoolsCanNotHoldZeroAddressTokens();
    error PoolAlreadyExists();
    error CanNotWorkWithZeroAddressTokens();
    error CallerNotAdminOrFactory();
    error InvalidLockAmount();
    error CanNotLockZeroAddressTokens();
    error PoolDoesNotExist();
    error WrongTokenInsideThePool();
    error UserDoesNotHaveProjectTokens();
    error InvalidUnlockAmount();
    error CanNotUnlockZeroAddressTokens();
    error UserDoesNotHaveAnyLockedTokens();
    error WithdrawAmountIsTooBig();
    error OriginalTokenCanNotHaveAZeroAddress();
    error UserDoesNotHaveAnAdminToken();
    error DividendsAmountCanNotBeZero();
    error NotEnoughNativeTokensWereProvided();
    error DistributionHasNotStartedYet();
    error UserHasNoLockedTokens();
    error AlreadyClaimed();
    error UserCanNotHaveZeroAddress();
    error AdminCanNotHaveAZeroAddress();
    error IDOfDistributionMustBeGreaterThanOne();
    error DistributionWithTheGivenIDHasNotBeenAnnoucedYet();
    error DistriburionNotContainTokenToWithdraw();

    /// @dev Checks that caller is either an admin of a project or a factory
    modifier onlyAdminOrFactory(address token) {
        // Check if token has a zero address. If so, there is no way to
        // verify that caller is admin because it's impossible to
        // call verification method on zero address
        if (token == address(0)) {
            revert CanNotWorkWithZeroAddressTokens();
        }
        // If caller is neither a factory nor an admin - revert
        if (
            !(msg.sender == factory) &&
            !(IBentureProducedToken(token).verifiedAdmin(msg.sender))
        ) {
            revert CallerNotAdminOrFactory();
        }
        _;
    }

    // TODO do I need this?

/*     /// @dev Checks that caller is an admin of a project
    modifier onlyAdmin(address token) {
        if (IBentureAdmin(token).verifyAdminToken(msg.sender, token) == false) {
            revert("Benture: caller is not an admin!");
        }
        _;
    } */

    /// @dev The contract must be able to receive ether to pay dividends with it
    receive() external payable {}

    constructor(address factory_) {
        factory = factory_;
    }

    // ===== POOLS =====

    /// @notice Creates a new pool
    /// @param token The token that will be locked in the pool
    function createPool(address token) external onlyAdminOrFactory(token) {
        if (token == address(0)) {
            revert PoolsCanNotHoldZeroAddressTokens();
        }

        emit PoolCreated(token);

        Pool storage newPool = pools[token];
        // Check that this pool has not yet been initialized with the token
        // There can't multiple pools of the same token
        if (newPool.token == token) {
            revert PoolAlreadyExists();
        }
        newPool.token = token;
        // Other fields are initialized with default values
    }

    /// @notice Locks the provided amount of user's tokens in the pool
    /// @param origToken The address of the token to lock
    /// @param amount The amount of tokens to lock
    function lockTokens(address origToken, uint256 amount) public {
        if (amount == 0) {
            revert InvalidLockAmount();
        }
        // Token must have npn-zero address
        if (origToken == address(0)) {
            revert CanNotLockZeroAddressTokens();
        }

        Pool storage pool = pools[origToken];
        // Check that a pool to lock tokens exists
        if (pool.token == address(0)) {
            revert PoolDoesNotExist();
        }
        // Check that pool holds the same token. Just in case
        if (pool.token != origToken) {
            revert WrongTokenInsideThePool();
        }
        // User should have origTokens to be able to lock them
        if (!IBentureProducedToken(origToken).isHolder(msg.sender)) {
            revert UserDoesNotHaveProjectTokens();
        }

        // If user has never locked tokens, add him to the lockers list
        if (!isLocker(pool.token, msg.sender)) {
            pool.lockers.add(msg.sender);
        }
        // Increase the total amount of locked tokens
        pool.totalLocked += amount;

        // Get user's current lock, increase it and copy to the history
        pool.lockedByUser[msg.sender] += amount;
        pool.lockHistory[msg.sender][
            distributionIds.current() + 1
        ] = pool.lockedByUser[msg.sender];

        // Mark that the lock amount was changed before the next distribution
        pool.lockChangesIds[msg.sender].push(distributionIds.current() + 1);
        // Mark that current ID is in the array now
        pool.changedBeforeId[msg.sender][distributionIds.current() + 1] = true;

        emit TokensLocked(msg.sender, origToken, amount);

        // NOTE: User must approve transfer of at least `amount` of tokens
        //       before calling this function
        // Transfer tokens from user to the contract
        IBentureProducedToken(origToken).safeTransferFrom(
            msg.sender,
            address(this),
            amount
        );
    }

    /// @notice Locks all user's tokens in the pool
    /// @param origToken The address of the token to lock
    function lockAllTokens(address origToken) public {
        uint256 wholeBalance = IBentureProducedToken(origToken).balanceOf(
            msg.sender
        );
        lockTokens(origToken, wholeBalance);
    }

    /// @notice Unlocks the provided amount of user's tokens from the pool
    /// @param origToken The address of the token to unlock
    /// @param amount The amount of tokens to unlock
    function unlockTokens(address origToken, uint256 amount) public {
        if (amount == 0) {
            revert InvalidUnlockAmount();
        }
        // Token must have npn-zero address
        if (origToken == address(0)) {
            revert CanNotUnlockZeroAddressTokens();
        }

        Pool storage pool = pools[origToken];
        // Check that a pool to lock tokens exists
        if (pool.token == address(0)) {
            revert PoolDoesNotExist();
        }
        // Check that pool holds the same token. Just in case
        if (pool.token != origToken) {
            revert WrongTokenInsideThePool();
        }
        // Make sure that user has locked some tokens before
        if (!isLocker(pool.token, msg.sender)) {
            revert UserDoesNotHaveAnyLockedTokens();
        }

        // Make sure that user is trying to withdraw no more tokens than he has locked for now
        if (pool.lockedByUser[msg.sender] <
                amount) {
            revert WithdrawAmountIsTooBig();
        }

        // Decrease the total amount of locked tokens in the pool
        pool.totalLocked -= amount;

        // Get the current user's lock, decrease it and copy to the history
        pool.lockedByUser[msg.sender] -= amount;
        pool.lockHistory[msg.sender][distributionIds.current() + 1] = pool.lockedByUser[msg.sender];
        // Mark that the lock amount was changed before the next distribution
        pool.lockChangesIds[msg.sender].push(distributionIds.current() + 1);
        // Mark that current ID is in the array now
        pool.changedBeforeId[msg.sender][distributionIds.current() + 1] = true;

        // If all tokens were unlocked - delete user from lockers list
        if (pool.lockedByUser[msg.sender] == 0) {
            // Delete it from the set as well
            pool.lockers.remove(msg.sender);
        }

        emit TokensUnlocked(msg.sender, origToken, amount);

        // Transfer unlocked tokens from contract to the user
        IBentureProducedToken(origToken).safeTransfer(msg.sender, amount);
    }

    /// @notice Unlocks all locked tokens of the user in the pool
    /// @param origToken The address of the token to unlock
    function unlockAllTokens(address origToken) public {
        // Get the last lock of the user
        uint256 wholeBalance = pools[origToken].lockedByUser[msg.sender];
        // Unlock that amount (could be 0)
        unlockTokens(origToken, wholeBalance);
    }

    // ===== DISTRIBUTIONS =====

    /// @notice Allows admin to distribute dividends among lockers
    /// @param origToken The tokens to the holders of which the dividends will be paid
    /// @param distToken The token that will be paid
    ///        Use zero address for native tokens
    /// @param amount The amount of ERC20 tokens that will be paid
    /// @param isEqual Indicates whether distribution will be equal
    function distributeDividends(
        address origToken,
        address distToken,
        uint256 amount,
        bool isEqual
    ) external payable {
        if (origToken == address(0)) {
            revert OriginalTokenCanNotHaveAZeroAddress();
        }
        // Check that caller is an admin of `origToken`
        if (!IBentureProducedToken(origToken).checkAdmin(msg.sender)) {
            revert UserDoesNotHaveAnAdminToken();
        }
        // Amount can not be zero
        if (amount == 0) {
            revert DividendsAmountCanNotBeZero();
        }
        if (distToken != address(0)) {
            // NOTE: Caller should approve transfer of at least `amount` of tokens with `ERC20.approve()`
            // before calling this function
            // Transfer tokens from admin to the contract
            IERC20(distToken).safeTransferFrom(
                msg.sender,
                address(this),
                amount
            );
        } else {
            // Check that enough native tokens were provided
            if (msg.value < amount) {
            revert NotEnoughNativeTokensWereProvided();
        }

        }

        emit DividendsStarted(origToken, distToken, amount, isEqual);

        distributionIds.increment();
        // NOTE The lowest distribution ID is 1
        uint256 distributionId = distributionIds.current();
        // Mark that this admin started a distribution with the new ID
        distributionsToAdmins[distributionId] = msg.sender;
        // Create a new distribution
        Distribution storage newDistribution = distributions[distributionId];
        newDistribution.id = distributionId;
        newDistribution.origToken = origToken;
        newDistribution.distToken = distToken;
        newDistribution.amount = amount;
        newDistribution.isEqual = isEqual;
        // `hasClaimed` is initialized with default value
        newDistribution.formulaLockers = pools[origToken].lockers.length();
        newDistribution.formulaLocked = pools[origToken].totalLocked;
    }

    /// @dev Searches for the distribution that has an ID less than the `id`
    ///      but greater than all other IDs less than `id` and before which user's
    ///      lock amount was changed the last time. Returns the ID of that distribution
    ///      of (-1) if no such ID exists.
    ///      Performs a binary search.
    /// @param user The user to find a previous distribution for
    /// @param id The ID of the distribution to find a previous distribution for
    /// @return The ID of the found distribution. Or (-1) if no such distribution exists
    function findMaxPrev(
        address user,
        uint256 id
    ) internal view returns (int256) {
        address origToken = distributions[id].origToken;

        uint256[] storage ids = pools[origToken].lockChangesIds[user];

        // If the array is empty, there can't be a correct ID we're looking for in it
        if (ids.length == 0) {
            return -1;
        }

        // Start binary search
        uint256 low = 0;
        uint256 high = pools[origToken].lockChangesIds[user].length;

        while (low < high) {
            uint256 mid = Math.average(low, high);
            if (pools[origToken].lockChangesIds[user][mid] > id) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }

        // After this loop `low` is the array index of the ID that is *greater* than the `id`.
        // (and we're looking for the one that is *less* than the `id`)

        // IDs are sorted in the ascending order.
        // If `low` is 0, that means that the first ID in the array is
        //    greater than the `id`. Thus there are no any IDs in the array that may be *less* than the `id`
        if (low == 0) {
            return -1;
        }

        // If the array actually contains the `id` at index N, that means that a greater value is located at the
        // N + 1 index in the array (which is `low`) and the *smaller* value is located at the N - 1
        // index in the array (which is `low - 2`)
        if (pools[origToken].changedBeforeId[user][id]) {
            // If `low` is 1, that means that the `id` is the first element of the array (index 0).
            // Thus there are no any IDs in the array that may be *less* then `id`
            if (low == 1) {
                return -1;
            }
            // If `low` is greater then 1, that means that there can be elements of the array at indexes
            // of `low - 2` that are less than the `id`
            return int256(ids[low - 2]);
            // If the array does not contain the `id` at index N (that is also possible if user's lock was not changed before that `id`),
            // that means that a greater value is located at the N + 1 index in the array (which is `low`) and the *smaller* value is located
            // at the *N* index in the array (which is `low - 1`)
            // The lowest possible value of `low` here is 1. 0 is excluded by one of the conditions above
        } else {
            return int256(ids[low - 1]);
        }
    }

    /// @notice Calculates locker's share in the distribution
    /// @param id The ID of the distribution to calculates shares in
    /// @param user The address of the user whos share has to be calculated
    function calculateShare(
        uint256 id,
        address user
    ) internal view returns (uint256) {
        Distribution storage distribution = distributions[id];
        Pool storage pool = pools[distribution.origToken];

        uint256 share;

        // Calculate shares if equal distribution
        if (distribution.isEqual) {
            // NOTE: result gets rounded towards zero
            share = distribution.amount / pool.lockers.length();
            // Calculate shares in weighted distribution
        } else {
            // Get the amount locked by the user before the given distribution
            uint256 lock = pool.lockHistory[user][id];

            // If lock is zero, that means:
            // 1) The user has unlocked all his tokens before the given distribution
            // OR
            // 2) The user hasn't called either lock or unlock functions before the given distribution
            //    and because of that his locked amount was not updated in the mapping
            // So we have to determine which option is the right one
            if (lock == 0) {
                // Check if user has changed his lock amount before the distribution
                if (pool.changedBeforeId[user][id]) {
                    // If he did, and his current lock is 0, that means that he has unlocked all his tokens and 0 is a correct lock amount
                    lock = 0;
                } else {
                    // If he didn't, that means that *we have to use his lock from the closest distribution from the past*
                    // We have to find a distribution that has and ID that is less than `id` but greater than all other
                    // IDs less than `id`
                    int256 prevMaxId = findMaxPrev(user, id);
                    if (prevMaxId != -1) {
                        lock = pool.lockHistory[user][uint256(prevMaxId)];
                    } else {
                        // If no such an ID exists (i.e. there were no distributions before the current one that had non-zero locks before them)
                        // that means that a user has *locked and unlocked* his tokens before the very first distribution. In this case 0 is a correct lock amount
                        lock = 0;
                    }
                }
            }

            share = (distribution.amount * lock) / pool.totalLocked;
        }

        return share;
    }

    /// @notice Allows a user to claim dividends from a single distribution
    /// @param id The ID of the distribution to claim
    function claimDividends(uint256 id) public {
        // Can't claim a distribution that has not started yet
        if (id > distributionIds.current()) {
            revert DistributionHasNotStartedYet();
        }

        Distribution storage distribution = distributions[id];

        // User must be a locker of the `origToken` of the distribution he's trying to claim
        if (!isLocker(distribution.origToken, msg.sender)) {
            revert UserHasNoLockedTokens();
        }

        // User can't claim the same distribution more than once
        if (distribution.hasClaimed[msg.sender] == true) {
            revert AlreadyClaimed();
        }

        // Calculate the share of the user
        uint256 share = calculateShare(id, msg.sender);

        emit DividendsClaimed(id, msg.sender);

        distribution.hasClaimed[msg.sender] = true;

        // Each user can claim dividends with a given ID only once
        // So if a number of calls of that function is equal to `formulaLockers`
        // than we can say that the distribution was fulfilled
        if (distribution.numCalls == distribution.formulaLockers) {
            emit DividendsFulfilled(id);
        }
        // Increment the number of calls of this function
        distribution.numCalls++;

        // Send the share to the user
        if (distribution.distToken == address(0)) {
            // Send native tokens
            (bool success, ) = msg.sender.call{value: share}("");
            if (!success) {
                revert NativeTokenDividendsTransferFailed();
            }
        } else {
            // Send ERC20 tokens
            //TODO check if it works well
            IERC20(distribution.distToken).safeTransfer(
                //address(this),
                msg.sender,
                share
            );
        }
    }

    /// @notice Allows user to claim dividends from multiple distributions
    ///         WARNING: Potentially can exceed block gas limit!
    /// @param ids The array of IDs of distributions to claim
    function claimMultipleDividends(uint256[] calldata ids) public {
        uint256 gasToSpend = (block.gaslimit * 2) / 3;
        uint256 lastID = 0;

        for (uint i = 0; i < ids.length; i++) {
            claimDividends(ids[i]);
            if(gasleft() <= gasToSpend) {
                lastID = i;
                break;
            }
            lastID = i;
        }

        emit MultiplyDividendsClaimed(ids[0:lastID], msg.sender);
    }

    /// @notice Allows user to claim dividends from multiple distributions
    ///         and unlock his tokens after that
    ///         WARNING: Potentially can exceed block gas limit!
    /// @param ids The array of IDs of distributions to claim
    /// @param tokenToWithdraw Token to unlock
    function claimMultipleDividendsAndUnlock(uint256[] calldata ids, address tokenToWithdraw) public {
        uint256 gasToSpend = (block.gaslimit * 2) / 3;
        uint256 lastID = 0;

        for (uint i = 0; i < ids.length; i++) {
            if (tokenToWithdraw != distributions[ids[i]].origToken) {
                    revert DistriburionNotContainTokenToWithdraw();
                }
            claimDividends(ids[i]);
            if(gasleft() <= gasToSpend) {
                lastID = i;
                break;
            }
            lastID = i;
        }
        unlockAllTokens(distributions[ids[0]].origToken);
        emit MultiplyDividendsClaimed(ids[0:lastID], msg.sender);
    }

    // ===== GETTERS =====

    /// @notice Returns info about the pool of a given token
    /// @param token The address of the token of the pool
    /// @return The address of the tokens in the pool.
    /// @return The number of users who locked their tokens in the pool
    /// @return The amount of locked tokens
    function getPool(
        address token
    ) public view returns (address, uint256, uint256) {
        if (token == address(0)) {
            revert PoolsCanNotHoldZeroAddressTokens();
        }

        Pool storage pool = pools[token];
        return (pool.token, pool.lockers.length(), pool.totalLocked);
    }

    /// @notice Returns the array of lockers of the pool
    /// @param token The address of the token of the pool
    /// @return The array of lockers of the pool
    function getLockers(address token) public view returns (address[] memory) {
        if (token == address(0)) {
            revert PoolsCanNotHoldZeroAddressTokens();
        }

        return pools[token].lockers.values();
    }

    /// @notice Checks if user is a locker of the provided token pool
    /// @param token The address of the token of the pool
    /// @param user The address of the user to check
    /// @return True if user is a locker in the pool. Otherwise - false.
    function isLocker(address token, address user) public view returns (bool) {
        if (token == address(0)) {
            revert PoolsCanNotHoldZeroAddressTokens();
        }

        if (user == address(0)) {
            revert UserCanNotHaveZeroAddress();
        }
        // User is a locker if his lock is not a zero and he is in the lockers list
        return
            (pools[token].lockedByUser[user] != 0) &&
            (pools[token].lockers.contains(user));
    }

    /// @notice Returns the current lock amount of the user
    /// @param token The address of the token of the pool
    /// @param user The address of the user to check
    /// @return The current lock amount
    function getCurrentLock(
        address token,
        address user
    ) public view returns (uint256) {
        if (token == address(0)) {
            revert PoolsCanNotHoldZeroAddressTokens();
        }
        if (user == address(0)) {
            revert UserCanNotHaveZeroAddress();
        }
        return pools[token].lockedByUser[user];
    }

    /// @notice Returns the list of IDs of all distributions the admin has ever started
    /// @param admin The address of the admin
    /// @return The list of IDs of all distributions the admin has ever started
    function getDistributions(
        address admin
    ) public view returns (uint256[] memory) {
        // Do not check wheter the given address is actually an admin
        if (admin == address(0)) {
            revert AdminCanNotHaveAZeroAddress();
        }
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
        returns (uint256, address, address, uint256, bool)
    {
        if (id < 1) {
            revert IDOfDistributionMustBeGreaterThanOne();
        }
        if (distributionsToAdmins[id] == address(0)) {
            revert DistributionWithTheGivenIDHasNotBeenAnnoucedYet();
        }
        Distribution storage distribution = distributions[id];
        return (
            distribution.id,
            distribution.origToken,
            distribution.distToken,
            distribution.amount,
            distribution.isEqual
        );
    }

    /// @notice Checks if user has claimed dividends of the provided distribution
    /// @param id The ID of the distribution to check
    /// @param user The address of the user to check
    /// @return True if user has claimed dividends. Otherwise - false
    function hasClaimed(uint256 id, address user) public view returns (bool) {
        return distributions[id].hasClaimed[user];
    }

    /// @notice Checks if the distribution with the given ID was started by the given admin
    /// @param id The ID of the distribution to check
    /// @param admin The address of the admin to check
    /// @return True if admin has started the distribution with the given ID. Otherwise - false.
    function checkStartedByAdmin(
        uint256 id,
        address admin
    ) public view returns (bool) {
        if (id < 1) {
            revert IDOfDistributionMustBeGreaterThanOne();
        }
        if (distributionsToAdmins[id] == address(0)) {
            revert DistributionWithTheGivenIDHasNotBeenAnnoucedYet();
        }
        if (admin == address(0)) {
            revert AdminCanNotHaveAZeroAddress();
        }
        if (distributionsToAdmins[id] == admin) {
            return true;
        }
        return false;
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
}
