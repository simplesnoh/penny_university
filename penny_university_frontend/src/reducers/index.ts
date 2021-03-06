import {
  combineReducers, applyMiddleware, createStore, compose, AnyAction,
} from 'redux'
import { connectRouter, routerMiddleware } from 'connected-react-router'
import { createBrowserHistory } from 'history'

import { normalize } from 'normalizr'
import thunk from 'redux-thunk'
import { ChatActions, UserActions } from '../actions'
import paginate, { paginationInitialState } from './paginate'
import user, { initialState as userInitialState } from './user'
import { Actions as UserAction } from '../actions/user'
import api from '../middleware/api'
import logging from '../middleware/logging'
import userMiddleware from '../middleware/user'
import { Schemas } from '../models/schemas'

// Eventually we will want to move this into a DEV configuration
const composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

// Updates an entity cache in response to any action
// with response.entities, such as a CHATS_LIST_SUCCESS

const failureTypes = [
  ChatActions.CHATS_LIST_FAILURE,
  ChatActions.CHAT_DETAIL_FAILURE,
  ChatActions.FOLLOW_UPS_FAILURE,
  ChatActions.CREATE_FOLLOW_UP_FAILURE,
  ChatActions.UPDATE_FOLLOW_UP_FAILURE,
  UserActions.FETCH_USER_FAILURE,
  UserActions.LOGIN_FAILURE,
  UserActions.SIGNUP_FAILURE,
  UserActions.LOGOUT_FAILURE,
  UserActions.RESEND_VERIFY_EMAIL_FAILURE,
  UserActions.VERIFY_EMAIL_FAILURE,
  UserActions.RESET_PASSWORD_FAILURE,
]

const entities = (state: EntityState = { chats: {}, followUps: {}, users: {} }, action: AnyAction): EntityState => {
  const { result, responseSchema } = action.payload || {}
  if (result && Object.keys(result).length > 0 && responseSchema) {
    const { entities: { chats = {}, users = {}, followUps = {} } = {} } = normalize(result, responseSchema)
    return {
      chats: {
        ...state.chats,
        ...chats,
      },
      users: {
        ...state.users,
        ...users,
      },
      followUps: {
        ...state.followUps,
        ...followUps,
      },
    }
  }
  if (action.type === UserAction.UPDATE_USER_SUCCESS) {
    const newState = { ...state }
    newState.users[action.payload.result.id] = { ...newState.users[action.payload.result.id], ...action.payload.result }
    return newState
  }
  if (action.type === ChatActions.DELETE_FOLLOW_UP_SUCCESS) {
    const newState = { ...state }
    delete newState.followUps[action.payload.meta.followUpID]
    return newState
  }
  return state
}

const errorReducer = (state = { status: NaN, body: null }, action: AnyAction): ErrorState => {
  const { type, payload } = action
  if (type === ChatActions.CLEAR_ERROR_MESSAGE) {
    return { status: NaN, body: null }
  } if (failureTypes.includes(action.type)) {
    return payload
  }
  return state
}

const pagination = combineReducers({
  chatsByFilter: paginate({
    mapActionToKey: (action?: AnyAction) => action?.payload?.meta?.userID || 'all',
    types: {
      requestTypes: [ChatActions.CHATS_LIST_REQUEST],
      successTypes: [ChatActions.CHATS_LIST_SUCCESS],
      failureTypes: [ChatActions.CHATS_LIST_FAILURE],
      deleteTypes: [],
    },
  }),
  followUpsByChat: paginate({
    mapActionToKey: (action?: AnyAction) => action?.payload?.meta?.chatID,
    types: {
      requestTypes: [ChatActions.FOLLOW_UPS_REQUEST],
      successTypes: [ChatActions.FOLLOW_UPS_SUCCESS, ChatActions.CREATE_FOLLOW_UP_SUCCESS],
      failureTypes: [ChatActions.FOLLOW_UPS_FAILURE],
      deleteTypes: [ChatActions.DELETE_FOLLOW_UP_SUCCESS],
    },
  }),
})

export const initialState = {
  user: userInitialState,
  entities: {
    chats: {},
    followUps: {},
    users: {},
  },
  pagination: paginationInitialState,
  error: { status: NaN, body: null },
}

export const history = createBrowserHistory()

export const rootReducer = combineReducers({
  router: connectRouter(history),
  entities,
  error: errorReducer,
  pagination,
  user,
})

// @ts-ignore
const store = createStore(rootReducer, initialState, composeEnhancers(
  applyMiddleware(routerMiddleware(history), thunk, api, userMiddleware, logging),
))

export type RootState = ReturnType<typeof rootReducer>

export {
  Schemas,
}

export default store
