import { NextResponse } from 'next/server'

// ✅ Etherscan V2 API с chainid
const ETHERSCAN_API = 'https://api.etherscan.io/v2/api'
const API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY
const CHAIN_ID = 1 // Ethereum Mainnet

interface EtherscanResponse {
  status: string
  message: string
  result: string | any[]
}

interface WhaleData {
  rank: number
  address: string
  balance: number
  usdValue: number
  transactions: number
  label: string
  lastUpdate: string
}

// 🐋 TOP-100 Ethereum Whale Addresses
const KNOWN_WHALE_ADDRESSES = [
  // TOP 10 - Major Exchanges
  '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8', // Binance Hot Wallet
  '0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a', // Bitfinex Cold Storage
  '0x28C6c06298d514Db089934071355E5743bf21d60', // Binance Cold Wallet 2
  '0x56Eddb7aa87536c09CCc2793473599fD21A8b17F', // Binance Cold Wallet 3
  '0xDFd5293D8e347dFe59E90eFd55b2956a1343963d', // Binance Cold Wallet 4
  '0x4976A4A02f38326660D17bf34b431dC6e2eb2327', // Bitfinex Cold Wallet 2
  '0x9696f59E4d72E237BE84fFD425DCaD154Bf96976', // Kraken Hot Wallet
  '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE', // Binance Hot Wallet 2
  '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', // Bitfinex Hot Wallet
  '0x53d284357ec70cE289D6D64134DfAc8E511c8a3D', // Gemini Hot Wallet

  // TOP 11-20
  '0xF977814e90dA44bFA03b6295A0616a897441aceC', // Binance Cold Wallet 5
  '0x2FAF487A4414Fe77e2327F0bf4AE2a264a776AD2', // FTX (Historical)
  '0x0548F59fEE79f8832C299e01dCA5c76F034F558e', // Crypto.com Wallet
  '0x267be1C1D684F78cb4F6a176C4911b741E4Ffdc0', // Kraken Cold Wallet
  '0xE92d1A43df510F82C66382592a047d288f85226f', // Bittrex Wallet
  '0xA929022c9107643515F5c777cE9a910F0D1e490C', // Huobi Wallet
  '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b', // OKEx Wallet
  '0x36A9ACA50E9e84D74eABAd96cC7c9950cAe16297', // Gate.io Wallet
  '0x0681d8Db095565FE8A346fA0277bFfdE9C0eDBBF', // BitMEX Wallet
  '0x73BCEb1Cd57C711feaC4224D062b0F6ff338501e', // Jump Trading

  // TOP 21-30
  '0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549', // Binance Wallet 6
  '0x220866B1A2219f40e72f5c628B65D54268cA3A9D', // Binance Wallet 7
  '0xDD4c48C0B24039969fC16D1cdF626eaB821d3384', // Wintermute Trading
  '0xD551234Ae421e3BCBA99A0Da6d736074f22192FF', // Alameda Research
  '0xB8c77482e45F1F44dE1745F52C74426C631bDD52', // Binance Smart Chain
  '0xC098B2a3Aa256D2140208C3de6543aAEf5cd3A94', // FalconX
  '0x4E9ce36E442e55EcD9025B9a6E0D88485d628A67', // Binance Wallet 8
  '0xC882b111A75C0c657fC507C04FbFcD2cC984F071', // Binance Wallet 9
  '0x40B38765696e3d5d8d9d834D8AaD4bB6e418E489', // Binance Wallet 10
  '0x8d12A197cB00D4747a1fe03395095ce2A5CC6819', // EtherDelta

  // TOP 31-40
  '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', // Vitalik Buterin
  '0x71660c4005BA85c37ccec55d0C4493E66Fe775d3', // Coinbase 1
  '0x503828976D22510aad0201ac7EC88293211D23Da', // Coinbase 2
  '0xddfAbCdc4D8FfC6d5beaf154f18B778f892A0740', // Coinbase 3
  '0x3cD751E6b0078Be393132286c442345e5DC49699', // Coinbase 4
  '0xb5d85CBf7cB3EE0D56b3bB207D5Fc4B82f43F511', // Coinbase 5
  '0xeB2629a2734e272Bcc07BDA959863f316F4bD4Cf', // Coinbase 6
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // Wrapped Ether Contract
  '0x178169B423a011fff22B9e3F3abeA13414dDD0F1', // WETH Gateway
  '0x9845E1909DcA337944a0272F1f9f7249833d2D19', // Uniswap Router

  // TOP 41-50
  '0xCA06411bd7a7296d7dbdd0050DFc846E95fEBEB7', // MEV Bot
  '0x1111111254fb6c44bAC0beD2854e76F90643097d', // 1inch Router
  '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', // Uniswap V3 Router
  '0x000000000dfDe7deaF24138722987c9a6991e2D4', // Gitcoin Grants
  '0xE94B04a0FeD112f3664e45adb2B8915693dD5FF3', // Gnosis Safe
  '0xC61b9BB3A7a0767E3179713f3A5c7a9aeDCE193C', // Olympus DAO
  '0x189B9cBd4AfF470aF2C0102f365FC1823d857965', // Maker DAO
  '0x40ec5B33f54e0E8A33A975908C5BA1c14e5BbbDf', // Polygon Bridge
  '0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11', // Uniswap DAI/WETH
  '0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc', // Uniswap USDC/WETH

  // TOP 51-60 (DeFi Protocols)
  '0x5041ed759Dd4aFc3a72b8192C143F72f4724081A', // Curve 3pool
  '0xDC24316b9AE028F1497c275EB9192a3Ea0f67022', // Curve stETH
  '0xbebc44782C7dB0a1A60Cb6fe97d0b483032FF1C7', // Curve 3pool Liquidity
  '0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490', // Curve LP Token
  '0xD533a949740bb3306d119CC777fa900bA034cd52', // Curve DAO
  '0x47cE0C6eD5B0Ce3d3A51fdb1C52DC66a7c3c2936', // Aave stkAave
  '0x3Ed3B47Dd13EC9a98b44e6204A523E766B225811', // Aave aToken
  '0x030bA81f1c18d280636F32af80b9AAd02Cf0854e', // Aave wETH
  '0xBcca60bB61934080951369a648Fb03DF4F96263C', // Aave USDC
  '0x9ff58f4fFB29fA2266Ab25e75e2A8b3503311656', // Aave wBTC

  // TOP 61-70 (Compound & Yearn)
  '0x5f65f7b609678448494De4C87521CdF6cEf1e932', // Compound cETH
  '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5', // Compound cETH 2
  '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B', // Compound Comptroller
  '0xF5DCe57282A584D2746FaF1593d3121Fcac444dC', // Compound cSAI
  '0x39AA39c021dfbaE8faC545936693aC917d5E7563', // Compound cUSDC
  '0x70e36f6BF80a52b3B46b3aF8e106CC0ed743E8e4', // Compound cCOMP
  '0x041171993284df560249B57358F931D9eB7b925D', // InstaDApp
  '0xACd43E627e64355f1861cEC6d3a6688B31a6F952', // Yearn wETH Vault
  '0x5f18C75AbDAe578b483E5F43f12a39cF75b973a9', // Yearn USDC Vault
  '0xdA816459F1AB5631232FE5e97a05BBBb94970c95', // Yearn DAI Vault

  // TOP 71-80 (Token Contracts)
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC Token
  '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT Token
  '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI Token
  '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC Token
  '0x514910771AF9Ca656af840dff83E8264EcF986CA', // LINK Token
  '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', // AAVE Token
  '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F', // SNX Token
  '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // UNI Token
  '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2', // MKR Token
  '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e', // YFI Token

  // TOP 81-90 (Governance Tokens)
  '0xba100000625a3754423978a60c9317c58a424e3D', // BAL Token
  '0x111111111117dC0aa78b770fA6A738034120C302', // 1INCH Token
  '0x04Fa0d235C4abf4BcF4787aF4CF447DE572eF828', // UMA Token
  '0xc00e94Cb662C3520282E6f5717214004A7f26888', // COMP Token
  '0x0D8775F648430679A709E98d2b0Cb6250d2887EF', // BAT Token
  '0xdd974D5C2e2928deA5F71b9825b8b646686BD200', // KNC Token
  '0x80fB784B7eD66730e8b1DBd9820aFD29931aab03', // LEND Token
  '0x408e41876cCCDC0F92210600ef50372656052a38', // REN Token
  '0xE41d2489571d322189246DaFA5ebDe1F4699F498', // ZRX Token
  '0xBBbbCA6A901c926F240b89EacB641d8Aec7AEafD', // LRC Token

  // TOP 91-100 (Misc)
  '0x0F5D2fB29fb7d3CFeE444a200298f468908cC942', // MANA Token
  '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0', // MATIC Token
  '0x4Fabb145d64652a948d72533023f6E7A623C7C53', // BUSD Token
  '0x8E870D67F660D95d5be530380D0eC0bd388289E1', // USDP Token
  '0x1494CA1F11D487c2bBe4543E90080AeBa4BA3C2b', // DPI Token
  '0x956F47F50A910163D8BF957Cf5846D573E7f87CA', // FEI Token
  '0x853d955aCEf822Db058eb8505911ED77F175b99e', // FRAX Token
  '0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32', // LDO Token
  '0x9355372396e3F6daF13359B7b607a3374cc638e0', // WHALE Token
  '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0', // wstETH Token
]

// 🏷️ Labels для известных адресов
const WHALE_LABELS: Record<string, string> = {
  '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8': 'Binance Hot Wallet',
  '0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a': 'Bitfinex Cold Storage',
  '0x28C6c06298d514Db089934071355E5743bf21d60': 'Binance Cold Wallet 2',
  '0x56Eddb7aa87536c09CCc2793473599fD21A8b17F': 'Binance Cold Wallet 3',
  '0xDFd5293D8e347dFe59E90eFd55b2956a1343963d': 'Binance Cold Wallet 4',
  '0x4976A4A02f38326660D17bf34b431dC6e2eb2327': 'Bitfinex Cold Wallet 2',
  '0x9696f59E4d72E237BE84fFD425DCaD154Bf96976': 'Kraken Hot Wallet',
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': 'Wrapped Ether (WETH)',
  '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B': 'Vitalik Buterin',
  '0xF977814e90dA44bFA03b6295A0616a897441aceC': 'Binance Cold Wallet 5',
}

// 💰 Получаем актуальную цену ETH из CoinGecko
async function getEthPrice(): Promise<number> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
      {
        next: { revalidate: 300 }, // Cache 5 min
      }
    )
    
    if (!response.ok) {
      console.error('CoinGecko API error:', response.statusText)
      return 2500 // Fallback
    }

    const data = await response.json()
    return data.ethereum?.usd || 2500
  } catch (error) {
    console.error('Error fetching ETH price:', error)
    return 2500 // Fallback
  }
}

async function getWhaleBalance(
  address: string,
  ethPrice: number
): Promise<WhaleData | null> {
  try {
    if (!API_KEY) {
      throw new Error('Etherscan API key not configured')
    }

    // ✅ V2 API - balance with chainid
    const balanceUrl = `${ETHERSCAN_API}?chainid=${CHAIN_ID}&module=account&action=balance&address=${address}&tag=latest&apikey=${API_KEY}`

    const balanceResponse = await fetch(balanceUrl, {
      next: { revalidate: 300 }, // Cache 5 min
    })

    const balanceData: EtherscanResponse = await balanceResponse.json()

    // Проверка ошибки
    if (balanceData.status === '0' || !balanceData.result) {
      console.error(`Etherscan API Error for ${address}:`, balanceData.message)
      return null
    }

    const balanceWei = BigInt(balanceData.result as string)
    const balanceEth = Number(balanceWei) / 1e18

    // ✅ V2 API - transaction count
    const txCountUrl = `${ETHERSCAN_API}?chainid=${CHAIN_ID}&module=proxy&action=eth_getTransactionCount&address=${address}&tag=latest&apikey=${API_KEY}`

    const txResponse = await fetch(txCountUrl, {
      next: { revalidate: 300 },
    })

    const txData: EtherscanResponse = await txResponse.json()
    const txCount = txData.result ? parseInt(txData.result as string, 16) : 0

    return {
      rank: 0, // Will be set later
      address,
      balance: balanceEth,
      usdValue: balanceEth * ethPrice, // ✅ Используем актуальную цену
      transactions: txCount,
      label: WHALE_LABELS[address] || `Whale ${address.slice(0, 6)}...`,
      lastUpdate: new Date().toISOString(),
    }
  } catch (error) {
    console.error(`Error fetching balance for ${address}:`, error)
    return null
  }
}

async function getTopWhaleAddresses(limit: number): Promise<{
  whales: WhaleData[]
  ethPrice: number
}> {
  try {
    // Получаем актуальную цену ETH
    const ethPrice = await getEthPrice()
    
    const addresses = KNOWN_WHALE_ADDRESSES.slice(0, Math.min(limit, 100))

    const whaleDataPromises = addresses.map((address) =>
      getWhaleBalance(address, ethPrice)
    )

    const whaleData = await Promise.all(whaleDataPromises)

    // Фильтруем null и сортируем по балансу
    const validWhales = whaleData
      .filter((whale): whale is WhaleData => whale !== null)
      .sort((a, b) => b.balance - a.balance)
      .map((whale, index) => ({
        ...whale,
        rank: index + 1,
      }))

    return { whales: validWhales, ethPrice }
  } catch (error) {
    console.error('Error fetching top whales:', error)
    return { whales: [], ethPrice: 2500 }
  }
}

async function monitorWhaleTransaction(address: string): Promise<any> {
  try {
    if (!API_KEY) {
      throw new Error('Etherscan API key not configured')
    }

    // ✅ V2 API - txlist with chainid
    const url = `${ETHERSCAN_API}?chainid=${CHAIN_ID}&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${API_KEY}`

    const response = await fetch(url, {
      next: { revalidate: 60 },
    })

    const data: EtherscanResponse = await response.json()

    if (data.status === '1' && Array.isArray(data.result)) {
      return {
        address,
        transactions: data.result.slice(0, 10),
        count: data.result.length,
      }
    }

    return { address, transactions: [], count: 0 }
  } catch (error) {
    console.error('Error monitoring whale:', error)
    return { address, transactions: [], count: 0 }
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'top'

  if (!API_KEY) {
    return NextResponse.json(
      {
        error: 'Etherscan API key not configured',
        hint: 'Add NEXT_PUBLIC_ETHERSCAN_API_KEY to your environment variables',
      },
      { status: 500 }
    )
  }

  try {
    let data
    let ethPrice = 2500

    switch (action) {
      case 'top':
        const limit = parseInt(searchParams.get('limit') || '50')
        const result = await getTopWhaleAddresses(limit)
        data = result.whales
        ethPrice = result.ethPrice
        break

      case 'monitor':
        const address = searchParams.get('address')
        if (!address) {
          return NextResponse.json(
            { error: 'Address parameter required' },
            { status: 400 }
          )
        }
        data = await monitorWhaleTransaction(address)
        ethPrice = await getEthPrice()
        break

      default:
        const defaultResult = await getTopWhaleAddresses(10)
        data = defaultResult.whales
        ethPrice = defaultResult.ethPrice
    }

    return NextResponse.json({
      success: true,
      data,
      ethPrice, // ✅ Отправляем актуальную цену
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Whale API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch whale data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
