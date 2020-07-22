import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { ThunkDispatch } from 'redux-thunk'
import { AnyAction } from 'redux'
import { RouteComponentProps, Link } from 'react-router-dom'
import queryString from 'query-string'
import { RootState } from '../reducers'
import { verifyEmail } from '../actions/user'
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faChevronLeft} from "@fortawesome/free-solid-svg-icons";

type StateProps = {
  error: string | null,
}

type DispatchProps = {
  verify: (payload: { token: string, email: string }) => void,
}

type VerifyPageProps = StateProps & DispatchProps & RouteComponentProps<{}>

const VerifyPage = ({ verify, location, error }: VerifyPageProps) => {
  const parsed = queryString.parse(location.search);
  useEffect(() => {
    if (typeof parsed?.token === 'string' && typeof parsed?.email === 'string') {
      verify({ token: parsed?.token, email: parsed?.email })
    }
  }, [verify, parsed])
  const message = error ? 'There was an issue verifying your email 😞' : 'Thanks for verifying your email 🙂'
  return (
    <div>
      <h1 className="text-center">{message}</h1>
      <h4 className="mt-4 text-center"><Link to='/chats'><FontAwesomeIcon icon={faChevronLeft} /> Go Back to Chats</Link></h4>
    </div>
  )
}

const mapStateToProps = (state: RootState) => {
  const { error } = state
  return { error: error?.body }
}

const mapDispatchToProps = (dispatch: ThunkDispatch<{}, {}, AnyAction>) => ({
  verify: (payload: { token: string, email: string }) => dispatch(verifyEmail(payload)),
})

// @ts-ignore
export default connect(mapStateToProps, mapDispatchToProps)(VerifyPage)
