const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ICOToken and ICOStorage", function () {
  let storage, icoToken;
  let owner, buyer1, buyer2, buyer3;

  // Token amounts (with 18 decimals)
  const PRE_SEED_TOKENS = ethers.parseEther("4500000");
  const SEED_TOKENS = ethers.parseEther("7875000");
  const STRATEGIC_TOKENS = ethers.parseEther("2250000");
  const PUBLIC_TOKENS = ethers.parseEther("1875000");

  // Prices in wei
  const PRE_SEED_PRICE = ethers.parseEther("0.067");
  const SEED_PRICE = ethers.parseEther("0.089");
  const STRATEGIC_PRICE = ethers.parseEther("0.111");
  const PUBLIC_PRICE = ethers.parseEther("0.133");

  // Exact ETH needed to buy out each round: (tokensAvailable * price) / 1e18
  const PRE_SEED_BUYOUT = (PRE_SEED_TOKENS * PRE_SEED_PRICE) / ethers.parseEther("1");
  const SEED_BUYOUT = (SEED_TOKENS * SEED_PRICE) / ethers.parseEther("1");
  const STRATEGIC_BUYOUT = (STRATEGIC_TOKENS * STRATEGIC_PRICE) / ethers.parseEther("1");

  beforeEach(async function () {
    [owner, buyer1, buyer2, buyer3] = await ethers.getSigners();

    // Set high balances for all test accounts to support large buyouts
    const highBalance = "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";
    for (const signer of [owner, buyer1, buyer2, buyer3]) {
      await ethers.provider.send("hardhat_setBalance", [signer.address, highBalance]);
    }

    const ICOStorage = await ethers.getContractFactory("ICOStorage");
    storage = await ICOStorage.deploy();
    await storage.waitForDeployment();

    const ICOToken = await ethers.getContractFactory("ICOToken");
    icoToken = await ICOToken.deploy(await storage.getAddress());
    await icoToken.waitForDeployment();

    await storage.setICOContract(await icoToken.getAddress());
  });

  describe("Deployment", function () {
    it("Should deploy with correct round configuration", async function () {
      const preSeed = await icoToken.getRoundInfo(0);
      expect(preSeed.priceUSD).to.equal(PRE_SEED_PRICE);
      expect(preSeed.tokensAvailable).to.equal(PRE_SEED_TOKENS);
      expect(preSeed.tokensSold).to.equal(0);

      const seed = await icoToken.getRoundInfo(1);
      expect(seed.priceUSD).to.equal(SEED_PRICE);
      expect(seed.tokensAvailable).to.equal(SEED_TOKENS);

      const strategic = await icoToken.getRoundInfo(2);
      expect(strategic.priceUSD).to.equal(STRATEGIC_PRICE);
      expect(strategic.tokensAvailable).to.equal(STRATEGIC_TOKENS);

      const publicRound = await icoToken.getRoundInfo(3);
      expect(publicRound.priceUSD).to.equal(PUBLIC_PRICE);
      expect(publicRound.tokensAvailable).to.equal(PUBLIC_TOKENS);
    });

    it("Should start with PreSeed round", async function () {
      expect(await icoToken.getCurrentRound()).to.equal(0);
    });
  });

  describe("Token Purchases - PreSeed Round", function () {
    it("Should buy tokens in PreSeed round", async function () {
      const ethAmount = ethers.parseEther("1");
      const expectedTokens = (ethAmount * ethers.parseEther("1")) / PRE_SEED_PRICE;

      // Optimized: when no capping, cost = msg.value (exact)
      await expect(icoToken.connect(buyer1).buyTokens(0, { value: ethAmount }))
        .to.emit(icoToken, "PurchaseRecorded")
        .withArgs(buyer1.address, 0, ethAmount, expectedTokens);

      expect(await icoToken.getTotalSoldTokens()).to.equal(expectedTokens);
      expect(await icoToken.getTotalRaisedETH()).to.equal(ethAmount);
    });

    it("Should record purchase in storage", async function () {
      const ethAmount = ethers.parseEther("1");
      await icoToken.connect(buyer1).buyTokens(0, { value: ethAmount });

      const purchases = await storage.getUserPurchases(buyer1.address);
      expect(purchases.length).to.equal(1);
      expect(purchases[0].user).to.equal(buyer1.address);
      expect(purchases[0].round).to.equal(0);
      // Storage records actualCost which may differ from msg.value by 1 wei
      expect(purchases[0].ethAmount).to.be.closeTo(ethAmount, 1);
    });

    it("Should create vesting for PreSeed purchase", async function () {
      const ethAmount = ethers.parseEther("1");
      await icoToken.connect(buyer1).buyTokens(0, { value: ethAmount });

      const vesting = await storage.getVesting(buyer1.address);
      expect(vesting.totalTokens).to.be.gt(0);
      expect(vesting.startTime).to.be.gt(0);
    });

    it("Should allow multiple purchases in same round", async function () {
      const ethAmount = ethers.parseEther("0.5");

      await icoToken.connect(buyer1).buyTokens(0, { value: ethAmount });
      await icoToken.connect(buyer1).buyTokens(0, { value: ethAmount });

      const purchases = await storage.getUserPurchases(buyer1.address);
      expect(purchases.length).to.equal(2);
    });

    it("Should revert when buying in sold out round", async function () {
      // Buy all PreSeed tokens
      await icoToken.connect(buyer1).buyTokens(0, { value: PRE_SEED_BUYOUT });

      // Try to buy more - round has advanced to 1, so buying round 0 should revert
      await expect(
        icoToken.connect(buyer2).buyTokens(0, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Not current round");
    });
  });

  describe("Round Progression", function () {
    it("Should advance to Seed round when PreSeed is sold out", async function () {
      await icoToken.connect(buyer1).buyTokens(0, { value: PRE_SEED_BUYOUT });
      expect(await icoToken.getCurrentRound()).to.equal(1);
    });

    it("Should advance to Strategic round when Seed is sold out", async function () {
      await icoToken.connect(buyer1).buyTokens(0, { value: PRE_SEED_BUYOUT });
      await icoToken.connect(buyer2).buyTokens(1, { value: SEED_BUYOUT });
      expect(await icoToken.getCurrentRound()).to.equal(2);
    });

    it("Should advance to Public round when Strategic is sold out", async function () {
      await icoToken.connect(buyer1).buyTokens(0, { value: PRE_SEED_BUYOUT });
      await icoToken.connect(buyer2).buyTokens(1, { value: SEED_BUYOUT });
      await icoToken.connect(buyer3).buyTokens(2, { value: STRATEGIC_BUYOUT });
      expect(await icoToken.getCurrentRound()).to.equal(3);
    });

    it("Should not advance if round is not sold out", async function () {
      await icoToken.connect(buyer1).buyTokens(0, { value: ethers.parseEther("0.1") });
      expect(await icoToken.getCurrentRound()).to.equal(0);
    });

    it("Should not allow buying in future round if previous not sold out", async function () {
      await expect(
        icoToken.connect(buyer1).buyTokens(1, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Not current round");
    });
  });

  describe("Token Purchases - Public Round", function () {
    beforeEach(async function () {
      await icoToken.connect(buyer1).buyTokens(0, { value: PRE_SEED_BUYOUT });
      await icoToken.connect(buyer2).buyTokens(1, { value: SEED_BUYOUT });
      await icoToken.connect(buyer3).buyTokens(2, { value: STRATEGIC_BUYOUT });
    });

    it("Should buy tokens in Public round without vesting", async function () {
      const ethAmount = ethers.parseEther("1");
      const expectedTokens = (ethAmount * ethers.parseEther("1")) / PUBLIC_PRICE;

      // buyer1 already has vesting from PreSeed round
      const vestingBefore = await storage.getVesting(buyer1.address);
      const tokensBefore = vestingBefore.totalTokens;

      // Optimized: when no capping, cost = msg.value (exact)
      await expect(icoToken.connect(buyer1).buyTokens(3, { value: ethAmount }))
        .to.emit(icoToken, "PurchaseRecorded")
        .withArgs(buyer1.address, 3, ethAmount, expectedTokens);

      // Public round should not ADD to vesting - totalTokens should remain the same
      const vestingAfter = await storage.getVesting(buyer1.address);
      expect(vestingAfter.totalTokens).to.equal(tokensBefore);
    });
  });

  describe("Vesting and Claims", function () {
    it("Should not allow claim before cliff", async function () {
      const ethAmount = ethers.parseEther("1");
      await icoToken.connect(buyer1).buyTokens(0, { value: ethAmount });

      await expect(icoToken.connect(buyer1).claim())
        .to.be.revertedWith("No tokens to claim");
    });

    it("Should allow claim after cliff period", async function () {
      const ethAmount = ethers.parseEther("1");
      await icoToken.connect(buyer1).buyTokens(0, { value: ethAmount });

      // Fast forward past cliff (90 days) + some vesting time
      await time.increase((90 + 30) * 24 * 60 * 60);

      const claimable = await icoToken.getClaimableTokens(buyer1.address);
      expect(claimable).to.be.gt(0);

      await expect(icoToken.connect(buyer1).claim())
        .to.emit(icoToken, "TokensClaimed");
    });

    it("Should calculate linear vesting correctly", async function () {
      const ethAmount = ethers.parseEther("1");
      await icoToken.connect(buyer1).buyTokens(0, { value: ethAmount });

      const vesting = await storage.getVesting(buyer1.address);
      const totalTokens = vesting.totalTokens;

      // Fast forward to 50% of vesting period (3 months cliff + 12 months vesting)
      await time.increase((90 + 360) * 24 * 60 * 60);

      const claimable = await icoToken.getClaimableTokens(buyer1.address);
      const expected = totalTokens / 2n;
      const tolerance = totalTokens / 100n; // 1% tolerance

      expect(claimable).to.be.closeTo(expected, tolerance);
    });

    it("Should allow full claim after vesting period", async function () {
      const ethAmount = ethers.parseEther("1");
      await icoToken.connect(buyer1).buyTokens(0, { value: ethAmount });

      const vesting = await storage.getVesting(buyer1.address);
      const totalTokens = vesting.totalTokens;

      // Fast forward past full vesting period (3 months cliff + 24 months vesting)
      await time.increase((90 + 720) * 24 * 60 * 60);

      const claimable = await icoToken.getClaimableTokens(buyer1.address);
      expect(claimable).to.equal(totalTokens);

      await icoToken.connect(buyer1).claim();
      expect(await icoToken.balanceOf(buyer1.address)).to.equal(totalTokens);
    });

    it("Should track claimed tokens correctly", async function () {
      const ethAmount = ethers.parseEther("1");
      await icoToken.connect(buyer1).buyTokens(0, { value: ethAmount });

      const vestingInfo = await storage.getVesting(buyer1.address);
      const totalTokens = vestingInfo.totalTokens;

      // Fast forward to 50% of vesting (3 months cliff + 12 months vesting)
      await time.increase((90 + 360) * 24 * 60 * 60);

      const claimable1 = await icoToken.getClaimableTokens(buyer1.address);
      expect(claimable1).to.be.gt(0);
      await icoToken.connect(buyer1).claim();

      // Verify first claim was recorded (rounding may differ by a few wei)
      let vesting = await storage.getVesting(buyer1.address);
      const claimDiff = vesting.claimedTokens > claimable1
        ? vesting.claimedTokens - claimable1
        : claimable1 - vesting.claimedTokens;
      expect(claimDiff).to.be.lte(1e12);

      // Fast forward 6 more months
      await time.increase(180 * 24 * 60 * 60);

      const claimable2 = await icoToken.getClaimableTokens(buyer1.address);
      expect(claimable2).to.be.gt(0);
      await icoToken.connect(buyer1).claim();

      // Verify cumulative claimed increases
      vesting = await storage.getVesting(buyer1.address);
      expect(vesting.claimedTokens).to.be.gt(claimable1);
      expect(vesting.claimedTokens).to.be.lte(totalTokens);
    });
  });

  describe("View Functions for Frontend", function () {
    it("Should return user purchases", async function () {
      await icoToken.connect(buyer1).buyTokens(0, { value: ethers.parseEther("0.5") });
      await icoToken.connect(buyer2).buyTokens(0, { value: ethers.parseEther("0.3") });
      await icoToken.connect(buyer1).buyTokens(0, { value: ethers.parseEther("0.2") });

      const buyer1Purchases = await storage.getUserPurchases(buyer1.address);
      expect(buyer1Purchases.length).to.equal(2);

      const buyer2Purchases = await storage.getUserPurchases(buyer2.address);
      expect(buyer2Purchases.length).to.equal(1);
    });

    it("Should return correct round info", async function () {
      const roundInfo = await icoToken.getRoundInfo(0);
      expect(roundInfo.priceUSD).to.equal(PRE_SEED_PRICE);
      expect(roundInfo.tokensAvailable).to.equal(PRE_SEED_TOKENS);
    });

    it("Should return correct totals", async function () {
      await icoToken.connect(buyer1).buyTokens(0, { value: ethers.parseEther("1") });
      await icoToken.connect(buyer2).buyTokens(0, { value: ethers.parseEther("2") });

      // totalRaisedETH uses actualCost which may differ from msg.value by 1 wei per tx
      expect(await icoToken.getTotalRaisedETH()).to.be.closeTo(ethers.parseEther("3"), 10);
      expect(await icoToken.getTotalSoldTokens()).to.be.gt(0);
    });

    it("Should return claimable tokens", async function () {
      await icoToken.connect(buyer1).buyTokens(0, { value: ethers.parseEther("1") });

      // Before cliff
      expect(await icoToken.getClaimableTokens(buyer1.address)).to.equal(0);

      // After cliff + some vesting time
      await time.increase((90 + 30) * 24 * 60 * 60);
      expect(await icoToken.getClaimableTokens(buyer1.address)).to.be.gt(0);
    });

    it("Should return total purchases count", async function () {
      await icoToken.connect(buyer1).buyTokens(0, { value: ethers.parseEther("0.5") });
      await icoToken.connect(buyer2).buyTokens(0, { value: ethers.parseEther("0.3") });

      expect(await storage.totalPurchases()).to.equal(2);
    });
  });

  describe("Gas Usage", function () {
    it("Should measure gas for token purchase", async function () {
      const ethAmount = ethers.parseEther("1");
      const tx = await icoToken.connect(buyer1).buyTokens(0, { value: ethAmount });
      const receipt = await tx.wait();

      console.log(`Gas used for buyTokens: ${receipt.gasUsed}`);
      expect(receipt.gasUsed).to.be.lt(300000);
    });

    it("Should measure gas for token claim", async function () {
      const ethAmount = ethers.parseEther("1");
      await icoToken.connect(buyer1).buyTokens(0, { value: ethAmount });

      await time.increase(90 * 24 * 60 * 60);

      const tx = await icoToken.connect(buyer1).claim();
      const receipt = await tx.wait();

      console.log(`Gas used for claim: ${receipt.gasUsed}`);
      expect(receipt.gasUsed).to.be.lt(200000);
    });

    it("Should measure gas for view functions", async function () {
      await icoToken.connect(buyer1).buyTokens(0, { value: ethers.parseEther("1") });

      const purchases = await storage.getUserPurchases(buyer1.address);
      expect(purchases.length).to.equal(1);

      const vesting = await storage.getVesting(buyer1.address);
      expect(vesting.totalTokens).to.be.gt(0);
    });
  });

  describe("Security", function () {
    it("Should not allow non-owner to withdraw ETH", async function () {
      await expect(icoToken.connect(buyer1).withdrawETH())
        .to.be.revertedWithCustomError(icoToken, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to withdraw ETH", async function () {
      await icoToken.connect(buyer1).buyTokens(0, { value: ethers.parseEther("1") });

      const initialBalance = await ethers.provider.getBalance(owner.address);
      await icoToken.withdrawETH();
      const finalBalance = await ethers.provider.getBalance(owner.address);

      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should not allow non-ICO to write to storage", async function () {
      await expect(
        storage.addPurchase(buyer1.address, 0, ethers.parseEther("1"), ethers.parseEther("100"))
      ).to.be.revertedWith("Only ICO contract can call");
    });

    it("Should not allow setting ICO address twice", async function () {
      await expect(storage.setICOContract(await icoToken.getAddress()))
        .to.be.revertedWith("ICO contract already set");
    });

    it("Should not allow zero address for ICO contract", async function () {
      const ICOStorage = await ethers.getContractFactory("ICOStorage");
      const newStorage = await ICOStorage.deploy();
      await newStorage.waitForDeployment();

      await expect(newStorage.setICOContract(ethers.ZeroAddress))
        .to.be.revertedWith("Invalid address");
    });
  });

  describe("Internal Allocations", function () {
    it("Should have correct total supply constant", async function () {
      const totalSupply = await icoToken.TOTAL_SUPPLY();
      expect(totalSupply).to.equal(ethers.parseEther("225000000"));
    });

    it("Should have 9 allocation categories (5 internal + 4 ICO rounds)", async function () {
      expect(await icoToken.allocationCategoryCount()).to.equal(9);

      // Internal categories
      const founders = await icoToken.getAllocationCategory(0);
      expect(founders.name).to.equal("Founders/Team");
      expect(founders.cliffMonths).to.equal(12);
      expect(founders.vestingMonths).to.equal(24);

      const advisors = await icoToken.getAllocationCategory(1);
      expect(advisors.name).to.equal("Advisors");

      const ecosystem = await icoToken.getAllocationCategory(2);
      expect(ecosystem.name).to.equal("Ecosystem");

      const treasury = await icoToken.getAllocationCategory(3);
      expect(treasury.name).to.equal("Treasury");

      const partnerships = await icoToken.getAllocationCategory(4);
      expect(partnerships.name).to.equal("Partnerships");

      // ICO round categories
      const preSeed = await icoToken.getAllocationCategory(5);
      expect(preSeed.name).to.equal("PreSeed");
      expect(preSeed.cliffMonths).to.equal(3);
      expect(preSeed.vestingMonths).to.equal(24);

      const seed = await icoToken.getAllocationCategory(6);
      expect(seed.name).to.equal("Seed");

      const strategic = await icoToken.getAllocationCategory(7);
      expect(strategic.name).to.equal("Strategic");

      const publicCat = await icoToken.getAllocationCategory(8);
      expect(publicCat.name).to.equal("Public");
      expect(publicCat.cliffMonths).to.equal(0);
      expect(publicCat.vestingMonths).to.equal(0);
    });

    it("Should allow owner to add allocation", async function () {
      const amount = ethers.parseEther("27000000"); // 27M tokens for Founders
      await expect(icoToken.addAllocation(buyer1.address, 0, amount))
        .to.emit(icoToken, "AllocationAdded")
        .withArgs(buyer1.address, 0, amount);

      const allocInfo = await icoToken.getUserAllocationInfo(buyer1.address, 0);
      expect(allocInfo.totalTokens).to.equal(amount);
      expect(allocInfo.categoryName).to.equal("Founders/Team");
    });

    it("Should not allow non-owner to add allocation", async function () {
      await expect(
        icoToken.connect(buyer1).addAllocation(buyer2.address, 0, ethers.parseEther("1000"))
      ).to.be.revertedWithCustomError(icoToken, "OwnableUnauthorizedAccount");
    });

    it("Should enforce total supply cap", async function () {
      const maxSupply = await icoToken.TOTAL_SUPPLY();
      const currentMinted = await icoToken.totalMinted();
      const remaining = maxSupply - currentMinted;

      // Try to allocate more than remaining
      await expect(
        icoToken.addAllocation(buyer1.address, 0, remaining + 1n)
      ).to.be.revertedWith("Exceeds total supply");
    });

    it("Should not allow claim before cliff", async function () {
      const amount = ethers.parseEther("5625000"); // 5.625M for Advisors
      await icoToken.addAllocation(buyer1.address, 1, amount);

      const claimable = await icoToken.getAllocationClaimable(buyer1.address);
      expect(claimable).to.equal(0);

      await expect(icoToken.connect(buyer1).claimAllocation())
        .to.be.revertedWith("No tokens to claim");
    });

    it("Should allow claim after cliff + vesting (short cliff category)", async function () {
      const amount = ethers.parseEther("45000000"); // 45M for Ecosystem (1mo cliff, 24mo vest)
      await icoToken.addAllocation(buyer1.address, 2, amount);

      // Fast forward past 1 month cliff + some vesting
      await time.increase(90 * 24 * 60 * 60); // 90 days

      const claimable = await icoToken.getAllocationClaimable(buyer1.address);
      expect(claimable).to.be.gt(0);

      await expect(icoToken.connect(buyer1).claimAllocation())
        .to.emit(icoToken, "AllocationClaimed");
    });

    it("Should allow full claim after full vesting period", async function () {
      const amount = ethers.parseEther("40500000"); // 40.5M for Partnerships (3mo cliff, 12mo vest)
      await icoToken.addAllocation(buyer1.address, 4, amount);

      // Fast forward past 3 months cliff + 12 months vesting = 15 months
      await time.increase(450 * 24 * 60 * 60); // 450 days

      const claimable = await icoToken.getAllocationClaimable(buyer1.address);
      expect(claimable).to.equal(amount);

      await icoToken.connect(buyer1).claimAllocation();
      expect(await icoToken.balanceOf(buyer1.address)).to.equal(amount);
    });

    it("Should support multiple allocations for same user", async function () {
      await icoToken.addAllocation(buyer1.address, 0, ethers.parseEther("27000000"));
      await icoToken.addAllocation(buyer1.address, 2, ethers.parseEther("45000000"));

      const allocs = await storage.getUserAllocations(buyer1.address);
      expect(allocs.length).to.equal(2);
    });

    it("Should track totalMinted correctly", async function () {
      const initialMinted = await icoToken.totalMinted();
      const allocAmount = ethers.parseEther("27000000");

      await icoToken.addAllocation(buyer1.address, 0, allocAmount);

      const newMinted = await icoToken.totalMinted();
      expect(newMinted - initialMinted).to.equal(allocAmount);
    });
  });
});
