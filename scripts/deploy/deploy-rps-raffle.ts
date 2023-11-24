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
  const chainId = network.config.chainId!;

  const rps_raffle = await hre.ethers.deployContract("RPSRaffle", [
    raffleParams,
    LINK[chainId],
    VRFV2Wrapper[chainId]
  // @ts-ignore
  ], deployer);
  await rps_raffle.waitForDeployment();

  const deployer_addr = await deployer.getAddress();
  console.log(`RPS Raffle deployed at ${rps_raffle.target} by deployer ${deployer_addr}`)  

  // Verification
  console.log("Verifying RPS Raffle...");
  await new Promise((resolve) => setTimeout(resolve, 30000));
  await hre.run("verify:verify", {
    address: rps_raffle.target,
    constructorArguments: [
      raffleParams,
      LINK[chainId],
      VRFV2Wrapper[chainId]
    ],
  });
  
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });