import { normalize, schema } from 'normalizr'
import { camelizeKeys, decamelizeKeys } from 'humps'
import * as selectors from '../selectors'

const API_ROOT = 'http://localhost:8000/api/'

// Makes an API call, and properly formats the response.
const callApi = (endpoint, responseSchema, method, payload, token) => {
  const url = (endpoint.indexOf(API_ROOT) === -1) ? API_ROOT + endpoint : endpoint

  const jsonPayload = JSON.stringify(decamelizeKeys(payload))
  const headers = { 'Content-Type': 'application/json' }
  if (token) {
    headers.Authorization = `Token ${token}`
  }
  switch (method) {
    case 'POST':
    case 'PUT':
      return fetch(url, { method, body: jsonPayload, headers })
        .then((response) => response.json().then((json) => {
          if (!response.ok) {
            return Promise.reject(response)
          }
          const camelJson = json.results ? camelizeKeys(json.results) : camelizeKeys(json)
          return camelJson
        }))
    default:
      return fetch(url, { headers })
        .then((response) => response.json().then((json) => {
          if (!response.ok) {
            return Promise.reject(response)
          }

          const camelJson = json.results ? camelizeKeys(json.results) : camelizeKeys(json)
          return camelJson
        }))
  }
}

const userProfileSchema = new schema.Entity('userProfiles', {}, {
  idAttribute: (userProfile) => userProfile.id,
})

const chatSchema = new schema.Entity('chats', {
  participants: [{
    userProfile: userProfileSchema,
  }],
}, {
  idAttribute: (chat) => chat.id,
})

const followUpSchema = new schema.Entity('followUps', {
  pennyChat: chatSchema,
  userProfile: userProfileSchema,
}, {
  idAttribute: (followUp) => followUp.id,
})

// Schemas for the responses from the API
export const Schemas = {
  CHAT: chatSchema,
  CHAT_ARRAY: [chatSchema],
  USER: userProfileSchema,
  USER_ARRAY: [userProfileSchema],
  FOLLOW_UP: followUpSchema,
  FOLLOW_UP_ARRAY: [followUpSchema],
}

export const CALL_API = 'CALL_API'

// A Redux middleware that interprets actions with CALL_API info specified.
// Performs the call and promises when such actions are dispatched.
export default (store) => (next) => (action) => {
  if (action.type === CALL_API) {
    let { endpoint } = action.payload
    const {
      schema: responseSchema, types, method, payload, meta,
    } = action.payload
    if (typeof endpoint === 'function') {
      endpoint = endpoint(store.getState())
    }

    if (typeof endpoint !== 'string') {
      throw new Error('Specify a string endpoint URL.')
    }
    // We will always pass a request, success, and failure action type
    if (!Array.isArray(types) || types.length !== 3) {
      throw new Error('Expected an array of three action types.')
    }
    if (!types.every((type) => typeof type === 'string')) {
      throw new Error('Expected action types to be strings.')
    }

    const [requestType, successType, failureType] = types
    next({ type: requestType, payload: { meta } })
    const token = selectors.user.getToken(store.getState())
    return callApi(endpoint, responseSchema, method, payload, token).then(
      (response) => next({
        payload: { result: response, responseSchema, meta },
        type: successType,
      }),
      (error) => next({
        type: failureType,
        payload: { message: error.message || 'An error occurred.', status: error.status, meta },
      }),
      )
    }
    return next(action)
}
