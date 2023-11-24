## RPS Labs SDK contracts
Welcome to the comprehensive guide for deploying and configuring the smart contracts integral to the RPS Labs SDK.

For detailed insights and additional information, please refer to the RPS Labs Smart Contract Documentation https://rpslabs.gitbook.io/docs/for-developers/smart-contracts.

### Initial configuration

Begin by cloning the repository and installing the necessary dependencies:
```
npm i --force
```

Next, create a .env file and populate it based on the provided .env.example template:
```bash
ALCHEMY_KEY=

RPC_URL=https://eth-mainnet.g.alchemy.com/v2/

# For contract verification
ETHERSCAN_API_KEY=

DEPLOYER_PK=
```

In hardhat.config.ts, specify your desired defaultNetwork for deployment. Ensure that your RPC_URL and ALCHEMY_KEY are appropriately set for this network.
```ts
defaultNetwork: "sepolia"
```
Finally, compile the contracts with the following command:
```bash
npx hardhat compile
```

### RPS Router deployment

To deploy the RPS Router, begin by specifying the deployment parameters in the deployment-params.ts file. The protocol field should contain the address of the contract with which the router will be integrated.

```ts
export const routerParams: RPSRouterParams = {
  owner: '',
  protocol: ''
}
```

Once the parameters are set, you're ready for deployment. The following script not only deploys the router but also automatically verifies the contract on Etherscan:
```bash
npx ts-node .\scripts\deploy\deploy-rps-router.ts  
```

### RPS Raffle deployment
Next, we'll deploy the RPS Raffle contract. First, configure the deployment parameters in deployment-params.ts.

For more information about these parameters, refer to our documentation.

To deploy and verify the Raffle contract, execute the following command:

Deploy and verify:
```
npx ts-node .\scripts\deploy\deploy-rps-raffle.ts  
```

### Final configuration
Once your contracts are successfully deployed, a few final steps are required to fully set them up:

1. Call the `RPSRouter.setRaffleAddress()` function, passing the address of a recently deployed RPS Raffle contract. You can use Etherscan to do it.
2. Call `RPSRaffle.updatePrizeAmounts()`, passing in an array of prize amounts in wei (1 ether = 10^18 wei) for each winner. This step is necessary only once unless there's a need to change the prize distribution in the future.
3. Fund your RPS Raffle contract with LINK tokens, which are required to run Chainlink VRF.