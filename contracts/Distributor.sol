// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Vesting.sol";

contract Distributor is Ownable {
    Vesting public immutable vesting;

    // Allocation amounts
    uint256 public constant FOUNDERS_AMOUNT = 27_000_000 * 10**18;
    uint256 public constant ECOSYSTEM_AMOUNT = 45_000_000 * 10**18;
    uint256 public constant ADVISORS_AMOUNT = 5_625_000 * 10**18;
    uint256 public constant TREASURY_AMOUNT = 90_375_000 * 10**18;
    uint256 public constant PARTNERSHIPS_AMOUNT = 40_500_000 * 10**18;

    // Track if allocations have been made
    mapping(address => bool) public foundersAllocated;
    mapping(address => bool) public ecosystemAllocated;
    mapping(address => bool) public advisorsAllocated;
    mapping(address => bool) public treasuryAllocated;
    mapping(address => bool) public partnershipsAllocated;

    constructor(address _vesting) Ownable(msg.sender) {
        vesting = Vesting(_vesting);
    }

    function allocateFounders(address recipient) external onlyOwner {
        require(recipient != address(0), "Distributor: zero address");
        require(!foundersAllocated[recipient], "Distributor: already allocated");
        foundersAllocated[recipient] = true;
        vesting.addVesting(recipient, FOUNDERS_AMOUNT, Vesting.Category.Founders);
    }

    function allocateEcosystem(address recipient) external onlyOwner {
        require(recipient != address(0), "Distributor: zero address");
        require(!ecosystemAllocated[recipient], "Distributor: already allocated");
        ecosystemAllocated[recipient] = true;
        vesting.addVesting(recipient, ECOSYSTEM_AMOUNT, Vesting.Category.Ecosystem);
    }

    function allocateAdvisors(address recipient) external onlyOwner {
        require(recipient != address(0), "Distributor: zero address");
        require(!advisorsAllocated[recipient], "Distributor: already allocated");
        advisorsAllocated[recipient] = true;
        vesting.addVesting(recipient, ADVISORS_AMOUNT, Vesting.Category.Advisors);
    }

    function allocateTreasury(address recipient) external onlyOwner {
        require(recipient != address(0), "Distributor: zero address");
        require(!treasuryAllocated[recipient], "Distributor: already allocated");
        treasuryAllocated[recipient] = true;
        vesting.addVesting(recipient, TREASURY_AMOUNT, Vesting.Category.Treasury);
    }

    function allocatePartnerships(address recipient) external onlyOwner {
        require(recipient != address(0), "Distributor: zero address");
        require(!partnershipsAllocated[recipient], "Distributor: already allocated");
        partnershipsAllocated[recipient] = true;
        vesting.addVesting(recipient, PARTNERSHIPS_AMOUNT, Vesting.Category.Partnerships);
    }

    // Batch allocation functions
    function allocateFoundersBatch(address[] calldata recipients) external onlyOwner {
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Distributor: zero address");
            require(!foundersAllocated[recipients[i]], "Distributor: already allocated");
            foundersAllocated[recipients[i]] = true;
            vesting.addVesting(recipients[i], FOUNDERS_AMOUNT, Vesting.Category.Founders);
        }
    }

    function allocateEcosystemBatch(address[] calldata recipients) external onlyOwner {
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Distributor: zero address");
            require(!ecosystemAllocated[recipients[i]], "Distributor: already allocated");
            ecosystemAllocated[recipients[i]] = true;
            vesting.addVesting(recipients[i], ECOSYSTEM_AMOUNT, Vesting.Category.Ecosystem);
        }
    }

    function allocateAdvisorsBatch(address[] calldata recipients) external onlyOwner {
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Distributor: zero address");
            require(!advisorsAllocated[recipients[i]], "Distributor: already allocated");
            advisorsAllocated[recipients[i]] = true;
            vesting.addVesting(recipients[i], ADVISORS_AMOUNT, Vesting.Category.Advisors);
        }
    }

    function allocateTreasuryBatch(address[] calldata recipients) external onlyOwner {
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Distributor: zero address");
            require(!treasuryAllocated[recipients[i]], "Distributor: already allocated");
            treasuryAllocated[recipients[i]] = true;
            vesting.addVesting(recipients[i], TREASURY_AMOUNT, Vesting.Category.Treasury);
        }
    }

    function allocatePartnershipsBatch(address[] calldata recipients) external onlyOwner {
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Distributor: zero address");
            require(!partnershipsAllocated[recipients[i]], "Distributor: already allocated");
            partnershipsAllocated[recipients[i]] = true;
            vesting.addVesting(recipients[i], PARTNERSHIPS_AMOUNT, Vesting.Category.Partnerships);
        }
    }
}
