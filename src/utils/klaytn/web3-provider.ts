/**
 * Copied from web3-provider.ts of @ethersproject/provider @v5.5.0, in order to
 * have a Klaytn-compatible Web3Provider.
 */

import { Networkish } from '@ethersproject/networks'
import { deepCopy, defineReadOnly } from '@ethersproject/properties'

import { Logger } from '@ethersproject/logger'

import { version } from './version'
import { JsonRpcProvider } from './json-rpc-provider'

const logger = new Logger(version)

// Exported Types
export type ExternalProvider = {
  isMetaMask?: boolean
  isStatus?: boolean
  host?: string
  path?: string
  sendAsync?: (request: { method: string; params?: Array<any> }, callback: (error: any, response: any) => void) => void
  send?: (request: { method: string; params?: Array<any> }, callback: (error: any, response: any) => void) => void
  request?: (request: { method: string; params?: Array<any> }) => Promise<any>
}

let _nextId = 1

export type JsonRpcFetchFunc = (method: string, params?: Array<any>) => Promise<any>

type Web3LegacySend = (request: any, callback: (error: Error, response: any) => void) => void

function buildWeb3LegacyFetcher(provider: ExternalProvider, sendFunc: Web3LegacySend): JsonRpcFetchFunc {
  const fetcher = 'Web3LegacyFetcher'

  return function (method: string, params: Array<any>): Promise<any> {
    const request = {
      method,
      params,
      id: _nextId++,
      jsonrpc: '2.0',
    }

    return new Promise((resolve, reject) => {
      // @ts-ignore
      this.emit('debug', {
        action: 'request',
        fetcher,
        request: deepCopy(request),
        // @ts-ignore
        provider: this,
      })

      // eslint-disable-next-line consistent-return
      sendFunc(request, (error, response) => {
        if (error) {
          // @ts-ignore
          this.emit('debug', {
            action: 'response',
            fetcher,
            error,
            request,
            // @ts-ignore
            provider: this,
          })

          return reject(error)
        }

        // @ts-ignore
        this.emit('debug', {
          action: 'response',
          fetcher,
          request,
          response,
          // @ts-ignore
          provider: this,
        })

        if (response.error) {
          // eslint-disable-next-line @typescript-eslint/no-shadow
          const error = new Error(response.error.message)
          ;(<any>error).code = response.error.code
          ;(<any>error).data = response.error.data
          return reject(error)
        }

        resolve(response.result)
      })
    })
  }
}

function buildEip1193Fetcher(provider: ExternalProvider): JsonRpcFetchFunc {
  return function (method: string, params: Array<any>): Promise<any> {
    if (params == null) {
      // eslint-disable-next-line no-param-reassign
      params = []
    }

    const request = { method, params }

    // @ts-ignore
    this.emit('debug', {
      action: 'request',
      fetcher: 'Eip1193Fetcher',
      request: deepCopy(request),
      // @ts-ignore
      provider: this,
    })

    return provider.request(request).then(
      (response) => {
        // @ts-ignore
        this.emit('debug', {
          action: 'response',
          fetcher: 'Eip1193Fetcher',
          request,
          response,
          // @ts-ignore
          provider: this,
        })

        return response
      },
      (error) => {
        // @ts-ignore
        this.emit('debug', {
          action: 'response',
          fetcher: 'Eip1193Fetcher',
          request,
          error,
          // @ts-ignore
          provider: this,
        })

        throw error
      },
    )
  }
}

export class Web3Provider extends JsonRpcProvider {
  readonly provider: ExternalProvider

  readonly jsonRpcFetchFunc: JsonRpcFetchFunc

  constructor(provider: ExternalProvider | JsonRpcFetchFunc, network?: Networkish) {
    logger.checkNew(new.target, Web3Provider)

    if (provider == null) {
      logger.throwArgumentError('missing provider', 'provider', provider)
    }

    let path: string = null
    let jsonRpcFetchFunc: JsonRpcFetchFunc = null
    let subprovider: ExternalProvider = null

    if (typeof provider === 'function') {
      path = 'unknown:'
      jsonRpcFetchFunc = provider
    } else {
      path = provider.host || provider.path || ''
      if (!path && provider.isMetaMask) {
        path = 'metamask'
      }

      subprovider = provider

      if (provider.request) {
        if (path === '') {
          path = 'eip-1193:'
        }
        jsonRpcFetchFunc = buildEip1193Fetcher(provider)
      } else if (provider.sendAsync) {
        jsonRpcFetchFunc = buildWeb3LegacyFetcher(provider, provider.sendAsync.bind(provider))
      } else if (provider.send) {
        jsonRpcFetchFunc = buildWeb3LegacyFetcher(provider, provider.send.bind(provider))
      } else {
        logger.throwArgumentError('unsupported provider', 'provider', provider)
      }

      if (!path) {
        path = 'unknown:'
      }
    }

    super(path, network)

    defineReadOnly(this, 'jsonRpcFetchFunc', jsonRpcFetchFunc)
    defineReadOnly(this, 'provider', subprovider)
  }

  send(method: string, params: Array<any>): Promise<any> {
    return this.jsonRpcFetchFunc(method, params)
  }
}
