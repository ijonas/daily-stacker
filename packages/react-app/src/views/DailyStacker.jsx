import { SyncOutlined } from "@ant-design/icons";
import { ethers, utils } from "ethers";
import { Button, Card, DatePicker, Divider, Input, Progress, Slider, Spin, Switch, Col, Row } from "antd";
import React, { useState } from "react";
import { Address, Balance, Events, TokenBalance, StakedEntryPanel, PortfolioEntryPanel } from "../components";
import { TOKENS } from "../constants";
import { render } from "react-dom";

const StakedPanel = (userTokenBalance, showStakeForm) => {
    return (
        <Col xs={{ span: 5, offset: 1 }} lg={{ span: 6, offset: 2 }} justify="center">
            <h1>Your Stake</h1>
            <h2>Current DAI Balance</h2>
            <span style={{ fontSize: 24, paddingTop: 0 }}>{userTokenBalance.balance}</span>
            <h2 style={{ paddingTop: 20 }}>Days Remaining</h2>
            <span style={{ fontSize: 24, paddingTop: 0 }}>{userTokenBalance.daysRemaining}</span>

            <div style={{ display: "block" }}>
                <Button type="primary" style={{ marginTop: 8 }} onClick={async () => showStakeForm()}>
                    Reset Stake...
                </Button>
            </div>


        </Col>
    )
}

const portfolioRow = (percentage, tokenDefn) => {
    return (
        <Row key={`tbr-${tokenDefn.address}`}>
            <Col span={12} align="end" style={{ fontSize: 24 }}>{percentage}%</Col>
            <Col span={12} align="start" style={{ fontSize: 24 }}>{tokenDefn.ticker}</Col>
        </Row>
    );
}

const PortfolioPanel = (portfolioShares, tokenBalances, showPorfolioForm) => {

    const portfolioRows = [];
    for (const tokenDefn of tokenBalances) {
        const share = portfolioShares.find(share => share.token === tokenDefn.address)
        if (share) {
            portfolioRows.push(portfolioRow(share.percentage, tokenDefn))
        }
    }

    return (

        <Col xs={{ span: 5, offset: 1 }} lg={{ span: 6, offset: 2 }} justify="center">
            <h1>Your Portfolio</h1>
            {portfolioRows}
            <div style={{ display: "block" }}>
                <Button type="primary" style={{ marginTop: 8 }} onClick={async () => showPorfolioForm()}>
                    Amend Portfolio...
                </Button>
            </div>


        </Col>
    )
}

const { getErc20TokenBalance } = require('../contracts/erc20');
const getTokenBalance = async (provider, tokenDefn, address) => {
    console.log(`Getting balance for ${address}/${tokenDefn.name}/${tokenDefn.address}`)
    try {
        const result = await getErc20TokenBalance(tokenDefn.address, address, provider);
        const { balance, decimals } = result
        return { ...tokenDefn, balance, decimals }
    } catch (error) {
        console.error(error)
        return { ...tokenDefn, balance: 0, decimals: 0 }
    }
}

const tokenBalanceRow = (tokenDefn) => {
    return (
        <Row key={`tbr-${tokenDefn.address}`}>
            <Col span={12} align="end" style={{ fontSize: 24 }}>{ethers.utils.formatUnits(tokenDefn.balance, tokenDefn.decimals)}</Col>
            <Col span={12} align="start" style={{ fontSize: 24 }}>{tokenDefn.ticker}</Col>
        </Row>
    );
}

const prepareAllPortfolioShares = (existingPortfolioShares, tokenDefinitions) => {
    const allPortfolioShares = [];
    for (const tokenDefn of tokenDefinitions) {
        const existingPortfolioShareIndex = existingPortfolioShares.findIndex(share => tokenDefn.address === share.token)
        if (existingPortfolioShareIndex >= 0) {
            allPortfolioShares.push(existingPortfolioShares[existingPortfolioShareIndex])
        } else {
            allPortfolioShares.push({ token: tokenDefn.address, percentage: 0 })
        }
    }
    return allPortfolioShares
}

export default class DailyStacker extends React.Component {
    // address: props.address,
    // mainnetProvider: props.mainnetProvider,
    // localProvider: props.localProvider,
    // yourLocalBalance: props.yourLocalBalance,
    // price: props.price,
    // tx: props.tx,
    // readContracts: props.readContracts,
    // writeContracts: props.writeContracts,

    constructor(props) {
        super(props);
        this.state = {
            onLoad: true,
            showStakeForm: false,
            showPortfolioForm: false,
            userTokenBalance: { token: "ABC", daysRemaining: 0, balance: 0 },
            tokenBalances: [],
            portfolioShares: [],
        };
    }

    loadAppData(props) {
        if (props.readContracts && props.readContracts.MultiUserStacker) {
            console.log(`-------------------------> Initialising Daily Stacker at ${(new Date).toLocaleString()}`);
            props.readContracts.MultiUserStacker.userTokenBalances(props.address).then(stake => {
                const balance = { balance: utils.formatUnits(stake.balance.toString()), daysRemaining: stake.daysRemaining, token: stake.token };
                this.setState({ userTokenBalance: balance })
            });

            const NETWORK = "localhost";
            const provider = NETWORK === "localhost" ? props.localProvider : props.mainnetProvider;

            const tokenBalancePromises = [];
            for (const token of Object.keys(TOKENS[NETWORK])) {
                const tokenDefn = TOKENS[NETWORK][token];
                const tokenBalancePromise = getTokenBalance(provider, tokenDefn, props.address);
                tokenBalancePromises.push(tokenBalancePromise)
            }
            Promise.all(tokenBalancePromises).then((tokenBalances) => {
                console.log("------> tokenBalances", tokenBalances)
                this.setState({ tokenBalances })

                props.readContracts.MultiUserStacker.noPortfolioShares(props.address).then(sharesCount => {
                    if (sharesCount > 0) {
                        const promisesPortfolioShare = []
                        for (let i = 0; i < sharesCount; i++) {
                            const promisePortfolioShare = props.readContracts.MultiUserStacker.userPortfolios(props.address, i)
                            promisesPortfolioShare.push(promisePortfolioShare)
                        }
                        Promise.all(promisesPortfolioShare).then(portfolioShares => {
                            console.log("==============================================<>")
                            const allSharses = prepareAllPortfolioShares(portfolioShares, tokenBalances)
                            console.log(allSharses)
                            this.setState({ portfolioShares: allSharses, onLoad: false })
                        })
                    } else {
                        console.log("==============================================<no portfolio>")
                        const allSharses = prepareAllPortfolioShares([], tokenBalances)
                        console.log(allSharses)
                        this.setState({ portfolioShares: allSharses, onLoad: false })
                    }
                })
            });


        } else {
            console.error('MultiUserStacker not loaded')
        }

    }

    componentDidUpdate(prevProps, prevState) {
        console.log("----> componentDidUpdate", { prevProps, prevState })
        if (this.state.onLoad && this.props.readContracts && this.props.readContracts.MultiUserStacker) {
            this.loadAppData(this.props)
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        console.log("----> shouldComponentUpdate", { nextProps, nextState })
        return !!nextProps.readContracts.MultiUserStacker
    }

    componentDidMount() {
        console.log("----> componentDidMount")
    }



    render() {

        const stakedPanel = (this.state.userTokenBalance.daysRemaining > 0 && !this.state.showStakeForm) ?
            StakedPanel(this.state.userTokenBalance, () => { this.setState({ showStakeForm: true }) }) :
            (<StakedEntryPanel {...this.props} hideStakeForm={() => this.setState({ showStakeForm: false })} userTokenBalance={this.state.userTokenBalance} />);

        // const portfolioPanel = (portfolioShares.length > 0 && !showPortfolioForm) ? PortfolioPanel(setShowPortfolioForm) : PortfolioEntryPanel(portfolioShares, tokenBalances, setShowPortfolioForm, setPortfolioShares);
        const portfolioPanel = (this.state.portfolioShares.length > 0 && !this.state.showPortfolioForm) ?
            PortfolioPanel(this.state.portfolioShares, this.state.tokenBalances, () => { this.setState({ showPortfolioForm: true }) }) :
            (<PortfolioEntryPanel {...this.props} portfolioShares={this.state.portfolioShares} tokenDefinitions={this.state.tokenBalances} hidePortfolioEntryForm={() => { this.setState({ showPortfolioForm: false }) }} />);

        const tokenBalanceRows = this.state.tokenBalances.map(tokenBalance => tokenBalanceRow(tokenBalance));

        const tokenBalancesPanel = (
            <Col xs={{ span: 5, offset: 1 }} lg={{ span: 6, offset: 2 }} justify="center">
                <h1>Your Token Balances</h1>
                {tokenBalanceRows}
            </Col>
        );

        const loadingPanel = (
            <Row justify="start">
                <Col span={8} justify="center">
                    <h1>Loading...</h1>
                </Col>
            </Row>
        );

        const threeColumnPanel = (
            <Row justify="start">
                {stakedPanel}
                {portfolioPanel}
                {tokenBalancesPanel}
            </Row>
        );

        const centralPanel = this.state.onLoad ? loadingPanel : threeColumnPanel

        return (
            <div style={{ paddingTop: 100 }}>
                <Row justify="center">
                    <Col span={24}>
                        {centralPanel}
                    </Col>
                </Row>
            </div>
        );
    }
}
