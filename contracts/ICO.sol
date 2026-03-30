// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./Vesting.sol";

contract ICO is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Round {
        uint256 tokens;
        uint256 priceUSD; // Price in USD with 18 decimals
        uint256 tokensLeft;
        Vesting.Category category;
    }

    IERC20 public immutable token;
    Vesting public immutable vesting;

    // Fixed ETH/USD rate for demo (3000 USD per ETH)
    uint256 public constant ETH_USD_RATE = 3000 * 10**18;

    // Round index mapping
    uint256 public constant PRE_SEED = 0;
    uint256 public constant SEED = 1;
    uint256 public constant STRATEGIC = 2;
    uint256 public constant PUBLIC = 3;

    Round[] public rounds;

    event TokensPurchased(address indexed user, uint256 amount, uint256 round);

    constructor(address _token, address _vesting) Ownable(msg.sender) {
        token = IERC20(_token);
        vesting = Vesting(_vesting);

        // Initialize rounds
        // PreSeed: 4,500,000 tokens, $0.067 USD
        rounds.push(
            Round({
                tokens: 4_500_000 * 10**18,
                priceUSD: 0.067 * 10**18,
                tokensLeft: 4_500_000 * 10**18,
                category: Vesting.Category.PreSeed
            })
        );

        // Seed: 7,875,000 tokens, $0.089 USD
        rounds.push(
            Round({
                tokens: 7_875_000 * 10**18,
                priceUSD: 0.089 * 10**18,
                tokensLeft: 7_875_000 * 10**18,
                category: Vesting.Category.Seed
            })
        );

        // Strategic: 2,250,000 tokens, $0.111 USD
        rounds.push(
            Round({
                tokens: 2_250_000 * 10**18,
                priceUSD: 0.111 * 10**18,
                tokensLeft: 2_250_000 * 10**18,
                category: Vesting.Category.Strategic
            })
        );

        // Public: 1,875,000 tokens, $0.133 USD
        rounds.push(
            Round({
                tokens: 1_875_000 * 10**18,
                priceUSD: 0.133 * 10**18,
                tokensLeft: 1_875_000 * 10**18,
                category: Vesting.Category.PublicSale
            })
        );
    }

    function buyTokens(uint256 roundIndex) external payable whenNotPaused nonReentrant {
        require(roundIndex < rounds.length, "ICO: invalid round");
        Round storage round = rounds[roundIndex];

        // Calculate tokens to purchase based on ETH sent
        // Formula: tokens = (msg.value * ETH_USD_RATE) / priceUSD
        uint256 tokensToBuy = (msg.value * ETH_USD_RATE) / round.priceUSD;

        require(tokensToBuy > 0, "ICO: zero tokens");
        require(
            tokensToBuy <= round.tokensLeft,
            "ICO: not enough tokens in round"
        );

        // Update tokens left
        round.tokensLeft -= tokensToBuy;

        // Add vesting for user
        vesting.addVesting(msg.sender, tokensToBuy, round.category);

        emit TokensPurchased(msg.sender, tokensToBuy, roundIndex);
    }

    function getRoundInfo(uint256 roundIndex)
        external
        view
        returns (
            uint256 tokens,
            uint256 priceUSD,
            uint256 tokensLeft,
            uint256 category
        )
    {
        require(roundIndex < rounds.length, "ICO: invalid round");
        Round storage round = rounds[roundIndex];
        return (
            round.tokens,
            round.priceUSD,
            round.tokensLeft,
            uint256(round.category)
        );
    }

    function getETHPrice(uint256 ethAmount) external pure returns (uint256) {
        return (ethAmount * ETH_USD_RATE) / 10**18;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Withdraw ETH collected from token sales
    function withdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "ICO: no ETH to withdraw");
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "ICO: ETH transfer failed");
    }

    // Allow contract to receive ETH
    receive() external payable {}
}
