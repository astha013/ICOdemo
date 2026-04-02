// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ICOStorage.sol";

contract ICOToken is ERC20, Ownable {
    struct Round {
        uint256 priceUSD;
        uint256 tokensAvailable;
        uint256 tokensSold;
        uint8 category;
    }

    struct AllocationCategory {
        string name;
        uint256 cliffMonths;
        uint256 vestingMonths;
    }

    event PurchaseRecorded(address indexed user, uint8 round, uint256 ethAmount, uint256 tokenAmount);
    event TokensClaimed(address indexed user, uint256 amount);
    event AllocationAdded(address indexed user, uint8 category, uint256 amount);
    event AllocationClaimed(address indexed user, uint8 category, uint256 amount);

    ICOStorage public storageContract;
    uint256 public totalRaisedETH;
    uint256 public totalSoldTokens;
    mapping(uint8 => Round) public rounds;
    uint8 public currentRound;

    uint256 public constant TOTAL_SUPPLY = 225_000_000 ether;
    uint256 public totalMinted;

    // Allocation categories: [name, cliffMonths, vestingMonths]
    // 0: Founders/Team (12% = 27M) - 12mo cliff, 24mo vest
    // 1: Advisors (2.5% = 5.625M) - 12mo cliff, 24mo vest
    // 2: Ecosystem (20% = 45M) - 1mo cliff, 24mo vest
    // 3: Treasury (40.2% = 90.45M) - 1mo cliff, 12mo vest
    // 4: Partnerships (18% = 40.5M) - 3mo cliff, 12mo vest
    // 5: PreSeed ICO - 3mo cliff, 24mo vest
    // 6: Seed ICO - 3mo cliff, 24mo vest
    // 7: Strategic ICO - 3mo cliff, 24mo vest
    // 8: Public ICO - no vesting
    mapping(uint8 => AllocationCategory) public allocationCategories;
    uint8 public allocationCategoryCount;

    constructor(address _storageContract) ERC20("ICO Token", "ICO") Ownable(msg.sender) {
        storageContract = ICOStorage(_storageContract);

        // Initialize allocation categories (internal)
        allocationCategories[0] = AllocationCategory("Founders/Team", 12, 24);
        allocationCategories[1] = AllocationCategory("Advisors", 12, 24);
        allocationCategories[2] = AllocationCategory("Ecosystem", 1, 24);
        allocationCategories[3] = AllocationCategory("Treasury", 1, 12);
        allocationCategories[4] = AllocationCategory("Partnerships", 3, 12);

        // Initialize ICO round categories
        allocationCategories[5] = AllocationCategory("PreSeed", 3, 24);
        allocationCategories[6] = AllocationCategory("Seed", 3, 24);
        allocationCategories[7] = AllocationCategory("Strategic", 3, 24);
        allocationCategories[8] = AllocationCategory("Public", 0, 0);
        allocationCategoryCount = 9;

        // Initialize rounds with priceUSD and category linkage
        rounds[0] = Round({
            priceUSD: 0.067 ether,
            tokensAvailable: 4_500_000 ether,
            tokensSold: 0,
            category: 5 // PreSeed
        });
        rounds[1] = Round({
            priceUSD: 0.089 ether,
            tokensAvailable: 7_875_000 ether,
            tokensSold: 0,
            category: 6 // Seed
        });
        rounds[2] = Round({
            priceUSD: 0.111 ether,
            tokensAvailable: 2_250_000 ether,
            tokensSold: 0,
            category: 7 // Strategic
        });
        rounds[3] = Round({
            priceUSD: 0.133 ether,
            tokensAvailable: 1_875_000 ether,
            tokensSold: 0,
            category: 8 // Public
        });
        currentRound = 0;
    }

    // ========== ICO Functions ==========

    // ICO vesting: 3 month cliff, 24 month linear vesting (for rounds 0-2)
    uint256 private constant ICO_CLIFF = 90 days;
    uint256 private constant ICO_VEST = 720 days;

    // Category index 8 = Public (no vesting)
    uint8 private constant PUBLIC_CATEGORY = 8;

    function buyTokens(uint8 round) external payable {
        require(msg.value > 0, "ETH must be greater than 0");
        require(round == currentRound, "Not current round");
        require(rounds[round].tokensSold < rounds[round].tokensAvailable, "Round sold out");

        uint256 available = rounds[round].tokensAvailable - rounds[round].tokensSold;
        uint256 tokensToBuy = (msg.value * 1e18) / rounds[round].priceUSD;
        require(tokensToBuy > 0, "Insufficient ETH for tokens");

        uint256 cost;
        if (tokensToBuy > available) {
            tokensToBuy = available;
            cost = (tokensToBuy * rounds[round].priceUSD) / 1e18;
            uint256 refund = msg.value - cost;
            if (refund > 0) {
                (bool success, ) = payable(msg.sender).call{value: refund}("");
                require(success, "ETH refund failed");
            }
        } else {
            cost = msg.value;
        }

        rounds[round].tokensSold += tokensToBuy;
        totalRaisedETH += cost;
        totalSoldTokens += tokensToBuy;

        storageContract.addPurchase(msg.sender, round, cost, tokensToBuy);

        if (rounds[round].tokensSold >= rounds[round].tokensAvailable) {
            if (round < 3) {
                currentRound = round + 1;
            }
        }

        if (rounds[round].category == PUBLIC_CATEGORY) {
            _mintWithCap(msg.sender, tokensToBuy);
        } else {
            storageContract.addVestingTokens(msg.sender, tokensToBuy);
        }

        emit PurchaseRecorded(msg.sender, round, cost, tokensToBuy);
    }

    function claim() external {
        ICOStorage.VestingInfo memory vesting = storageContract.getVesting(msg.sender);
        require(vesting.totalTokens > 0, "No vesting info found");
        require(vesting.startTime > 0, "Vesting not started");

        uint256 claimable = _calculateClaimable(vesting, ICO_CLIFF, ICO_VEST);
        require(claimable > 0, "No tokens to claim");

        storageContract.updateClaimed(msg.sender, claimable);
        _mintWithCap(msg.sender, claimable);

        emit TokensClaimed(msg.sender, claimable);
    }

    function getClaimableTokens(address user) external view returns (uint256) {
        ICOStorage.VestingInfo memory vesting = storageContract.getVesting(user);
        if (vesting.totalTokens == 0 || vesting.startTime == 0) {
            return 0;
        }
        return _calculateClaimable(vesting, ICO_CLIFF, ICO_VEST);
    }

    // ========== Internal Allocation Functions ==========

    function addAllocation(
        address user,
        uint8 category,
        uint256 amount
    ) external onlyOwner {
        require(category < allocationCategoryCount, "Invalid category");
        require(amount > 0, "Amount must be > 0");
        require(user != address(0), "Invalid address");
        require(totalMinted + amount <= TOTAL_SUPPLY, "Exceeds total supply");

        _mint(address(this), amount);
        totalMinted += amount;

        storageContract.addAllocation(user, category, amount);

        emit AllocationAdded(user, category, amount);
    }

    function claimAllocation() external {
        uint256 count = storageContract.userAllocationCount(msg.sender);
        require(count > 0, "No allocations found");

        uint256 totalClaimable = 0;

        for (uint256 i = 0; i < count; i++) {
            uint256 globalIndex = storageContract.userAllocationIndex(msg.sender, i);
            ICOStorage.Allocation memory alloc = storageContract.getAllocation(globalIndex);
            AllocationCategory memory cat = allocationCategories[alloc.category];

            uint256 cliffPeriod = cat.cliffMonths * 30 days;
            uint256 vestingPeriod = cat.vestingMonths * 30 days;

            uint256 claimable = storageContract.getAllocationClaimable(
                globalIndex,
                cliffPeriod,
                vestingPeriod
            );

            if (claimable > 0) {
                storageContract.updateAllocationClaimed(globalIndex, claimable);
                totalClaimable += claimable;
            }
        }

        require(totalClaimable > 0, "No tokens to claim");
        _transfer(address(this), msg.sender, totalClaimable);

        emit AllocationClaimed(msg.sender, 0, totalClaimable);
    }

    function getAllocationClaimable(address user) external view returns (uint256) {
        uint256 count = storageContract.userAllocationCount(user);
        uint256 totalClaimable = 0;

        for (uint256 i = 0; i < count; i++) {
            uint256 globalIndex = storageContract.userAllocationIndex(user, i);
            ICOStorage.Allocation memory alloc = storageContract.getAllocation(globalIndex);
            AllocationCategory memory cat = allocationCategories[alloc.category];

            totalClaimable += storageContract.getAllocationClaimable(
                globalIndex,
                cat.cliffMonths * 30 days,
                cat.vestingMonths * 30 days
            );
        }

        return totalClaimable;
    }

    function getUserAllocationInfo(address user, uint256 index)
        external view
        returns (
            uint8 category,
            string memory categoryName,
            uint256 totalTokens,
            uint256 claimedTokens,
            uint256 startTime,
            uint256 cliffMonths,
            uint256 vestingMonths
        )
    {
        uint256 globalIndex = storageContract.userAllocationIndex(user, index);
        ICOStorage.Allocation memory alloc = storageContract.getAllocation(globalIndex);
        AllocationCategory memory cat = allocationCategories[alloc.category];
        return (
            alloc.category,
            cat.name,
            alloc.totalTokens,
            alloc.claimedTokens,
            alloc.startTime,
            cat.cliffMonths,
            cat.vestingMonths
        );
    }

    function getAllocationCategory(uint8 category) external view returns (string memory name, uint256 cliffMonths, uint256 vestingMonths) {
        AllocationCategory memory cat = allocationCategories[category];
        return (cat.name, cat.cliffMonths, cat.vestingMonths);
    }

    // ========== View Functions ==========

    function getCurrentRound() external view returns (uint8) {
        return currentRound;
    }

    function getRoundInfo(uint8 round) external view returns (uint256 priceUSD, uint256 tokensAvailable, uint256 tokensSold) {
        require(round < 4, "Invalid round");
        Round storage r = rounds[round];
        return (r.priceUSD, r.tokensAvailable, r.tokensSold);
    }

    function getTotalRaisedETH() external view returns (uint256) {
        return totalRaisedETH;
    }

    function getTotalSoldTokens() external view returns (uint256) {
        return totalSoldTokens;
    }

    // ========== Owner Functions ==========

    function withdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "ETH transfer failed");
    }

    // ========== Internal Functions ==========

    function _calculateClaimable(
        ICOStorage.VestingInfo memory vesting,
        uint256 cliffPeriod,
        uint256 vestingPeriod
    ) internal view returns (uint256) {
        uint256 elapsed = block.timestamp - vesting.startTime;

        uint256 vestedTokens;
        if (elapsed < cliffPeriod) {
            vestedTokens = 0;
        } else if (elapsed >= cliffPeriod + vestingPeriod) {
            vestedTokens = vesting.totalTokens;
        } else {
            uint256 timeAfterCliff = elapsed - cliffPeriod;
            vestedTokens = (vesting.totalTokens * timeAfterCliff) / vestingPeriod;
        }

        return vestedTokens - vesting.claimedTokens;
    }

    function _mintWithCap(address to, uint256 amount) internal {
        require(totalMinted + amount <= TOTAL_SUPPLY, "Exceeds total supply");
        totalMinted += amount;
        _mint(to, amount);
    }
}
