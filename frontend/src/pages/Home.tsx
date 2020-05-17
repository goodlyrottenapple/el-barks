import React, { useState, useEffect } from 'react';
import * as EmailValidator from 'email-validator';
import ReactModal from 'react-modal';
import Loader from 'react-loader-spinner';
import CreatableSelect from 'react-select/creatable';

import GameInfoCard from '../components/GameInfoCard';
import { db, functions } from "../helpers/Firebase"
import './Home.css'


const customStyles = {
  option: (provided:any, state:any) => ({
    ...provided,
    // borderBottom: '1px dotted pink',
    color: 'blue',
    padding: 20,
  }),
  control: (provided:any) => ({
    ...provided,
    background: 'none',
    width: '100%',
    
    border: '2px solid #E9E4D1'
  }),
  input: (provided:any) => ({
    ...provided,
    paddingTop: '15px',
  }),
}

export default function Home(props: any) {
  const [friends, setFriends] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string|null>(null);
  const [newGameModal, setNewGameModal] = useState(false);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [invited, setInvited] = useState<string[]>([]);


  useEffect(() => {
    try {
      const unsubscribe = db.ref(`userGames/${props.uid}`).on("value", snapshot => {
        setLoading(false)
        if(snapshot) {
          let newGames:any[] = [];
          console.log("loading...")
          snapshot.forEach((snap) => {
            newGames.push({gameID:snap.key, ...snap.val()});
          });
          setGames(newGames);
        }
      });
      return () => (unsubscribe as any)();
    } catch (error) {
      console.error(error.message);
    }

  }, [props.uid]);


  useEffect(() => {
    try {
      const unsubscribe = db.ref(`userFriends/${props.uid}`).on("value", snapshot => {
        setLoading(false)
        if(snapshot) {
          const data = snapshot.val();
          console.log("loading users...", data)
          if(data) setFriends(new Set(data))
        }
      });
      return () => (unsubscribe as any)();
    } catch (error) {
      console.error(error.message);
    }

  }, []);


  const createGame = functions().httpsCallable('createGame');


  const handleGameInviteSelect  = (selectedOption:any) => {
    console.log(`Option selected:`, selectedOption);
    setInvited(selectedOption.map((e:any) => e.value))
  }

  return (<div className="Home">
      <div className="Header">
        <img alt="" src={require('../assets/logo.svg')}/>
      </div>
      <div className="Body">
        <h1>Current games</h1>
        <div className="Games">

        {games.map((e,i) => {
          console.log(e);
          return <GameInfoCard key={e.gameID} removeGame={() => {
            console.log("deleting"); 
            setGames(games.filter((_,j) => i !== j))
            db.ref(`userGames/${props.uid}/${e.gameID}`).remove()
          }} setLoading={setLoading} {...e}/>
        })}

        <GameInfoCard newGame onClick={() => setNewGameModal(true)} />

        </div>
      </div>

      <ReactModal className="ErrorModal" appElement={document.getElementById('root') as HTMLElement} isOpen={!(error === null)}>
        <h1>Oops...</h1>
        <p>{error}</p>
        <button className="Button WhiteRed" onClick={() => setError(null)}>Ok</button>
      </ReactModal>

      <ReactModal className="LoadingModal" appElement={document.getElementById('root') as HTMLElement} isOpen={loading}>
        <div className="Loader">
          <Loader
            type="ThreeDots"
            color="#E63328"
            height={100}
            width={100}
          />
        </div>
      </ReactModal>

      <ReactModal className="EditModal" appElement={document.getElementById('root') as HTMLElement} isOpen={newGameModal}>
        <h1>New game...</h1>
        <div style={{paddingBottom:'2em'}}>
        <h2>Invite other players to play with you...</h2>

        <CreatableSelect 
          placeholder="enter player's email address..."
          styles={customStyles}
          theme={theme => ({
              ...theme,
              colors: {
                  ...theme.colors,
                  neutral50: '#E9E4D1',  // Placeholder color
              },
          })}

          onChange={handleGameInviteSelect}
          formatCreateLabel={userInput => `Invite '${userInput}'`}
          isClearable isMulti options={Array.from(friends).map(e => ({label: e, value: e}))} />

        
        </div>
        <button className="Button White" style={{marginRight:'5px'}} onClick={() => {
          setNewGameModal(false)

          if(invited.length > 3) {
            setError(`You can only invite 3 other players to this game.`);
            return;
          }

          const newFriends = Array.from(friends)
          for(const e of invited){
            if(!EmailValidator.validate(e)) {
              setError(`'${e}' is not a valid email address.`);
              return;
            }
            if(e === props.userEmail){
              setError(`You can't invite yourself to a game.`);
              return;
            }
            if(!friends.has(e)) {
              newFriends.push(e)
            }
          }

          if(newFriends.length !== friends.size) {
            console.log("updating friends");
            db.ref(`userFriends/${props.uid}`).set(newFriends)
          }
          
          // setLoading(true);
          console.log("creating game...")
          createGame({invited: invited, signup_url:`${process.env.REACT_APP_DOMAIN}/signIn`}).then(res => {
            // Read result of the Cloud Function.
            console.log("added: ", res);
            setGames([...games, res])
          }).catch(error => console.error(error))
        }}>Invite</button>
        <button className="Button White" onClick={() => setNewGameModal(false)}>Cancel</button>
      </ReactModal>
    </div>
  );
}