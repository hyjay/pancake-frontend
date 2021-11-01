import { ethers } from 'ethers'
import Caver from 'caver-js'
import getRpcUrl from 'utils/getRpcUrl'

const RPC_URL = getRpcUrl()

const caver = new Caver(RPC_URL)
const klaytnProvider = new caver.providers.HttpProvider(RPC_URL)
export const simpleRpcProvider = new ethers.providers.Web3Provider(klaytnProvider)

export default null
