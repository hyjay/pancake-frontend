import { AbstractConnectorArguments, ConnectorUpdate } from '@web3-react/types'
import { AbstractConnector } from '@web3-react/abstract-connector'
import warning from 'tiny-warning'

import { SendReturnResult, SendReturn, Send, SendOld } from './types'

const __DEV__ = true

function parseSendReturn(sendReturn: SendReturnResult | SendReturn): any {
  // eslint-disable-next-line no-prototype-builtins
  return sendReturn.hasOwnProperty('result') ? sendReturn.result : sendReturn
}

export class NoKlaytnProviderError extends Error {
  public constructor() {
    super()
    this.name = this.constructor.name
    this.message = 'No Klaytn provider was found on window.klaytn.'
  }
}

export class UserRejectedRequestError extends Error {
  public constructor() {
    super()
    this.name = this.constructor.name
    this.message = 'The user rejected the request.'
  }
}

export class KaikasConnector extends AbstractConnector {
  constructor(kwargs: AbstractConnectorArguments) {
    super(kwargs)

    this.handleNetworkChanged = this.handleNetworkChanged.bind(this)
    this.handleAccountsChanged = this.handleAccountsChanged.bind(this)
  }

  private handleAccountsChanged(accounts: string[]): void {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log("Handling 'accountsChanged' event with payload", accounts)
    }
    if (accounts.length === 0) {
      this.emitDeactivate()
    } else {
      this.emitUpdate({ account: accounts[0] })
    }
  }

  private handleNetworkChanged(networkId: string | number): void {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log("Handling 'networkChanged' event with payload", networkId)
    }
    this.emitUpdate({ chainId: networkId, provider: window.klaytn })
  }

  public async activate(): Promise<ConnectorUpdate> {
    if (!window.klaytn) {
      throw new NoKlaytnProviderError()
    }

    if (window.klaytn.on) {
      window.klaytn.on('accountsChanged', this.handleAccountsChanged)
      window.klaytn.on('networkChanged', this.handleNetworkChanged)
    }

    if ((window.klaytn as any).isMetaMask) {
      // eslint-disable-next-line @typescript-eslint/no-extra-semi
      ;(window.klaytn as any).autoRefreshOnNetworkChange = false
    }

    // try to activate + get account via eth_requestAccounts
    let account
    try {
      account = await (window.klaytn.send as Send)('eth_requestAccounts').then(
        (sendReturn) => parseSendReturn(sendReturn)[0],
      )
    } catch (error) {
      if ((error as any).code === 4001) {
        throw new UserRejectedRequestError()
      }
      warning(false, 'eth_requestAccounts was unsuccessful, falling back to enable')
    }

    // if unsuccessful, try enable
    if (!account) {
      // if enable is successful but doesn't return accounts, fall back to getAccount (not happy i have to do this...)
      account = await window.klaytn.enable().then((sendReturn) => sendReturn && parseSendReturn(sendReturn)[0])
    }

    return { provider: window.klaytn, ...(account ? { account } : {}) }
  }

  // eslint-disable-next-line class-methods-use-this
  public async getProvider(): Promise<any> {
    return window.klaytn
  }

  // eslint-disable-next-line class-methods-use-this
  public async getChainId(): Promise<number | string> {
    if (!window.klaytn) {
      throw new NoKlaytnProviderError()
    }

    let chainId
    try {
      chainId = await (window.klaytn.send as Send)('eth_chainId').then(parseSendReturn)
    } catch {
      warning(false, 'eth_chainId was unsuccessful, falling back to net_version')
    }

    if (!chainId) {
      try {
        chainId = await (window.klaytn.send as Send)('net_version').then(parseSendReturn)
      } catch {
        warning(false, 'net_version was unsuccessful, falling back to net version v2')
      }
    }

    if (!chainId) {
      try {
        chainId = parseSendReturn((window.klaytn.send as SendOld)({ method: 'net_version' }))
      } catch {
        warning(false, 'net_version v2 was unsuccessful, falling back to manual matches and static properties')
      }
    }

    if (!chainId) {
      if ((window.klaytn as any).isDapper) {
        chainId = parseSendReturn((window.klaytn as any).cachedResults.net_version)
      } else {
        chainId =
          (window.klaytn as any).chainId ||
          (window.klaytn as any).netVersion ||
          (window.klaytn as any).networkVersion ||
          (window.klaytn as any)._chainId
      }
    }

    return chainId
  }

  // eslint-disable-next-line class-methods-use-this
  public async getAccount(): Promise<null | string> {
    if (!window.klaytn) {
      throw new NoKlaytnProviderError()
    }

    let account
    try {
      account = await (window.klaytn.send as Send)('eth_accounts').then((sendReturn) => parseSendReturn(sendReturn)[0])
    } catch {
      warning(false, 'eth_accounts was unsuccessful, falling back to enable')
    }

    if (!account) {
      try {
        account = await window.klaytn.enable().then((sendReturn) => parseSendReturn(sendReturn)[0])
      } catch {
        warning(false, 'enable was unsuccessful, falling back to eth_accounts v2')
      }
    }

    if (!account) {
      account = parseSendReturn((window.klaytn.send as SendOld)({ method: 'eth_accounts' }))[0]
    }

    return account
  }

  public deactivate() {
    if (window.klaytn && window.klaytn.removeListener) {
      window.klaytn.removeListener('accountsChanged', this.handleAccountsChanged)
      window.klaytn.removeListener('networkChanged', this.handleNetworkChanged)
    }
  }

  // eslint-disable-next-line class-methods-use-this
  public async isAuthorized(): Promise<boolean> {
    if (!window.klaytn) {
      return false
    }

    try {
      return await (window.klaytn.send as Send)('eth_accounts').then((sendReturn) => {
        if (parseSendReturn(sendReturn).length > 0) {
          return true
        }
        return false
      })
    } catch {
      return false
    }
  }
}
