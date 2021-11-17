const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");

use(solidity);

describe("FakeETH", function () {
    let signer;

    this.beforeEach(async () => {
        const signers = await ethers.getSigners();
        signer = signers[0];
    })

    it("Should deploy FakeETH", async function () {
        const FakeETH = await ethers.getContractFactory("FakeETH");
        fakeETH = await FakeETH.deploy();
        expect(fakeETH).not.to.be.undefined;
    });

    it("Should give signer a balance of 1,000,000 FETH", async function () {
        const signerFETHBalance = await fakeETH.balanceOf(signer.address);
        expect(ethers.BigNumber.from(signerFETHBalance._hex).toString()).to.eq('1000000000000000000000000');
    });

});
