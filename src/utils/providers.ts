import Caver from 'caver-js'
import getRpcUrl from 'utils/getRpcUrl'
import { Web3Provider } from './klaytn/web3-provider'

const RPC_URL = getRpcUrl()

const caver = new Caver(RPC_URL)
const klaytnProvider = new caver.providers.HttpProvider(RPC_URL)
export const simpleRpcProvider = new Web3Provider(klaytnProvider)

export default null
