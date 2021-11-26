import React, { useState } from "react";
import { Button, Card, DatePicker, Divider, Input, Progress, Slider, Spin, Switch, Col, Row } from "antd";
import { ethers, utils } from "ethers";

const portfolioEntryRow = (tokenDefn, currentShare, shareIndex, updatePortfolio) => {
    return (
        <Row key={`tbr-${tokenDefn.address}`}>
            <Col span={12} align="end" style={{ fontSize: 24 }}>
                <Input value={currentShare} type="number" style={{ textAlign: "right", maxWidth: 100 }}
                    onChange={e => {
                        const percentage = parseInt(e.target.value, 0);
                        updatePortfolio(shareIndex, percentage);
                    }}
                />
            </Col>
            <Col span={12} align="start" style={{ fontSize: 24 }}>% {tokenDefn.ticker}</Col>
        </Row>
    );
}

export default class PortfolioEntryPanel extends React.Component {

    constructor(props) {
        super(props);

        const portfolioEntries = this.props.tokenDefinitions.map(tokenDefn => {
            const existingPortfolioShareIndex = this.props.portfolioShares.findIndex(share => tokenDefn.address === share.token)

            let percentage = 0;
            if (existingPortfolioShareIndex >= 0) {
                percentage = this.props.portfolioShares[existingPortfolioShareIndex].percentage
            }

            return { tokenDefn, percentage }
        })


        this.state = {
            portfolioEntries
        }
    }

    // (userTokenBalance, tx, readContracts, writeContracts, setShowStakeForm, setUserTokenBalance)
    render() {

        const portfolioEntryRows = []

        for (const shareIndex in this.state.portfolioEntries) {
            const entry = this.state.portfolioEntries[shareIndex];
            portfolioEntryRows.push(
                portfolioEntryRow(entry.tokenDefn, entry.percentage, shareIndex, (index, percentage) => {
                    const portfolioEntries = this.state.portfolioEntries;
                    portfolioEntries[index].percentage = percentage;
                    this.setState({ portfolioEntries })
                })
            );
        }

        return (

            <Col span={8} justify="center">
                <h1>Your Portfolio</h1>

                {portfolioEntryRows}

                <div style={{ display: "block" }}>
                    <Button type="primary" style={{ marginTop: 8 }}
                        onClick={async () => {

                            const tokenAddresses = [];
                            const percentages = [];
                            for (const entry of this.state.portfolioEntries) {
                                tokenAddresses.push(entry.tokenDefn.address);
                                percentages.push(entry.percentage);
                            }

                            const result = this.props.tx(this.props.writeContracts.MultiUserStacker.setPortfolio(tokenAddresses, percentages), update => {
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
                            console.log("awaiting metamask/web3 confirm result...", result);
                            console.log(await result);


                            this.props.hidePortfolioEntryForm();

                        }}
                    >
                        Set Portfolio!
                    </Button>
                </div>


            </Col>
        )
    }
}