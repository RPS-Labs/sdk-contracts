import { LINK, LINK_WHALE } from '../../Addresses';

const { ethers, network } = require('hardhat');

export async function dealLINKToAddress(
  address: string,
  amount: number
) {
  const chainId = network.config.chainId!;
  const LINK_ADDRESS = LINK[chainId];
  const link_token = await ethers.getContractAt(
      "ERC20",
      LINK_ADDRESS
  );
  const LINK_WHALE_ADDRESS = LINK_WHALE[chainId];

  await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [LINK_WHALE_ADDRESS],
  });
  const link_whale = await ethers.getSigner(LINK_WHALE_ADDRESS);

  await link_token
      .connect(link_whale)
      .transfer(
          address,
          amount
      );
}