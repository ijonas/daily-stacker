const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");

use(solidity);

describe("Stacker", function () {
  let stacker;
  let signer;
  let tokens;

  beforeEach(async () => {
    const signers = await ethers.getSigners();
    signer = signers[0];
    tokens = ['0xff795577d9ac8bd7d90ee22b6c1703490b6512fd', '0xff795577d9ac8bd7d90ee22b6c1703490b6512fd', '0x4281eCF07378Ee595C564a59048801330f3084eE']; // these are just random addresses
  })

  it("Should deploy DailyStacker", async () => {
    const router = '0x600103d518cc5e8f3319d532eb4e5c268d32e604';
    const Stacker = await ethers.getContractFactory("Stacker");
    stacker = await Stacker.deploy(router, tokens[0]);
    expect(stacker).not.to.be.undefined;
  });

  it("Should be able to top up the ETH balance on the contract", async () => {
    const someEth = ethers.BigNumber.from("" + (0.1 * 10 ** 18));
    expect(await stacker.topup({ value: someEth })).to.emit(stacker, "TopupReceived").withArgs(someEth);
    expect(await stacker.ethBalance()).to.equal(someEth);
  });

  describe("portfolios", () => {
    it("are made up of tokens and percentages", async () => {
      await stacker.setPortfolio(tokens, [30, 30, 40])
    })

    it("should contain at least 1 entry", async () => {
      try {
        await stacker.setPortfolio([], [])
        expect.fail('expecting an error')
      } catch (error) {
        expect(error.message).includes('Specify atleast 1 token & share percentage')
      }
    })

    it("contain equal number of tokens and percentages", async () => {
      try {
        await stacker.setPortfolio(tokens, [50, 50])
        expect.fail('expecting an error')
      } catch (error) {
        expect(error.message).includes('Specify same number of tokens and share percentages')
      }
    })

    it("have share precentages that add up to 100 percent", async () => {
      try {
        await stacker.setPortfolio(tokens, [25, 25, 25])
        expect.fail('expecting an error')
      } catch (error) {
        expect(error.message).includes('Portfolio shares need to add up to 100 percent exactly')
      }
    })
  })
});
