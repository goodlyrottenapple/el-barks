import React, { useState, useEffect } from 'react';
import {
  Route,
  BrowserRouter as Router,
  Switch,
  // Redirect,
} from "react-router-dom";

import Loader from 'react-loader-spinner';
import { Session } from '@supabase/supabase-js';
import { supabase } from './helpers/SupabaseClient';

import Home from './pages/Home';
import Game from './pages/Game';
import SignIn from './pages/SignIn';

import './App.css';


function App() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    setSession(supabase.auth.session());
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    setLoading(false);
  }, [])

  return loading ? <div><div className="Loader"><Loader
      type="ThreeDots"
      color="#E63328"
      height={100}
      width={100}
    /></div></div> :
    <Router>
      <Switch>
        <Route exact path="/" 
          render={(props) => session
          ? <Home session={session} {...props} />
          : <SignIn {...props}/>
        } />
        <Route path="/:id" 
          render={(props) => session
          ? <Game session={session} {...props} />
          : <SignIn {...props}/>
        } />
      </Switch>
    </Router>
}

export default App;
