import hre, { network } from 'hardhat';
import { raffleParams } from '../../deployment-params';
import '@nomiclabs/hardhat-ethers';
import { RPSRaffleInitializeParams } from '../../utils/types';
import { LINK, VRFV2Wrapper } from '../../Addresses';

function validateRaffleParams(params: RPSRaffleInitializeParams) {
  if (params.potLimit == 0n) {
    throw new Error("Specify pot limit");
  }
  if (params.numberOfWinners == 0) {
    throw new Error("number of winners must be at least 1");
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
}

const main = async () => {
  validateRaffleParams(raffleParams);

  const [deployer] = await hre.ethers.getSigners();

  const rps_raffle = await hre.ethers.deployContract("RPSRaffle", [
    raffleParams,
    LINK[network.config.chainId!],
    VRFV2Wrapper[network.config.chainId!]
  // @ts-ignore
  ], deployer);
  await rps_raffle.waitForDeployment();

  const deployer_addr = await deployer.getAddress();
  console.log(`RPS Raffle deployed at ${rps_raffle.target} by deployer ${deployer_addr}`)  
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });