import { Contract } from 'ethers';
import { ETH_USD_PAIR, FeedsByNetwork } from '../../Addresses';
import { network } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Token } from '../../utils/utils';

export async function configurePriceFeeds(
  RPSRaffle: Contract,
  owner: SignerWithAddress
) {
  const chainId = network.config.chainId!;
  const priceFeedsByToken = FeedsByNetwork[chainId];
  const tokens = new Array();
  const feeds = new Array();

  priceFeedsByToken.forEach((feed_address: string, token: Token) => {
    tokens.push(token.address);
    feeds.push(feed_address);
  });

  // @ts-ignore
  await RPSRaffle.connect(owner).configureUsdPriceFeeds(tokens, feeds);
}