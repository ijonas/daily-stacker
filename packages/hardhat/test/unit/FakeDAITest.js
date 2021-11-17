const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");

use(solidity);

describe("FakeDAI", function () {
    let signer;

    this.beforeEach(async () => {
        const signers = await ethers.getSigners();
        signer = signers[0];
    })

    it("Should deploy FakeDAI", async function () {
        const FakeDAI = await ethers.getContractFactory("FakeDAI");
        fakeDAI = await FakeDAI.deploy();
        expect(fakeDAI).not.to.be.undefined;
    });

    it("Should give signer a balance of 1,000,000 FDAI", async function () {
        const signerFDAIBalance = await fakeDAI.balanceOf(signer.address);
        expect(ethers.BigNumber.from(signerFDAIBalance._hex).toString()).to.eq('1000000000000000000000000');
    });

});
