// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Vesting is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    enum Category {
        PreSeed,
        Seed,
        Strategic,
        PublicSale,
        Founders,
        Ecosystem,
        Advisors,
        Treasury,
        Partnerships
    }

    struct VestingInfo {
        uint256 total;
        uint256 claimed;
        uint256 start;
        uint256 cliff;
        uint256 duration;
    }

    IERC20 public immutable token;
    address public ico;
    address public distributor;

    mapping(address => VestingInfo[]) public userVestings;

    event TokensClaimed(address indexed user, uint256 amount);
    event VestingAdded(address indexed user, uint256 amount, uint256 category);

    modifier onlyICoorDistributor() {
        require(
            msg.sender == ico || msg.sender == distributor,
            "Vesting: caller is not ICO or Distributor"
        );
        _;
    }

    constructor(address _token) Ownable(msg.sender) {
        token = IERC20(_token);
    }

    function setICO(address _ico) external onlyOwner {
        require(ico == address(0), "Vesting: ICO already set");
        require(_ico != address(0), "Vesting: zero address");
        ico = _ico;
    }

    function setDistributor(address _distributor) external onlyOwner {
        require(distributor == address(0), "Vesting: Distributor already set");
        require(_distributor != address(0), "Vesting: zero address");
        distributor = _distributor;
    }

    function addVesting(
        address user,
        uint256 amount,
        Category category
    ) external onlyICoorDistributor {
        require(user != address(0), "Vesting: zero address");
        require(amount > 0, "Vesting: zero amount");

        // PublicSale: instant transfer, no vesting
        if (category == Category.PublicSale) {
            token.safeTransfer(user, amount);
            emit VestingAdded(user, amount, uint256(category));
            return;
        }

        // Get cliff and duration based on category
        (uint256 cliff, uint256 duration) = getVestingParams(category);

        userVestings[user].push(
            VestingInfo({
                total: amount,
                claimed: 0,
                start: block.timestamp,
                cliff: cliff,
                duration: duration
            })
        );

        emit VestingAdded(user, amount, uint256(category));
    }

    function getVestingParams(Category category)
        public
        pure
        returns (uint256 cliff, uint256 duration)
    {
        // 1 month = 30 days = 2,592,000 seconds
        uint256 ONE_MONTH = 30 days;
        
        if (category == Category.PreSeed) {
            return (3 * ONE_MONTH, 24 * ONE_MONTH); // 3 months cliff, 24 months duration
        } else if (category == Category.Seed) {
            return (3 * ONE_MONTH, 24 * ONE_MONTH); // 3 months cliff, 24 months duration
        } else if (category == Category.Strategic) {
            return (3 * ONE_MONTH, 24 * ONE_MONTH); // 3 months cliff, 24 months duration
        } else if (category == Category.Founders) {
            return (12 * ONE_MONTH, 24 * ONE_MONTH); // 12 months cliff, 24 months duration
        } else if (category == Category.Ecosystem) {
            return (1 * ONE_MONTH, 24 * ONE_MONTH); // 1 month cliff, 24 months duration
        } else if (category == Category.Advisors) {
            return (12 * ONE_MONTH, 24 * ONE_MONTH); // 12 months cliff, 24 months duration
        } else if (category == Category.Treasury) {
            return (1 * ONE_MONTH, 12 * ONE_MONTH); // 1 month cliff, 12 months duration
        } else if (category == Category.Partnerships) {
            return (3 * ONE_MONTH, 12 * ONE_MONTH); // 3 months cliff, 12 months duration
        }
        revert("Vesting: invalid category");
    }

    function claimableAmount(address user) public view returns (uint256) {
        uint256 totalClaimable = 0;
        uint256 vestingsLength = userVestings[user].length;

        for (uint256 i = 0; i < vestingsLength; i++) {
            VestingInfo memory vesting = userVestings[user][i];
            totalClaimable += _calculateClaimable(vesting);
        }

        return totalClaimable;
    }

    function _calculateClaimable(VestingInfo memory vesting)
        internal
        view
        returns (uint256)
    {
        // If before cliff, nothing is claimable
        if (block.timestamp < vesting.start + vesting.cliff) {
            return 0;
        }

        // Calculate elapsed time after cliff
        uint256 elapsed = block.timestamp - (vesting.start + vesting.cliff);

        // If duration is 0, nothing is vested (shouldn't happen for non-PublicSale)
        if (vesting.duration == 0) {
            return 0;
        }

        // Calculate vested amount (linear)
        uint256 vested = (vesting.total * elapsed) / vesting.duration;

        // Cap at total
        if (vested > vesting.total) {
            vested = vesting.total;
        }

        // Calculate claimable
        uint256 claimable = vested - vesting.claimed;

        return claimable;
    }

    function claimTokens() external nonReentrant {
        uint256 claimable = claimableAmount(msg.sender);
        require(claimable > 0, "Vesting: nothing to claim");

        // Update claimed amounts for all vestings
        uint256 vestingsLength = userVestings[msg.sender].length;
        for (uint256 i = 0; i < vestingsLength; i++) {
            VestingInfo storage vesting = userVestings[msg.sender][i];
            uint256 vestingClaimable = _calculateClaimable(vesting);
            vesting.claimed += vestingClaimable;
        }

        token.safeTransfer(msg.sender, claimable);

        emit TokensClaimed(msg.sender, claimable);
    }
}
