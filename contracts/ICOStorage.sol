// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ICOStorage {
    struct Purchase {
        address user;
        uint40 timestamp;
        uint8 round;
        uint256 ethAmount;
        uint256 tokenAmount;
    }

    struct VestingInfo {
        uint256 totalTokens;
        uint256 claimedTokens;
        uint256 startTime;
    }

    struct Allocation {
        uint8 category;
        uint256 totalTokens;
        uint256 claimedTokens;
        uint256 startTime;
    }

    // ICO purchase history
    Purchase[] private purchases;
    mapping(address => uint256) public userPurchaseCount;
    mapping(address => mapping(uint256 => uint256)) public userPurchaseIndex;

    // ICO vesting (rounds 0-2)
    mapping(address => VestingInfo) public vesting;

    // Internal allocations (founders, advisors, etc.)
    Allocation[] private allocations;
    mapping(address => uint256) public userAllocationCount;
    mapping(address => mapping(uint256 => uint256)) public userAllocationIndex;

    address public icoContract;
    bool private icoContractSet;

    modifier onlyICO() {
        require(msg.sender == icoContract, "Only ICO contract can call");
        _;
    }

    constructor() {
        icoContract = msg.sender;
    }

    function setICOContract(address _icoContract) external {
        require(!icoContractSet, "ICO contract already set");
        require(_icoContract != address(0), "Invalid address");
        icoContract = _icoContract;
        icoContractSet = true;
    }

    // ========== ICO Purchase Storage ==========

    function addPurchase(
        address user,
        uint8 round,
        uint256 ethAmount,
        uint256 tokenAmount
    ) external onlyICO {
        uint256 index = purchases.length;
        purchases.push(Purchase({
            user: user,
            timestamp: uint40(block.timestamp),
            round: round,
            ethAmount: ethAmount,
            tokenAmount: tokenAmount
        }));
        userPurchaseIndex[user][userPurchaseCount[user]] = index;
        userPurchaseCount[user]++;
    }

    function getPurchase(uint256 index) external view returns (Purchase memory) {
        require(index < purchases.length, "Invalid index");
        return purchases[index];
    }

    function getUserPurchases(address user) external view returns (Purchase[] memory) {
        uint256 count = userPurchaseCount[user];
        Purchase[] memory userPurchases = new Purchase[](count);
        for (uint256 i = 0; i < count; i++) {
            userPurchases[i] = purchases[userPurchaseIndex[user][i]];
        }
        return userPurchases;
    }

    function totalPurchases() external view returns (uint256) {
        return purchases.length;
    }

    // ========== ICO Vesting Storage ==========

    function addVestingTokens(address user, uint256 amount) external onlyICO {
        if (vesting[user].startTime == 0) {
            // First purchase: set both startTime and totalTokens in one path
            vesting[user].startTime = block.timestamp;
            vesting[user].totalTokens = amount;
        } else {
            vesting[user].totalTokens += amount;
        }
    }

    function updateClaimed(address user, uint256 amount) external onlyICO {
        require(vesting[user].totalTokens > 0, "No vesting info found");
        require(
            vesting[user].claimedTokens + amount <= vesting[user].totalTokens,
            "Exceeds total tokens"
        );
        vesting[user].claimedTokens += amount;
    }

    function getVesting(address user) external view returns (VestingInfo memory) {
        return vesting[user];
    }

    // ========== Internal Allocation Storage ==========

    function addAllocation(
        address user,
        uint8 category,
        uint256 totalTokens
    ) external onlyICO {
        uint256 index = allocations.length;
        allocations.push(Allocation({
            category: category,
            totalTokens: totalTokens,
            claimedTokens: 0,
            startTime: block.timestamp
        }));
        userAllocationIndex[user][userAllocationCount[user]] = index;
        userAllocationCount[user]++;
    }

    function getAllocation(uint256 index) external view returns (Allocation memory) {
        require(index < allocations.length, "Invalid index");
        return allocations[index];
    }

    function getUserAllocations(address user) external view returns (Allocation[] memory) {
        uint256 count = userAllocationCount[user];
        Allocation[] memory userAllocations = new Allocation[](count);
        for (uint256 i = 0; i < count; i++) {
            userAllocations[i] = allocations[userAllocationIndex[user][i]];
        }
        return userAllocations;
    }

    function totalAllocations() external view returns (uint256) {
        return allocations.length;
    }

    function updateAllocationClaimed(uint256 index, uint256 amount) external onlyICO {
        require(index < allocations.length, "Invalid index");
        require(
            allocations[index].claimedTokens + amount <= allocations[index].totalTokens,
            "Exceeds total tokens"
        );
        allocations[index].claimedTokens += amount;
    }

    function getAllocationClaimable(
        uint256 index,
        uint256 cliffPeriod,
        uint256 vestingPeriod
    ) external view returns (uint256) {
        if (index >= allocations.length) return 0;
        Allocation storage alloc = allocations[index];
        if (alloc.startTime == 0) return 0;

        uint256 elapsed = block.timestamp - alloc.startTime;
        uint256 vestedTokens;
        if (elapsed < cliffPeriod) {
            vestedTokens = 0;
        } else if (elapsed >= cliffPeriod + vestingPeriod) {
            vestedTokens = alloc.totalTokens;
        } else {
            uint256 timeAfterCliff = elapsed - cliffPeriod;
            vestedTokens = (alloc.totalTokens * timeAfterCliff) / vestingPeriod;
        }

        return vestedTokens - alloc.claimedTokens;
    }
}
