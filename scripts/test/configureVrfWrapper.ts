import { Contract } from 'ethers';

export async function configureVRFV2Wrapper(VRFV2Wrapper: Contract) {
  const _wrapperGasOverhead = 60000;
  const _coordinatorGasOverhead = 52000;
  const _wrapperPremiumPercentage = 10;
  const _keyHash = "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc";
  const _maxNumWords = 10;
  await VRFV2Wrapper.setConfig(
    _wrapperGasOverhead, 
    _coordinatorGasOverhead, 
    _wrapperPremiumPercentage,
    _keyHash, 
    _maxNumWords
  );

  return VRFV2Wrapper;
}