import React, { useState, useEffect } from 'react';
import * as EmailValidator from 'email-validator';
import ReactModal from 'react-modal';
import Loader from 'react-loader-spinner';
import CreatableSelect from 'react-select/creatable';

import GameInfoCard, { GameInfo } from '../components/GameInfoCard';
import { supabase } from '../helpers/SupabaseClient';
import './Home.css'
import '../helpers/flexboxgrid.css'

import Collapsible from 'react-collapsible';

const customStyles = {
  option: (provided:any, state:any) => ({
    ...provided,
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
  const [games, setGames] = useState<GameInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [invited, setInvited] = useState<string[]>([]);

  useEffect(() => {
    getProfile();
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
      }

      await getGames();
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }


  async function getGames() {
    try {

      const { data,  error } = await supabase
        .rpc('view_all_games', { player_id: props.session.user?.id })

      if (error) {
        throw error
      }

      if (data) {
        setGames(data as any)
      }
    } catch (error) {
      alert(error.message)
    }
  }


  async function cancelGame(id: String) {
    try {

      const { data,  error } = await supabase
        .rpc('cancel_game', { game_id: id })

      if (error) {
        throw error
      }
    } catch (error) {
      alert(error.message)
    }
  }


  useEffect(() => {
    supabase
      .from(`game_participants:player_id=eq.${props.session.user?.id}`)
      .on('*', _payload => {
        console.log('Change received!', _payload)
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

  const archivedGames = games.filter(g => g.status !== "active");

  return (<div className="Home">
      <div className="Header">
        <img alt="" src={require('../assets/logo.svg')}/>
      </div>
      <div className="Body">
        <h1>Current games</h1>
          <div className="Games row">
            {games.filter(g => g.status === "active").map((g: GameInfo) => {
              return <GameInfoCard key={g.game_id} gameInfo={g} removeGame={() => cancelGame(g.game_id)} />
            })}
            <GameInfoCard onClick={() => setNewGameModal(true)} />
          </div>
        <br/>

        {archivedGames.length > 0 && <Collapsible trigger="Archived games">
          <div className="Games row">
            {archivedGames.map((g: GameInfo) => {
              return <GameInfoCard key={g.game_id} gameInfo={g} 
              />
            })}
          </div>
        </Collapsible>}
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
        }}>Invite</button>
        <button className="Button White" onClick={() => setNewGameModal(false)}>Cancel</button>
      </ReactModal>
    </div>
  );
}