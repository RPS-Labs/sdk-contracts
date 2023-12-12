import hre, { network } from 'hardhat';
import { raffleParams } from '../../deployment-params';
import '@nomiclabs/hardhat-ethers';
import { RPSRaffleArbitraryInitParams, RPSRaffleCustomVrfInitializeParams, RPSRaffleInitializeParams } from '../../utils/types';
import { LINK, VRFV2Wrapper } from '../../Addresses';
import { isCustomVrfNetwork } from '../../utils/utils';

function validateRaffleParams(params: RPSRaffleArbitraryInitParams) {
  if (params.potLimit == 0n) {
    throw new Error("Specify pot limit");
  }
  if (params.tradeFeeInBps == 0n) {
    throw new Error("Trade fee must be greater that zero");
  }
  if (!params.router) {
    throw new Error("Specify router address!");
  }
  if (!params.owner) {
    throw new Error("Specify owner address!");
  }
  if (!params.operator) {
    throw new Error("Specify operator address!");
  }

  if (isCustomVrfNetwork(network.config.chainId!)) {
    if (params.callbackGasLimit != undefined) {
      throw new Error("Parameters misconfiguration: callback gas limit is not supported");
    }
    if (params.vrfConfirmations != undefined) {
      throw new Error("Parameters misconfiguration: vrf confirmations is not supported");
    }
  }
}

const main = async () => {
  validateRaffleParams(raffleParams as RPSRaffleArbitraryInitParams);
  console.log("Validated params");

  const [deployer] = await hre.ethers.getSigners();
  const chainId = network.config.chainId!;
  let rps_raffle;
  let constructor_args;

  if (isCustomVrfNetwork(chainId)) {
    console.log("Deploying with custom vrf...");
    constructor_args = [raffleParams];
    rps_raffle = await hre.ethers.deployContract("RPSRaffleCustomVrf", constructor_args,
    // @ts-ignore
    deployer);
  }
  else {
    console.log("Deploying...");
    constructor_args = [
      raffleParams,
      LINK[chainId],
      VRFV2Wrapper[chainId]
    ];
    rps_raffle = await hre.ethers.deployContract("RPSRaffle", constructor_args
    // @ts-ignore
    , deployer);
  }
  await rps_raffle.waitForDeployment();

  const deployer_addr = await deployer.getAddress();
  console.log(`RPS Raffle deployed at ${rps_raffle.target} by deployer ${deployer_addr}`)  

  /* 
    VERIFICATION
   */
  console.log("Verifying RPS Raffle...");
  await new Promise((resolve) => setTimeout(resolve, 30000));
  await hre.run("verify:verify", {
    address: rps_raffle.target,
    constructorArguments: constructor_args,
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });