import { SyncOutlined } from "@ant-design/icons";
import { ethers, utils } from "ethers";
import { Button, Avatar, Col, Row } from "antd";
import React, { useState } from "react";
import { StakedEntryPanel, PortfolioEntryPanel } from "../components";
import { TOKENS } from "../constants";
import { render } from "react-dom";
import { useContractReader } from "eth-hooks";

const StakedPanel = (userTokenBalance, showStakeForm) => {
    return (
        <Col span={8} justify="center">
            <h1>Your Stake</h1>
            <h2>Current DAI Stake</h2>
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
            <Col span={11} align="end" style={{ fontSize: 24 }}>{percentage}%</Col>
            <Col span={1} align="end" style={{ fontSize: 24 }}>&nbsp;</Col>
            <Col span={12} align="start" style={{ fontSize: 24 }}><Avatar src={`${tokenDefn.ticker.toLowerCase()}.svg`} />{tokenDefn.ticker}</Col>
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

        <Col span={8} justify="center">
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
            <Col span={1} align="end" style={{ fontSize: 24 }}>&nbsp;</Col>
            <Col span={11} align="start" style={{ fontSize: 24 }}><Avatar src={`${tokenDefn.ticker.toLowerCase()}.svg`} />{tokenDefn.ticker}</Col>
        </Row>
    );
}

const prepareAllPortfolioShares = (existingPortfolioShares, tokenDefinitions) => {
    const allPortfolioShares = [];
    for (const tokenDefn of tokenDefinitions) {
        const existingPortfolioShareIndex = existingPortfolioShares.findIndex(share => tokenDefn.address.toLowerCase() === share.token.toLowerCase())
        if (existingPortfolioShareIndex >= 0) {
            const ps = existingPortfolioShares[existingPortfolioShareIndex];
            allPortfolioShares.push({ token: tokenDefn.address, percentage: ps.percentage })
        } else {
            allPortfolioShares.push({ token: tokenDefn.address, percentage: 0 })
        }
    }
    return allPortfolioShares
}

const loadingPanel = () => (
    <Row justify="start">
        <Col span={24} justify="center">
            <h2>One moment please...</h2>
            <img src="Spin-1s-200px.svg"></img>
        </Col>
    </Row>
)

const loadingColumn = () => (
    <Col span={8} justify="center">
        <h2>One moment please...</h2>
        <img src="Spin-1s-200px.svg"></img>
    </Col>
)


const connectPanel = () => (
    <Row justify="start">
        <Col span={24} justify="center">
            <h2>Please connect your wallet</h2>
            <img src="Spin-1s-200px.svg"></img>
            <h2>by hitting</h2>
            <h2>the [Connect] button</h2>
            <h2>in the top right.</h2>
        </Col>
    </Row>
)

export default class DailyStacker extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            onLoad: true,
            showStakeForm: false,
            showPortfolioForm: false,
            stackerLastTimestamp: undefined,
            stackerLastTimestampStr: undefined,
            stackerNextTimestamp: undefined,
            stackerNextTimestampStr: undefined,
            userTokenBalance: { token: "ABC", daysRemaining: 0, balance: 0 },
            tokenBalances: [],
            portfolioShares: [],
            portfolioLoading: false,
            stakeLoading: false,
            tokenBalancesLoading: false,
        };
        this.updateUserPortfolio = this.updateUserPortfolio.bind(this)
        this.updateUserStake = this.updateUserStake.bind(this)
    }

    async reloadPortfolio(props, tokenBalances) {
        const sharesCount = await props.readContracts.MultiUserStacker.noPortfolioShares(props.address);
        console.log(`portfolio shares count ${sharesCount}`)
        let portfolioShares = []
        if (sharesCount > 0) {
            for (let i = 0; i < sharesCount; i++) {
                const portfolioShare = await props.readContracts.MultiUserStacker.userPortfolios(props.address, i)
                console.log("-->", { portfolioShare })
                portfolioShares.push(portfolioShare)
            }
        }
        const allSharses = prepareAllPortfolioShares(portfolioShares, tokenBalances)
        console.log("ALL SHARES -> ", allSharses)
        this.setState({ portfolioShares: allSharses, onLoad: false })
    }

    async reloadStake(props) {
        const stake = await props.readContracts.MultiUserStacker.userTokenBalances(props.address);
        const balance = { balance: utils.formatUnits(stake.balance.toString()), daysRemaining: stake.daysRemaining, token: stake.token };
        this.setState({ userTokenBalance: balance })
    }

    async reloadTokenBalances(props) {
        const NETWORK = "kovan";
        const provider = NETWORK === "localhost" ? props.localProvider : props.mainnetProvider;

        const tokenBalances = [];
        const tokensToFetch = Object.keys(TOKENS[NETWORK]).filter(k => k != 'stake');
        for (const token of tokensToFetch) {
            const tokenDefn = TOKENS[NETWORK][token];

            const tokenBalance = await getTokenBalance(provider, tokenDefn, props.address);
            tokenBalances.push(tokenBalance)
        }
        this.setState({ tokenBalances })
        return tokenBalances;
    }

    async loadAppData(props) {
        if (props.readContracts && props.readContracts.MultiUserStacker && this.state.onLoad && this.props.injectedProvider) {
            console.log(`-------------------------> Initialising Daily Stacker at ${(new Date).toLocaleString()} for ${props.address}`);

            const lastTimestamp = await props.readContracts.MultiUserStacker.lastTimeStamp();
            const stackerLastTimestamp = new Date(lastTimestamp * 1000)
            const stackerLastTimestampStr = stackerLastTimestamp.toLocaleString();
            const stackerNextTimestamp = new Date(lastTimestamp * 1000 + 60 * 10 * 1000)
            const stackerNextTimestampStr = stackerNextTimestamp.toLocaleString();
            this.setState({ stackerLastTimestamp, stackerLastTimestampStr, stackerNextTimestamp, stackerNextTimestampStr })

            await this.reloadStake(props)

            const tokenBalances = await this.reloadTokenBalances(props)
            await this.reloadPortfolio(props, tokenBalances)


        } else {
            console.error('MultiUserStacker not loaded', { contract: props?.readContracts?.MultiUserStacker, onLoad: this.state.onLoad, provider: this.props.injectedProvider })
        }

    }

    componentDidMount() {
        this.loadAppData(this.props);
    }

    componentDidUpdate(prevProps, prevState) {
        const addressChange = (!!prevProps.address && prevProps.address != this.props.address)
        const multiStackerChange = (this.props.readContracts && this.props.readContracts.MultiUserStacker && prevProps.readContracts && !prevProps.readContracts.MultiUserStacker)

        if (addressChange || multiStackerChange) {
            this.loadAppData(this.props)
        }
    }

    async updateUserStake(stakeAmount, daysRemaining) {
        this.setState({ stakeLoading: true, showStakeForm: false });

        const result1 = this.props.tx(
            this.props.mainnetWriteContracts.DAI.approve(this.props.readContracts.MultiUserStacker.address, stakeAmount),
            update => {
                console.log("???? Transaction Update:", update);
                if (update && (update.status === "confirmed" || update.status === 1)) {
                    console.log(" ???? Transaction " + update.hash + " finished!");
                    console.log(
                        " ?????? " +
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
            console.log("???? Transaction Update:", update);
            if (update && (update.status === "confirmed" || update.status === 1)) {
                console.log(" ???? Transaction " + update.hash + " finished!");
                console.log(
                    " ?????? " +
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

        await this.reloadStake(this.props)

        this.setState({ stakeLoading: false });
    }

    async updateUserPortfolio(tokenAddresses, percentages) {
        this.setState({ portfolioLoading: true, showPortfolioForm: false });

        const result = this.props.tx(this.props.writeContracts.MultiUserStacker.setPortfolio(tokenAddresses, percentages), update => {
            console.log("???? Transaction Update:", update);
            if (update && (update.status === "confirmed" || update.status === 1)) {
                console.log(" ???? Transaction " + update.hash + " finished!");
                console.log(
                    " ?????? " +
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

        await this.reloadPortfolio(this.props, this.state.tokenBalances);
        this.setState({ portfolioLoading: false });
    }

    async stackNow() {
        this.setState({ tokenBalancesLoading: true });
        const result = this.props.tx(this.props.writeContracts.MultiUserStacker.performUpkeep(0x63), update => {
            console.log("???? Transaction Update:", update);
            if (update && (update.status === "confirmed" || update.status === 1)) {
                console.log(" ???? Transaction " + update.hash + " finished!");
                console.log(
                    " ?????? " +
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
        await this.reloadTokenBalances(this.props);
        this.setState({ tokenBalancesLoading: false });
    }

    selectStakePanel() {
        if (this.state.stakeLoading) {
            return loadingColumn()
        } else if (this.state.userTokenBalance.daysRemaining > 0 && !this.state.showStakeForm) {
            return StakedPanel(this.state.userTokenBalance, () => { this.setState({ showStakeForm: true }) })
        } else {
            return (<StakedEntryPanel {...this.props} updateUserStake={this.updateUserStake} userTokenBalance={this.state.userTokenBalance} />)
        }
    }

    selectPortfolioPanel() {
        if (this.state.portfolioLoading) {
            return loadingColumn()
        } else if (this.state.portfolioShares.length > 0 && !this.state.showPortfolioForm) {
            return PortfolioPanel(this.state.portfolioShares, this.state.tokenBalances, () => { this.setState({ showPortfolioForm: true }) })
        } else {
            return (<PortfolioEntryPanel {...this.props} portfolioShares={this.state.portfolioShares} tokenDefinitions={this.state.tokenBalances} updateUserPortfolio={this.updateUserPortfolio} />)
        }
    }

    selectTokenBalancesPanel() {
        if (this.state.tokenBalancesLoading) {
            return loadingColumn()
        } else {
            const tokenBalanceRows = this.state.tokenBalances.map(tokenBalance => tokenBalanceRow(tokenBalance));

            const tokenBalancesPanel = (
                <Col span={8} justify="center">
                    <h1>Your Token Balances</h1>
                    {tokenBalanceRows}
                </Col>
            );
            return tokenBalancesPanel;
        }
    }

    render() {
        const stakedPanel = this.selectStakePanel();
        const portfolioPanel = this.selectPortfolioPanel();
        const tokenBalancesPanel = this.selectTokenBalancesPanel();

        const threeColumnPanel = (
            <Row justify="start">
                {stakedPanel}
                {portfolioPanel}
                {tokenBalancesPanel}
            </Row>
        );

        const mainContainer = (
            <Row justify="start">
                <Col span={24}>
                    {threeColumnPanel}
                    <Row justify="center">
                        <Col span={24} style={{ marginTop: 50 }}>
                            <h3>Last Stacked At {this.state.stackerLastTimestampStr}</h3>

                            <Button size="large" type="primary" style={{ marginTop: 8 }} onClick={async () => {
                                this.stackNow()
                            }}>
                                Stack Now!
                            </Button>

                            <div style={{ display: "block", marginTop: 30 }}>Or wait until {this.state.stackerNextTimestampStr}<br /> when Daily Stacker will automatically buy your portfolio tokens.</div>
                        </Col>
                    </Row>
                </Col>
            </Row>
        );


        let centralPanel = undefined;
        if (this.props.web3Modal && !this.props.web3Modal.cachedProvider) {
            centralPanel = connectPanel();
        } else if (this.state.onLoad) {
            centralPanel = loadingPanel();
        } else {
            centralPanel = mainContainer;
        }

        return (
            <div style={{ paddingTop: 100 }}>
                <Row justify="center">
                    <Col span={24}>
                        {centralPanel}
                    </Col>
                </Row>

            </div >
        );
    }
}
