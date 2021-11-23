//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

struct PortfolioShare {
    uint8 percentage;
    address token;
}

struct Stake {
    address token;
    uint256 balance;
    uint8 daysRemaining;
}

contract MultiUserStacker is Ownable {
    IUniswapV2Router02 internal uniswapV2Router;
    address uniswapV2RouterAddress;

    //address of WETH token.  This is needed because some times it is better to trade through WETH.
    //you might get a better price using WETH.
    //example trading from token A to WETH then WETH to token B might result in a better price
    address WETHaddress;

    mapping(address => Stake) public userTokenBalances;
    event SetStake(
        address indexed _from,
        address indexed _token,
        uint256 _balance,
        uint8 _daysRemaining
    );

    mapping(address => PortfolioShare[]) public userPortfolios;
    address[] public users;

    constructor(address _uniswap_v2_router, address _wethAddress) {
        uniswapV2Router = IUniswapV2Router02(_uniswap_v2_router);
        WETHaddress = _wethAddress;
        uniswapV2RouterAddress = _uniswap_v2_router;
    }

    function setStake(
        address _token,
        uint256 _balance,
        uint8 _daysRemaining
    ) public {
        emit SetStake(msg.sender, _token, _balance, _daysRemaining);
        userTokenBalances[msg.sender] = Stake(_token, _balance, _daysRemaining);
    }

    // Called by User when to setup their portfolio
    function setPortfolio(address[] memory _tokens, uint8[] memory _shares)
        public
    {
        require(
            _tokens.length == _shares.length,
            "Specify same number of tokens and share percentages"
        );
        require(
            _tokens.length > 0,
            "Specify atleast 1 token & share percentage"
        );

        delete userPortfolios[msg.sender];
        uint8 _totalShare = 0;
        for (uint256 i = 0; i < _tokens.length; i++) {
            _totalShare += _shares[i];
            userPortfolios[msg.sender].push(
                PortfolioShare(_shares[i], _tokens[i])
            );
        }
        require(
            _totalShare == 100,
            "Portfolio shares need to add up to 100 percent exactly."
        );
    }

    function buyPortfolio(address _to) public {
        // figure out how big a slice of ETH we're spending today
        // today's ETH slice = eth balance / days remaining
        uint256 stakeSlice;
        if (userTokenBalances[_to].daysRemaining <= 1) {
            stakeSlice = userTokenBalances[_to].balance;
        } else {
            stakeSlice = SafeMath.div(
                userTokenBalances[_to].balance,
                userTokenBalances[_to].daysRemaining
            );
        }
        require(stakeSlice > 0, "Stacker needs stake to spend");

        // for each portfolio share
        for (uint8 i = 0; i < userPortfolios[_to].length; i++) {
            // figure out the percentage of today's ETH slice
            // amountIn = today's ETH slice * token share
            uint256 amountIn = SafeMath.mul(
                SafeMath.div(stakeSlice, 100),
                userPortfolios[_to][i].percentage
            );

            // get the token's amountOut for amountIn
            uint256 amountOut = getAmountOutMin(
                userTokenBalances[_to].token,
                userPortfolios[_to][i].token,
                amountIn
            );

            // swap(WETH, token, amountIn, amountOut, sender wallet )
            swap(
                userTokenBalances[_to].token,
                userPortfolios[_to][i].token,
                amountIn,
                amountOut,
                _to
            );
        }
        if (userTokenBalances[_to].daysRemaining > 0) {
            userTokenBalances[_to].daysRemaining =
                userTokenBalances[_to].daysRemaining -
                1;
        }
    }

    //this swap function is used to trade from one token to another
    //the inputs are self explainatory
    //token in = the token address you want to trade out of
    //token out = the token address you want as the output of this trade
    //amount in = the amount of tokens you are sending in
    //amount out Min = the minimum amount of tokens you want out of the trade
    //to = the address you want the tokens to be sent to

    function swap(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        uint256 _amountOutMin,
        address _to
    ) public {
        //first we need to transfer the amount in tokens from the msg.sender to this contract
        //this contract will have the amount of in tokens
        IERC20(_tokenIn).transferFrom(msg.sender, address(this), _amountIn);

        //next we need to allow the uniswapv2 router to spend the token we just sent to this contract
        //by calling IERC20 approve you allow the uniswap contract to spend the tokens in this contract
        IERC20(_tokenIn).approve(address(uniswapV2Router), _amountIn);

        //path is an array of addresses.
        //this path array will have 3 addresses [tokenIn, WETHaddress, tokenOut]
        //the if statement below takes into account if token in or token out is WETHaddress.  then the path is only 2 addresses
        address[] memory path;
        if (_tokenIn == WETHaddress || _tokenOut == WETHaddress) {
            path = new address[](2);
            path[0] = _tokenIn;
            path[1] = _tokenOut;
            // console.log("From %s => %s", path[0], path[1]);
            // console.log("With %d => %d", _amountIn, _amountOutMin);
        } else {
            path = new address[](3);
            path[0] = _tokenIn;
            path[1] = WETHaddress;
            path[2] = _tokenOut;
        }
        //then we will call swapExactTokensForTokens
        //for the deadline we will pass in block.timestamp
        //the deadline is the latest time the trade is valid for
        uniswapV2Router.swapExactTokensForTokens(
            _amountIn,
            _amountOutMin,
            path,
            _to,
            block.timestamp
        );
    }

    //this function will return the minimum amount from a swap
    //input the 3 parameters below and it will return the minimum amount out
    //this is needed for the swap function above
    function getAmountOutMin(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn
    ) public view returns (uint256) {
        //path is an array of addresses.
        //this path array will have 3 addresses [tokenIn, WETHaddress, tokenOut]
        //the if statement below takes into account if token in or token out is WETHaddress.  then the path is only 2 addresses
        address[] memory path;
        if (_tokenIn == WETHaddress || _tokenOut == WETHaddress) {
            path = new address[](2);
            path[0] = _tokenIn;
            path[1] = _tokenOut;
        } else {
            path = new address[](3);
            path[0] = _tokenIn;
            path[1] = WETHaddress;
            path[2] = _tokenOut;
        }

        uint256[] memory amountOutMins = uniswapV2Router.getAmountsOut(
            _amountIn,
            path
        );
        return amountOutMins[path.length - 1];
    }
}
