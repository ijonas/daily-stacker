import React, { useState } from "react";
import { Button, Card, DatePicker, Divider, Input, Progress, Slider, Spin, Switch, Col, Row } from "antd";
import { ethers, utils } from "ethers";

export default class StakedEntryPanel extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            balance: props.userTokenBalance.balance,
            daysRemaining: props.userTokenBalance.daysRemaining
        }
    }

    // (userTokenBalance, tx, readContracts, writeContracts, setShowStakeForm, setUserTokenBalance)
    render() {
        return (
            <Col xs={{ span: 5, offset: 1 }} lg={{ span: 6, offset: 2 }} justify="center">
                <h1>Your Stake</h1>
                <h2>How much DAI do you want to stake?</h2>

                <Input value={this.state.balance} type="number"
                    onChange={e => { this.setState({ balance: parseFloat(e.target.value) }) }}
                />
                <h2 style={{ paddingTop: 20 }}>Over how many days?</h2>
                <Input value={this.state.daysRemaining} type="number"
                    onChange={e => { this.setState({ daysRemaining: parseInt(e.target.value, 10) }) }}
                />

                <Button
                    type="primary"
                    style={{ marginTop: 8 }}
                    onClick={async () => {

                        const stakeAmount = utils.parseEther("" + this.state.balance);
                        const daysRemaining = parseInt(this.state.daysRemaining, 10);

                        const result1 = this.props.tx(
                            this.props.mainnetWriteContracts.DAI.approve(this.props.readContracts.MultiUserStacker.address, stakeAmount),
                            update => {
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

                        const result2 = this.props.tx(this.props.writeContracts.MultiUserStacker.setStake(this.props.mainnetWriteContracts.DAI.address, stakeAmount, daysRemaining), update => {
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

                        this.props.hideStakeForm();
                    }}
                >
                    Set Stake!
                </Button>

            </Col>
        )
    }
}