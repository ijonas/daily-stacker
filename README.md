# Daily Stacker

Waking up to a little bit more crypto in your wallet is a great feeling. Daily Stacker wakes up before you do and buys you a little slice of your favourite tokens and sends them to your wallet.

## Inspiration

I've always enjoyed teaching crypto to newbie nocoiners. Getting them setup with centralised exchange account and getting them to buy their first sliver of Bitcoin.

Alongside that I've always explained that Dollar-cost-averaging (DCA) combined with HODLing has been proven time and time again to be the best and simplest investment strategy to adopt. Don't try and time the market, don't try and catch the dips. Just buy at set intervals - daily, weekly, or monthly.

Daily Stacker takes DCA to a new level. Waking up everyday owning a little bit more crypto is a nice feeling and Daily Stacker helps achieve that. 

Daily Stacker first came to life as a [Raspberry Pi project called SatStacker](https://github.com/ijonas/satstacker). SatStacker still runs today and buys my crypto. However I collected a lot of feedback from people asking if they could have a solution that they could run themselves without hardware.

Part of the problem to solve had to include to be the management of private keys or API keys and I don't want to be responsible for other people's keys. The combination of EVM smart contracts, L2 chains, Chainlink, and gas cost-optimised DEXes such as SushiSwap + Bentobox offered a solution.

## What it does

Here's how Daily Stacker works:

1. connect your wallet and once a month transfer some DAI to Daily Stacker, say 300 DAI.
2. setup a portfolio, e.g. 50% Wrapped Bitcoin, 35% LINK, 15% BAT
3. for the next 30 days Daily Stacker will buy slivers of the tokens according to the ratios in your portfolio
4. all purchases are automatically sent to your wallet

## How I built it

Scaffold-Eth has been a brilliant tool that has allowed the design to emerge, by first allowing me to play around and model some basic contracts. Automate the development through testing and finally to build a DAPP UI on top that included all the necessary wallet hooks.

Bill of materials:
* Scaffold-Eth (React, Hardhat, Ethers)
* Chainlink Keepers
* SushiSwap 
* BentoBox
* Polygon
* Ramp Network for fiat onramp

## Challenges I ran into

* Learning Solidity (after many previous false starts)
* Dealing with the peculiarities of ERC-20 tokes (approval workflows)

## Accomplishments that we're proud of

Learning Solidity and getting a least a fair bit along the way to project completion.
At the ripe old age of almost 50, joined my first hackathon. Old dog, new tricks.

## What we learned

* EVM platforms are massive environment to innovate on.
* Solidity itself is reasonably easy to learn, however running smart contracts on the blockchain is hard. The ERC-20 Approval pattern is often a stumbling block.
* Team up with people. You can't do it all.

## What's next for Daily Stacker

* Deploy to Polygon and other L2s for cheaper gas costs but that depends on the availability of Chainlink Keepers support on those chains. Update: Keepers are now available on Polygon.
* I'd like integrate something like [ramp.network](https://ramp.network/) to provide a fiat onramp straight into Daily Stacker
* Improve the UI.
* Develop a mechanism whereby the protocol buys the LINK token to support itself, paid for by the users of the protocol.
* Integrate yield-generating protocols that will earn a yield whilst the funds are staked but not spent.

## Note

Daily Stacker was born as part of the [Chainlink Fall 2021 Hackathon](https://chain.link/hackathon) where it was entered as a Solo Project.

## To Do

Daily Stacker is currently not a working piece of software. Unfortunately it is not demonstrable.

### Phase 1 - To get to MVP Demo
- [x] Implement Chainlink Keepers
- [ ] Get working Dapp UI
    - [x] Fix Token Balances
    - [x] Improve layout and colours

### Phase 2 - To get to Unaudited Beta on Testnet and into user's hands
- [ ] Write more tests
- [ ] Improve Dapp UI
    - [ ] Use tokenlists instead of a fixed list of tokens.
    - [ ] Add some branding & pizazz, roll it in glitter.
    - [ ] Write UI tests.
- [ ] Add Bentobox support to reduce gas costs
- [ ] Write more tests
- [ ] Move to Polygon Mumbai testnet

### Phase 3 - Deploy to Polygon mainnet
- [ ] Incorporate static analysis and security testing tools into test framework
- [ ] Incorporate CI-server for testing and deployment
- [ ] Get code audited
- [ ] Fix audit issues
- [ ] Deploy to Polygon mainnet
