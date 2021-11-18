const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const BN = require('bn.js');
const { solidity } = require("ethereum-waffle");

use(require('chai-bn')(BN));
use(solidity);

describe.only("Stacker Dapp", function () {
    let stacker;
    let signer;
    let fakeDAI;
    let fakeETH;
    let fakeLINK;
    let fakeANT;
    let fakeUniswapV2Router;
    let stackerUser;
    let amountIn;

    describe("DailyStacker", function () {
        before(async () => {
            const signers = await ethers.getSigners();
            signer = signers[0];
            stackerUser = signers[1];

            const FakeDAI = await ethers.getContractFactory("FakeDAI");
            fakeDAI = await FakeDAI.deploy();

            const FakeETH = await ethers.getContractFactory("FakeETH");
            fakeETH = await FakeETH.deploy();

            const FakeLINK = await ethers.getContractFactory("FakeLINK");
            fakeLINK = await FakeLINK.deploy();

            const FakeANT = await ethers.getContractFactory("FakeANT");
            fakeANT = await FakeANT.deploy();

            const FakeUniswapV2Router = await ethers.getContractFactory("FakeUniswapV2Router");
            fakeUniswapV2Router = await FakeUniswapV2Router.deploy();

            const Stacker = await ethers.getContractFactory("Stacker");
            stacker = await Stacker.deploy(fakeUniswapV2Router.address, fakeETH.address);

            console.log(`Stacker contract address: ${stacker.address}`)
            amountIn = ethers.utils.parseEther("0.01")
            const sendTx = await signer.sendTransaction({ to: stacker.address, value: amountIn, gasLimit: ethers.BigNumber.from("42000") });
            await sendTx.wait()

        })

        it("should swap ETH for DAI", async () => {
            // preload UniswapRouter with some FDAI
            const tx = await fakeDAI.transfer(fakeUniswapV2Router.address, ethers.BigNumber.from("3000000000000000000000")); // 3000 * 10 ** 18
            await tx.wait()

            const uniswapRouterDAIBalance = await fakeDAI.balanceOf(fakeUniswapV2Router.address);
            expect(ethers.BigNumber.from(uniswapRouterDAIBalance._hex).toString()).to.eq('3000000000000000000000');

            const prov = stacker.provider;
            const contractETHBalance2 = await prov.getBalance(stacker.address);
            expect(contractETHBalance2.toString()).to.eq(amountIn.toString())

            const resultAmountOut = await stacker.getAmountOutMin(fakeETH.address, fakeDAI.address, amountIn);
            expect(resultAmountOut.toString()).to.eq('22060000000000000000')

            const amountOut = ethers.BigNumber.from(resultAmountOut._hex)
            await stacker.swap(
                fakeETH.address,
                fakeDAI.address,
                amountIn,
                amountOut,
                stackerUser.address
            )
            const stackerUserBalanceFDAI = await fakeDAI.balanceOf(stackerUser.address);
            expect(stackerUserBalanceFDAI.toString()).to.eq('22060000000000000000');
        })

        it("allow user to setup a portfolio", async () => {
            await stacker.setPortfolio([fakeLINK.address, fakeANT.address], [25, 75]);
            const portfolioToken1 = await stacker.portfolio(0);
            expect(portfolioToken1.token).to.eq(fakeLINK.address)
            expect(portfolioToken1.percentage).to.eq(25)
            const portfolioToken2 = await stacker.portfolio(1);
            expect(portfolioToken2.token).to.eq(fakeANT.address)
            expect(portfolioToken2.percentage).to.eq(75)
        })

        it("buys tokens according to the portfolio setup", async () => {

            // preload UniswapRouter with some FDAI
            const tx1 = await fakeLINK.transfer(fakeUniswapV2Router.address, ethers.BigNumber.from("3000000000000000000000")); // 3000 * 10 ** 18
            await tx1.wait()

            const tx2 = await fakeANT.transfer(fakeUniswapV2Router.address, ethers.BigNumber.from("3000000000000000000000")); // 3000 * 10 ** 18
            await tx2.wait()

            // verify balances
            const uniswapRouterLINKBalance = await fakeLINK.balanceOf(fakeUniswapV2Router.address);
            expect(ethers.BigNumber.from(uniswapRouterLINKBalance._hex).toString()).to.eq('3000000000000000000000');

            const uniswapRouterANTBalance = await fakeANT.balanceOf(fakeUniswapV2Router.address);
            expect(ethers.BigNumber.from(uniswapRouterANTBalance._hex).toString()).to.eq('3000000000000000000000');

            // setup portfolio
            await stacker.setPortfolio([fakeLINK.address, fakeANT.address], [25, 75]);

            // make daily purchase of portfolio
            await stacker.buyPortfolio(stackerUser.address);

            const stackerUserBalanceFLINK = await fakeLINK.balanceOf(stackerUser.address);
            expect(stackerUserBalanceFLINK.toString()).to.eq('183833333333314950');
            const stackerUserBalanceFANT = await fakeANT.balanceOf(stackerUser.address);
            expect(stackerUserBalanceFANT.toString()).to.eq('551499999999944850');

        });
    });
});
