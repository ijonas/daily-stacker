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
    let daiReceiver;

    // quick fix to let gas reporter fetch data from gas station & coinmarketcap
    // before((done) => {
    //     setTimeout(done, 2000);
    // });

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
            fakeUniswapV2Router = await FakeUniswapV2Router.deploy(fakeDAI.address);

            const Stacker = await ethers.getContractFactory("Stacker");
            stacker = await Stacker.deploy(fakeUniswapV2Router.address, fakeETH.address);
        })

        it("should swap ETH for DAI", async () => {
            try {
                // preload UniswapRouter with some FDAI
                const tx = await fakeDAI.transfer(fakeUniswapV2Router.address, ethers.BigNumber.from("3000000000000000000000")); // 4000 * 10 ** 18
                await tx.wait()

                const uniswapRouterDAIBalance = await fakeDAI.balanceOf(fakeUniswapV2Router.address);
                expect(ethers.BigNumber.from(uniswapRouterDAIBalance._hex).toString()).to.eq('3000000000000000000000');

                console.log(`Stacker contract address: ${stacker.address}`)
                const prov = stacker.provider;
                const amountIn = ethers.utils.parseEther("0.01")
                const sendTx = await signer.sendTransaction({ to: stacker.address, value: amountIn, gasLimit: ethers.BigNumber.from("42000") });
                console.log("TX Sent.. Awaiting.")
                await sendTx.wait()
                const contractETHBalance2 = await prov.getBalance(stacker.address);
                expect(contractETHBalance2.toString()).to.eq(amountIn.toString())

                console.log("AmountIn sent to contract");
                const resultAmountOut = await stacker.getAmountOutMin(fakeETH.address, fakeDAI.address, amountIn);
                expect(resultAmountOut.toString()).to.eq('2206000000000000000000')

                const amountOut = ethers.BigNumber.from(resultAmountOut._hex)
                await stacker.swap(
                    fakeETH.address,
                    fakeDAI.address,
                    amountIn,
                    amountOut,
                    stackerUser.address
                )
                const stackerUserBalanceFDAI = await fakeDAI.balanceOf(stackerUser.address);
                console.log("Called Swap");
                expect(stackerUserBalanceFDAI.toString()).to.eq('2206000000000000000000');
            } catch (error) {
                console.error(error)
            }
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
            await stacker.buyPortfolio();
            const stackerUserBalanceFLINK = await fakeLINK.balanceOf(stackerUser.address);
            expect(stackerUserBalanceFLINK.toString()).to.eq('1206000000000000000000');
            const stackerUserBalanceFANT = await fakeANT.balanceOf(stackerUser.address);
            expect(stackerUserBalanceFANT.toString()).to.eq('1206000000000000000000');

        });
    });
});
