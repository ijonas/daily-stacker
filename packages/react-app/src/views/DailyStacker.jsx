import { SyncOutlined } from "@ant-design/icons";
import { utils } from "ethers";
import { Button, Card, DatePicker, Divider, Input, Progress, Slider, Spin, Switch, Col, Row } from "antd";
import React, { useState } from "react";
import { Address, Balance, Events, TokenBalance } from "../components";


const StakedPanel = (userTokenBalance, setShowStakeForm) => {
    return (
        <Col xs={{ span: 5, offset: 1 }} lg={{ span: 6, offset: 2 }} justify="center">
            <h1>Your Stake</h1>
            <h2>Current DAI Balance</h2>
            <span style={{ fontSize: 24, paddingTop: 0 }}>{userTokenBalance.balance}</span>
            <h2 style={{ paddingTop: 20 }}>Days Remaining</h2>
            <span style={{ fontSize: 24, paddingTop: 0 }}>{userTokenBalance.daysRemaining}</span>

            <div style={{ display: "block" }}>
                <Button style={{ marginTop: 8 }}
                    onClick={async () => {
                        console.log("setting showStakeForm true");
                        setShowStakeForm(true);
                    }}
                >
                    Reset Stake...
                </Button>
            </div>


        </Col>
    )
}

const StakedEntryPanel = (userTokenBalance, tx, readContracts, writeContracts, setShowStakeForm, setUserTokenBalance) => {
    console.log("painting", userTokenBalance)
    return (
        <Col xs={{ span: 5, offset: 1 }} lg={{ span: 6, offset: 2 }} justify="center">
            <h1>Your Stake</h1>
            <h2>How much DAI do you want to stake?</h2>

            <Input value={userTokenBalance.balance} type="number"
                onChange={e => {
                    const b = { balance: parseFloat(e.target.value), daysRemaining: userTokenBalance.daysRemaining, token: userTokenBalance.token };
                    console.log("balance changed", b)
                    setUserTokenBalance(b)
                }}
            />
            <span style={{ fontSize: 24, paddingTop: 0 }}>{userTokenBalance.balance}</span>
            <h2 style={{ paddingTop: 20 }}>Over how many days?</h2>
            <Input value={userTokenBalance.daysRemaining} type="number"
                onChange={e => {
                    const b = { balance: userTokenBalance.balance, daysRemaining: parseInt(e.target.value), token: userTokenBalance.token };
                    console.log("daysRemainging changed", b)
                    setUserTokenBalance(b)
                }}
            />

            <Button
                style={{ marginTop: 8 }}
                onClick={async () => {

                    const stakeAmount = utils.parseEther("" + userTokenBalance.balance);
                    const daysRemaining = parseInt(userTokenBalance.daysRemaining);
                    const result1 = tx(writeContracts.FakeDAI.approve(readContracts.MultiUserStacker.address, stakeAmount), update => {
                        console.log("📡 Transaction Update:", update);
                        if (update && (update.status === "confirmed" || update.status === 1)) {
                            console.log(" 🍾 Transaction " + update.hash + " finished!");
                            console.log(
                                " ⛽️ " +
                                update.gasUsed +
                                "/" +
                                (update.gasLimit || update.gas) +
                                " @ " +
                                parseFloat(update.gasPrice) / 1000000000 +
                                " gwei",
                            );
                        }
                    });
                    console.log("awaiting metamask/web3 confirm result...", result1);
                    console.log(await result1);

                    const result2 = tx(writeContracts.MultiUserStacker.setStake(readContracts.FakeDAI.address, stakeAmount, daysRemaining), update => {
                        console.log("📡 Transaction Update:", update);
                        if (update && (update.status === "confirmed" || update.status === 1)) {
                            console.log(" 🍾 Transaction " + update.hash + " finished!");
                            console.log(
                                " ⛽️ " +
                                update.gasUsed +
                                "/" +
                                (update.gasLimit || update.gas) +
                                " @ " +
                                parseFloat(update.gasPrice) / 1000000000 +
                                " gwei",
                            );
                        }
                    });
                    console.log("awaiting metamask/web3 confirm result...", result2);
                    console.log(await result2);

                    setShowStakeForm(false);
                }}
            >
                Set Stake!
            </Button>

        </Col>
    )
}


export default function DailyStacker({
    purpose,
    address,
    mainnetProvider,
    localProvider,
    yourLocalBalance,
    price,
    tx,
    readContracts,
    writeContracts,
}) {
    const [newPurpose, setNewPurpose] = useState("loading...");
    const [showStakeForm, setShowStakeForm] = useState(false);
    const [onLoad, setOnLoad] = useState(true);

    const [userTokenBalance, setUserTokenBalance] = useState({ token: "ABC", daysRemaining: 0, balance: 0 });

    if (readContracts && readContracts.MultiUserStacker && onLoad) {
        setOnLoad(false);
        readContracts.MultiUserStacker.userTokenBalances(address).then(stake => {
            setUserTokenBalance({ balance: utils.formatUnits(stake.balance.toString()), daysRemaining: stake.daysRemaining, token: stake.token })
        });
    }

    const stakedPanel = (userTokenBalance.daysRemaining > 0 && !showStakeForm) ? StakedPanel(userTokenBalance, setShowStakeForm) : StakedEntryPanel(userTokenBalance, tx, readContracts, writeContracts, setShowStakeForm, setUserTokenBalance);

    return (
        <div style={{ paddingTop: 100 }}>



            <Row justify="center">
                <Col span={24}>

                    <Row justify="start">
                        {stakedPanel}
                        <Col xs={{ span: 11, offset: 1 }} lg={{ span: 6, offset: 2 }} justify="center">
                            <h1>Your Portfolio</h1>
                        </Col>
                        <Col xs={{ span: 5, offset: 1 }} lg={{ span: 6, offset: 2 }} justify="center">
                            <h1>Your Token Balances</h1>
                            <Row><Col span={12} align="end"><TokenBalance contracts={{ readContracts }} name="FakeANT" address={{ address }}></TokenBalance></Col><Col span={12} align="start" style={{ fontSize: 24 }}>ANT</Col></Row>
                            <Row><Col span={12} align="end"><TokenBalance contracts={{ readContracts }} name="FakeLINK" address={{ address }} ></TokenBalance></Col><Col span={12} align="start" style={{ fontSize: 24 }}>LINK</Col></Row>
                            <Row><Col span={12} align="end"><TokenBalance contracts={{ readContracts }} name="FakeETH" address={{ address }} ></TokenBalance></Col><Col span={12} align="start" style={{ fontSize: 24 }}>ETH</Col></Row>
                        </Col>
                    </Row>



                </Col>
            </Row>

            <Events
                contracts={readContracts}
                contractName="MultiUserStacker"
                eventName="SetStake"
                localProvider={localProvider}
                mainnetProvider={mainnetProvider}
                startBlock={1}
            />

        </div>
    );
}
