import React, { useState, useEffect } from 'react';
import * as EmailValidator from 'email-validator';
import ReactModal from 'react-modal';
import Loader from 'react-loader-spinner';
import CreatableSelect from 'react-select/creatable';

import GameInfoCard from '../components/GameInfoCard';
import { supabase } from '../helpers/SupabaseClient';
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
  const [games, setGames] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [invited, setInvited] = useState<string[]>([]);


  useEffect(() => {
    getProfile();
    getGames();
  }, [props.session])

  async function getProfile() {
    try {
      setLoading(true)
      const user = props.session.user

      let { data, error, status } = await supabase
        .from('profiles')
        .select(`friends`)
        .eq('id', user?.id)
        .single()

      if (error && status !== 406) {
        throw error
      }

      if (data) {
        setFriends(new Set(data.friends))
        // setGames(data.games)
      }
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }


  async function getGames() {
    try {
      setLoading(true)
      const user = props.session.user

      let { data, error, status } = await supabase
        .from('game_participants')
        .select(`game_id`)
        .eq('player_id', user?.id)

      if (error && status !== 406) {
        throw error
      }

      if (data) {
        console.log(data)
        setGames(data.map(({game_id}) => game_id))
      }
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }




  // useEffect(() => {
  //   try {
  //     const unsubscribe = db.ref(`userGames/${props.uid}`).on("value", snapshot => {
  //       setLoading(false)
  //       if(snapshot) {
  //         let newGames:any[] = [];
  //         console.log("loading...")
  //         snapshot.forEach((snap) => {
  //           newGames.push({gameID:snap.key, ...snap.val()});
  //         });
  //         setGames(newGames);
  //       }
  //     });
  //     return () => (unsubscribe as any)();
  //   } catch (error) {
  //     console.error(error.message);
  //   }

  // }, [props.uid]);


  useEffect(() => {
    supabase
      .from(`game_participants:player_id=eq.${props.session.user?.id}`)
      .on('*', _payload => {
        // console.log('Change received!', payload)
        getGames();
      })
      .subscribe()

  }, []);



  async function updateFriends(newFriends: string[]) {
    try {
      setLoading(true)
      const user = props.session.user

      const updates = {
        id: user?.id,
        friends: newFriends,
        updated_at: new Date(),
      }

      let { error } = await supabase.from('profiles').upsert(updates, {
        returning: 'minimal', // Don't return the value after inserting
      })

      if (error) {
        throw error
      }
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }


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
          return <GameInfoCard key={e} session gameId={e} removeGame={() => {
            console.log("deleting"); 
            const newGames = games.filter((_,j) => i !== j);
            setGames(newGames)
            // updateGame(newGames);
          }} setLoading={setLoading} {...e}/>
        })}

        <GameInfoCard newGame onClick={() => setNewGameModal(true)} session />

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
        <button className="Button White" style={{marginRight:'5px'}} onClick={async () => {
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
            if(e === supabase.auth.user()?.email){
              setError(`You can't invite yourself to a game.`);
              return;
            }
            if(!friends.has(e)) {
              newFriends.push(e)
            }
          }

          if(newFriends.length !== friends.size) {
            console.log("updating friends");
            updateFriends(Array.from(newFriends))
          }
          
          // setLoading(true);
          console.log("creating game...")

          const { error } = await supabase
            .rpc('new_game', { originator: supabase.auth.user()?.email, players: invited })

          if(error) setError(`${error}`)
          // else {
              // supabase.auth.api.sendMagicLinkEmail("a@b.com", {redirectTo: "aaa" })
          // }

          // createGame({invited: invited, signup_url:`${process.env.REACT_APP_DOMAIN}/signIn`}).then(res => {
          //   // Read result of the Cloud Function.
          //   console.log("added: ", res);
          //   setGames([...games, res])
          // }).catch(error => console.error(error))
        }}>Invite</button>
        <button className="Button White" onClick={() => setNewGameModal(false)}>Cancel</button>
      </ReactModal>
    </div>
  );
}