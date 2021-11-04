import { Team } from 'config/constants/types'
import { TeamsById } from 'state/types'

export const getTeam = async (teamId: number): Promise<Team> => {
  return {
    id: teamId,
    name: 'Fake team',
    description: 'A fake team',
    isJoinable: false,
    users: 0,
    points: 0,
    images: {
      alt: '',
      md: '',
      sm: '',
      lg: '',
    },
    background: '',
    textColor: '',
  }
}

/**
 * Gets on-chain data and merges it with the existing static list of teams
 */
export const getTeams = async (): Promise<TeamsById> => {
  return {}
}
