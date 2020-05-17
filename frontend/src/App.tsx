import React, { useState, useEffect } from 'react';
import {
  Route,
  BrowserRouter as Router,
  Switch,
  Redirect,
} from "react-router-dom";

import Loader from 'react-loader-spinner';

import Home from './pages/Home';
import Game from './pages/Game';
import SignIn from './pages/SignIn';

import { auth } from './helpers/Firebase';
import './App.css';


function App() {
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState();
  const [userEmail, setUserEmail] = useState();
  const [userNick, setUserNick] = useState();

  useEffect(() => {
    auth().onAuthStateChanged((user) => {
      if (user) {
        setUid(user.uid);
        setUserNick(user.displayName);
        setUserEmail(user.email);
        setLoading(false);
      } else {
        setUid(null); 
        setLoading(false);
      }
    })

  })

  return loading ? <div><div className="Loader"><Loader
      type="ThreeDots"
      color="#E63328"
      height={100}
      width={100}
    /></div></div> :
    <Router>
      <Switch>
        <Route exact path="/" 
          render={(props) => uid
          ? <Home uid={uid} userEmail={userEmail} user={userNick} {...props} />
          : <Redirect to={{ pathname: '/signIn', state: { from: props.location } }} />}>
        </Route>
        <Route path="/game/:id" 
          render={(props) => uid
          ? <Game uid={uid} user={userNick} {...props} />
          : <Redirect to={{ pathname: `/signIn/${props.match.params.id}`, state: { from: props.location } }} />}>
          </Route>
        <Route path="/signIn/:email/:id" render={(props) => <SignIn userEmail={userEmail} setUid={setUid} {...props}/>}></Route>
        <Route path="/signIn" render={(props) => <SignIn userEmail={userEmail} setUid={setUid} {...props}/>}></Route>
      </Switch>
    </Router>
}

export default App;
