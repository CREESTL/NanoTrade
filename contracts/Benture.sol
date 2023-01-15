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

/// @title Dividends distributing contract
contract Benture is IBenture, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    using SafeERC20 for IERC20;
    using SafeERC20 for IBentureProducedToken;
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.UintSet;

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
        // Mapping from user address to his last lock amount (current one)
        mapping(address => uint256) lastLock;
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
        // the pool, then his lock for the distribution ID477 should increase up to 600.
        mapping(address => mapping(uint256 => uint256)) lockHistory;
        // Mapping from user address to IDs of distributions *before which* user's lock amount was changed
        // For example an array of [1, 2] means that user's lock amount changed before 1st and 2nd distributions
        mapping(address => EnumerableSet.UintSet) lockChangesIds;
    }

    /// @dev Stores information about a specific dividends distribution
    struct Distribution {
        uint256 id; // ID of distributiion
        address origToken; // The token owned by holders
        address distToken; // The token distributed to holders
        uint256 amount; // The amount of `distTokens` or native tokens paid to holders
        bool isEqual; // True if distribution is equal, false if it's weighted
        mapping(address => bool) hasClaimed; // Mapping showing that holder has withdrawn his dividends
        uint256 formulaLockers; // Copies the length of `lockers` set from the pool
        uint256 formulaLocked; // Copies the value of Pool.totalLocked when creating a distribution
        DistStatus status; // Current status of distribution
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

    /// @dev Checks that caller is either an admin of a project or a factory
    modifier onlyAdminOrFactory(address token) {
        // If caller is neither a factory nor an admin - revert
        if (!(token == factory) && !(IBentureAdmin(token).verifyAdminToken(msg.sender, token) == true)) {
            revert("Benture: caller is neither admin nor factory!");
        }
        _;
    }

    /// @dev Checks that caller is an admin of a project
    modifier onlyAdmin(address token) {
        if (IBentureAdmin(token).verifyAdminToken(msg.sender, token) == false) {
            revert("Benture: caller is not an admin!");
        }
        _;
    }


    /// @dev The contract must be able to receive ether to pay dividends with it
    receive() external payable {}

    constructor(address factory_) {
        factory = factory_;
    }


    // ===== POOLS =====


    /// @notice Creates a new pool
    /// @param token The token that will be locked in the pool
    function createPool(address token) external onlyAdminOrFactory(token) {
        require(token != address(0), "Benture: pools can not hold zero address tokens!");

        emit PoolCreated(token);

        Pool storage newPool = pools[token];
        // Check that this pool has not yet been initialized with the token
        // There can't multiple pools of the same token
        require(newPool.token != token, "Benture: pool already exists!");
        newPool.token = token;
        // Other fields are initialized with default values
    }

    // TODO do we need this funcion?
    /// @notice Deletes a pool
    ///         After that all operations with the pool will fail
    /// @param token The token of the pool
    function deletePool(address token) external onlyAdmin(token) {
        require(token != address(0), "Benture: pools can not hold zero address tokens!");

        emit PoolDeleted(token);

        delete pools[token];
    }

    /// @notice Locks the provided amount of user's tokens in the pool
    /// @param origToken The address of the token to lock
    /// @param amount The amount of tokens to lock
    function lockTokens(address origToken, uint256 amount) public {
        require(amount > 0, "Benture: invalid lock amount!");
        // Token must have npn-zero address
        require(origToken != address(0), "Benture: can not lock zero address tokens!");

        Pool storage pool = pools[origToken];
        // Check that a pool to lock tokens exists
        require(pool.token != address(0), "Benture: pool does not exist!");
        // Check that pool holds the same token. Just in case
        require(pool.token == origToken, "Benture: wrong token inside the pool!");
        // User should have origTokens to be able to lock them
        require(
            IBentureProducedToken(origToken).isHolder(msg.sender),
            "Benture: user does not have project tokens!"
        );

        // Mark that the lock amount was changed before the next distribution
        // NOTE: These is no need to check if set already contain the ID because
        //       it's done in the `add` method implicitly
        pool.lockChangesIds[msg.sender].add(distributionIds.current() + 1);

        // If user has already locked tokens in this pool, increase his locked amount
        if (isLocker(pool.token, msg.sender)) {
            // Update his current lock. Will be used for calculations in the *next* distribution
            pool.lockHistory[msg.sender][distributionIds.current() + 1] += amount;
        } else {
            // If user has never locked tokens, add him to the lockers list
            pool.lockers.add(msg.sender);
            // Update his lock for the next distribution
            pool.lockHistory[msg.sender][distributionIds.current() + 1] = amount;
        }
        // Increase the total amount of locked tokens
        pool.totalLocked += amount;
        // Update the last user's lock
        pool.lastLock[msg.sender] = pool.lockHistory[msg.sender][distributionIds.current() + 1];

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
        uint256 wholeBalance = IBentureProducedToken(origToken).balanceOf(msg.sender);
        lockTokens(origToken, wholeBalance);
    }

    /// @notice Unlocks the provided amount of user's tokens from the pool
    /// @param origToken The address of the token to unlock
    /// @param amount The amount of tokens to unlock
    function unlockTokens(address origToken, uint256 amount) public {
        require(amount > 0, "Benture: invalid unlock amount!");
        // Token must have npn-zero address
        require(origToken != address(0), "Benture: can not unlock zero address tokens!");

        Pool storage pool = pools[origToken];
        // Check that a pool to lock tokens exists
        require(pool.token != address(0), "Benture: pool does not exist!");
        // Check that pool holds the same token. Just in case
        require(pool.token == origToken, "Benture: wrong token inside the pool!");
        // Make sure that user has locked some tokens before
        require(isLocker(pool.token, msg.sender), "Benture: user does not have any locked tokens!");
        // Make sure that user is trying to withdraw no more tokens than he has locked for the next distribution
        require(pool.lockHistory[msg.sender][distributionIds.current() + 1] >= amount, "Benture: withdraw amount is too big!");

        // Decrease the amount of locked tokens
        pool.lockHistory[msg.sender][distributionIds.current() + 1] -= amount;
        // Mark that the lock amount was changed before the next distribution
        // NOTE: These is no need to check if set already contain the ID because
        //       it's done in the `add` method implicitly
        pool.lockChangesIds[msg.sender].add(distributionIds.current() + 1);

        // If all tokens were unlocked - delete user from lockers list
        if (pool.lockHistory[msg.sender][distributionIds.current() + 1] == 0) {
            // Delete it from the set as well
            pool.lockers.remove(msg.sender);
        }

        // Update the last user's lock
        pool.lastLock[msg.sender] = pool.lockHistory[msg.sender][distributionIds.current() + 1];

        emit TokensUnlocked(msg.sender, origToken, amount);

        // Transfer unlocked tokens from contract to the user
        IBentureProducedToken(origToken).safeTransfer(
            msg.sender,
            amount
        );
    }

    /// @notice Unlocks all locked tokens of the user in the pool
    /// @param origToken The address of the token to unlock
    function unlockAllTokens(address origToken) public {
        uint256 wholeBalance = IBentureProducedToken(origToken).balanceOf(msg.sender);
        unlockTokens(origToken, wholeBalance);
    }


    // ===== DISTRIBUTIONS =====


    /// @notice Allows admin to distribute dividends among lockers
    /// @param origToken The tokens to the holders of which the dividends will be paid
    /// @param distToken The token that will be paid
    ///        Use zero address for native tokens
    /// @param amount The amount of ERC20 tokens that will be paid
    /// @param isEqual Indicates whether distribution will be equal
    function distributeDividends (
        address origToken,
        address distToken,
        uint256 amount,
        bool isEqual
    ) external payable {
        require(
            origToken != address(0),
            "Benture: original token can not have a zero address!"
        );
        // Check that caller is an admin of `origToken`
        require(IBentureProducedToken(origToken).checkAdmin(msg.sender), "BentureAdmin: user does not have an admin token!");
        // Amount can not be zero
        require(amount > 0, "Benture: dividends amount can not be zero!");
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
            require(
                msg.value >= amount,
                "Benture: not enough native tokens were provided!"
            );
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
        newDistribution.status = DistStatus.inProgress;

    }

    // TODO add it to `claimDividends` later
    /// @notice Calculates locker's share in the distribution
    /// @param id The ID of the distribution to calculates shares in
    function calculateShare(uint256 id) internal {
            // TODO do stuff here
    }


    // TODO add claim dividends here


    // ===== GETTERS =====


    /// @notice Returns info about the pool of a given token
    /// @param token The address of the token of the pool
    /// @return The address of the tokens in the pool.
    /// @return The number of users who locked their tokens in the pool
    /// @return The amount of locked tokens
    function getPool(address token) public view returns(address, uint256, uint256) {
        require(token != address(0), "Benture: pools can not hold zero address tokens!");
        Pool storage pool = pools[token];
        return (
            pool.token,
            pool.lockers.length(),
            pool.totalLocked
        );
    }

    /// @notice Returns the array of lockers of the pool
    /// @param token The address of the token of the pool
    /// @return The array of lockers of the pool
    function getLockers(address token) public view returns(address[] memory) {
        require(token != address(0), "Benture: pools can not hold zero address tokens!");
        return pools[token].lockers.values();
    }


    /// @notice Checks if user is a locker of the provided token pool
    /// @param token The address of the token of the pool
    /// @param user The address of the user to check
    /// @return True if user is a locker in the pool. Otherwise - false.
    function isLocker(address token, address user) public view returns(bool) {
        require(token != address(0), "Benture: pools can not hold zero address tokens!");
        require(user != address(0), "Benture: user can not have zero address!");
        // User is a locker if his lock is not a zero and he is in the lockers list
        return (pools[token].lastLock[msg.sender] != 0) && (pools[token].lockers.contains(user));
    }

    /// @notice Returns the current lock amount of the user
    /// @param token The address of the token of the pool
    /// @param user The address of the user to check
    /// @return The current lock amount
    function getCurrentLock(address token, address user) public view returns(uint256) {
        require(token != address(0), "Benture: pools can not hold zero address tokens!");
        require(user != address(0), "Benture: user can not have zero address!");
        return pools[token].lastLock[user];
    }


    /// @notice Returns the list of IDs of all distributions the admin has ever started
    /// @param admin The address of the admin
    /// @return The list of IDs of all distributions the admin has ever started
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
        returns (uint256, address, address, uint256, bool, DistStatus)
    {
        require(id >= 1, "Benture: ID of distribution must be greater than 1!");
        require(
            distributionsToAdmins[id] != address(0),
            "Benture: distribution with the given ID has not been annouced yet!"
        );
        Distribution storage distribution = distributions[id];
        return (
            distribution.id,
            distribution.origToken,
            distribution.distToken,
            distribution.amount,
            distribution.isEqual,
            distribution.status
        );
    }

    /// @notice Checks if user has claimed dividends of the provided distribution
    /// @param id The ID of the distribution to check
    /// @param user The address of the user to check
    /// @return True if user has claimed dividends. Otherwise - false
    function hasClaimed(uint256 id, address user) public view returns(bool) {
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
