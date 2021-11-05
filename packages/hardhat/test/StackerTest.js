const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");

use(solidity);

describe("Stacker Dapp", function () {
  let stacker;
  let signer;

  // quick fix to let gas reporter fetch data from gas station & coinmarketcap
  before((done) => {
    setTimeout(done, 2000);
  });

  describe("DailyStacker", function () {

    beforeEach( async () => {
      const signers = await ethers.getSigners();
      signer = signers[0];  
    })

    it("Should deploy DailyStacker", async function () {
      const Stacker = await ethers.getContractFactory("Stacker");

      stacker = await Stacker.deploy();
      expect(stacker).not.to.be.undefined;
    });

    describe("topup()", function () {
      it("Should be able to top up the ETH balance on the contract", async function () {
        const someEth = ethers.BigNumber.from(""+(0.1 * 10 ** 18));
        expect(await stacker.topup({value: someEth})).to.emit(stacker, "TopupReceived").withArgs(someEth);
        expect(await stacker.ethBalance()).to.equal(someEth);
      });

      // Uncomment the event and emit lines in YourContract.sol to make this test pass

      /*it("Should emit a SetPurpose event ", async function () {
        const [owner] = await ethers.getSigners();

        const newPurpose = "Another Test Purpose";

        expect(await myContract.setPurpose(newPurpose)).to.
          emit(myContract, "SetPurpose").
            withArgs(owner.address, newPurpose);
      });*/
    });
  });
});
