import sample from 'lodash/sample'

if (!process.env.REACT_APP_NODE_PRODUCTION) {
  throw Error(
    'Production RPC URL is undeinfed. Check if REACT_APP_NODE_PRODUCTION enviornment variable is defined and valid.',
  )
}

// Array of available nodes to connect to
export const nodes = [process.env.REACT_APP_NODE_PRODUCTION]

const getNodeUrl = () => {
  return process.env.REACT_APP_NODE_PRODUCTION
}

export default getNodeUrl
