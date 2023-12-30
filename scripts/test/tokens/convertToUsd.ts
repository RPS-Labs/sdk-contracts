import { BigNumberish } from 'ethers';
import { Token } from '../../../utils/utils';
import { ethers, network } from 'hardhat';
import { FeedsByNetwork } from '../../../Addresses';

export async function convertToUsd(
  token: Token, 
  amount: BigNumberish,
  feed_address?: string
): Promise<bigint> {
  const chainId = network.config.chainId!;
  if (!feed_address) {
    feed_address = FeedsByNetwork[chainId].get(token);
    if (!feed_address) {
      throw new Error("Specify price feed");
    }
  }

  const PriceFeed = await ethers.getContractAt("AggregatorV3Interface", feed_address);
  const roundData = await PriceFeed.latestRoundData();
  const answer: BigNumberish = roundData.answer;

  if (!answer) {
    throw new Error("Could not convert - invalid answer");
  }

  const decimal_scale = BigInt(Math.pow(10, token.decimals));
  return BigInt(amount) * BigInt(answer) / decimal_scale;
}