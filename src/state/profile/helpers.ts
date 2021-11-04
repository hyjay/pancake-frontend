import { Profile } from 'state/types'

export interface GetProfileResponse {
  hasRegistered: boolean
  profile?: Profile
}

const profileApi = process.env.REACT_APP_API_PROFILE

export const getUsername = async (address: string): Promise<string> => {
  try {
    const response = await fetch(`${profileApi}/api/users/${address.toLowerCase()}`)

    if (!response.ok) {
      return ''
    }

    const { username = '' } = await response.json()

    return username
  } catch (error) {
    return ''
  }
}

/**
 * Intended to be used for getting a profile avatar
 */
export const getProfileAvatar = async (address: string) => {
  // eslint-disable-next-line no-console
  console.log(`getProfileAvatar: address: ${address}`)
  return { nft: null, hasRegistered: false }
}

export const getProfile = async (address: string): Promise<GetProfileResponse> => {
  const hasRegistered = false
  // eslint-disable-next-line no-console
  console.log(`getProfile: address: ${address}`)
  return { hasRegistered, profile: null }
}
