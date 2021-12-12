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

                        this.props.updateUserStake(stakeAmount, daysRemaining);


                    }}
                >
                    Set Stake!
                </Button>

            </Col>
        )
    }
}