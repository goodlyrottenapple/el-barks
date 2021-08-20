import React , { useState } from 'react';
// import { Redirect } from 'react-router-dom';
import ReactModal from 'react-modal';
import * as EmailValidator from 'email-validator';
import Loader from 'react-loader-spinner';
import { supabase } from '../helpers/SupabaseClient';

import './SignIn.css'


export default function SignIn(props: any) {
  // const [redirect, setRedirect] = useState();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState<string | undefined>();
  const [emailSent, setEmailSent] = useState(false);
  const [emailIsValid, setEmailIsValid] = useState(true);
  const [error, setError] = useState<string|null>(null);

  const handleLogin = async (email : string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signIn(
      { 
        email 
      }, process.env.REACT_APP_BASE_URL ? {
        redirectTo: process.env.REACT_APP_BASE_URL
      } : {})
      if (error) throw error
      setEmailSent(true)
      // alert('Check your email for the login link!')
    } catch (error) {
      alert(error.error_description || error.message)
    } finally {
      setLoading(false)
    }
  }

  // useEffect(() => {
  //   if(props.userEmail) {
  //     if(props.match.params.email && 
  //       !(props.match.params.id === '-1' || props.match.params.id.startsWith('-1?')) &&
  //       props.match.params.email === props.userEmail) {
  //       console.log("going to game...")
  //       setRedirect(`/game/${props.match.params.id}`)
  //     }
  //     else setRedirect('/');

  //   } else if(auth().isSignInWithEmailLink(window.location.href)) {
  //     const email = props.match.params.email;
  //     // The client SDK will parse the code from the link for you.
  //     auth().signInWithEmailLink(email, window.location.href)
  //       .then(function(result) {
  //         console.log("result:", result)
  //         if(result && result.user) props.setUid(result.user.uid);
  //         if(props.match.params.id === '-1' || props.match.params.id.startsWith('-1?')) setRedirect('/');
  //         else setRedirect(`/game/${props.match.params.id}`)
  //       })
  //       .catch(function(error) {
  //         console.error(error);
  //         setRedirect('/');
  //       });
  //   } else {
  //     setLoading(false);
  //   }
  // },[]);


  return loading ? 
    <div>
      <div className="Loader"><Loader
        type="ThreeDots"
        color="#E63328"
        height={100}
        width={100}
      /></div>
    </div> :
    <div className="SignIn">
      <div className="Header">
        <img alt="" src={require('../assets/logo.svg')}/>
      </div>
      <div className="Body">
      {!emailSent ? 
        <div className="Login">
          <h3>It looks like you have not played el!barks before.</h3>
          <h3>Please log in using your email address:</h3>
          <input 
            name="email"
            type="email" 
            // value={email}
            onChange={event => {
              if(event.target.value) setEmail(event.target.value)
              setEmailIsValid(EmailValidator.validate(event.target.value))
            }}
          /> 
          <button onClick={(e) => {
            e.preventDefault()

            if(emailIsValid && email){
              handleLogin(email)
            } else {
              setError('Invalid email address')
            }
          }}>Login</button>
        </div> :
        <div className="Login">
          <h3>A login link was sent to {email}. Please open this link to log in.</h3>
        </div>
      }
      </div>

      <ReactModal className="ErrorModal" appElement={document.getElementById('root') as HTMLElement} isOpen={!(error === null)}>
        <h1>Oops...</h1>
        <p>{error}</p>
        <button onClick={() => setError(null)}>Ok</button>
      </ReactModal>
    </div>
}