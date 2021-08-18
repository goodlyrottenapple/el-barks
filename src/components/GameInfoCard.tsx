import React, { useState, useEffect } from 'react';
import { Redirect } from "react-router-dom";

import ReactModal from 'react-modal';
import BoardPreview from './BoardPreview';
import { RiAddLine, RiCloseLine } from 'react-icons/ri';
import { FaRegClock, FaGamepad, FaMedal } from 'react-icons/fa';
import { GiPlasticDuck } from 'react-icons/gi';
import Loader from 'react-loader-spinner';
import { supabase } from '../helpers/SupabaseClient';

import './GameInfoCard.css';

export default function GameInfoCard(props: any) {

  const [board, setBoard] = useState([]);
  const [players, setPlayers] = useState([]);
  const [cancelGame, setCancelGame] = useState(false);
  const [redirect, setRedirect] = useState(false);
  const [startedOn, setStartedOn] = useState<Date | null>();

  useEffect(() => {
    if(props.gameId) {
      getGame(props.gameId)
      getPlayers(props.gameId)
    }
  }, [props.gameId]);

  async function getGame(gameId: string) {
    try {
      const user = supabase.auth.user()

      let { data, error, status } = await supabase
        .from('game')
        .select(`board, started_on`)
        .eq('player_id', user?.id)
        .eq('id', gameId)
        .single()

      if (error && status !== 406) {
        throw error
      }

      if (data) {
        setBoard(data.board)
        setStartedOn(data.started_on)
      }
    } catch (error) {
      alert(error.message)
    }
  }


  async function getPlayers(gameId: string) {
    try {
      let { data, error, status } = await supabase
        .from('game_player_status_view')
        .select(`
          email,
          status
        `)
        .eq('game_id', gameId)

      if (error && status !== 406) {
        throw error
      }

      if (data) {
        setPlayers(data as any)
      }
    } catch (error) {
      alert(error.message)
    }
  }



  // const cancelGameFn = functions().httpsCallable('cancelGame');

  const statusIcon = (status:string) => {
    switch(status){
      case "pending": return <FaRegClock className="Status Pending"/>
      case "finished": return <GiPlasticDuck className="Status Ended"/>
      case "winner": return <FaMedal className="Status Winner"/>
      default: return <FaGamepad className="Status Playing"/>
    }
  }

  if (props.newGame) 
    return <div className="GameInfoCard" onClick={props.onClick}>
        <div className="NewGame"><RiAddLine className="AddIcon"/>New game</div>
      </div>

  if (redirect)
    return <Redirect push to={`/${props.gameId}`}/>

  return players.length === 0 ? 
      <div className="GameInfoCard">
        <div className="Loader">
          <Loader
            type="ThreeDots"
            color="#E63328"
            height={100}
            width={100}
          />
        </div>
      </div> 
    :
      <div className="GameInfoCard" onClick={() => setRedirect(true)}>
        <BoardPreview size={200} board={board} gameID={props.gameId}/>

        <div className="GameInfo">
          <div className="CancelGame" onClick={e => {e.stopPropagation(); setCancelGame(true)}}><RiCloseLine/></div>
          <span className="Date">Started on {new Date(startedOn!).toLocaleString(undefined)}</span>
          <h4 style={{marginBottom: '7px', marginTop:'5px'}}>Players</h4>
          <ul>{players.map((p:any, i) => 
            <li key={`li-${props.gameId}-${i}`}><div>{p.email}</div> {statusIcon(p.status)}</li>)}
          </ul>
        </div>
        <ReactModal className="ErrorModal" appElement={document.getElementById('root') as HTMLElement} isOpen={cancelGame}>
          <h1>Cancel game...</h1>
          <p>Are you sure you want to cancel this game?</p>
          <button className="Button WhiteRed" style={{marginRight:'5px'}} onClick={e => {
            e.stopPropagation();
            setCancelGame(false);
            // props.setLoading(true);
            props.removeGame()
            // cancelGameFn({gameID: props.gameID})
              // .catch(error => console.error(error))
          }}>Yes, cancel</button><button className="Button WhiteRed" onClick={e => {e.stopPropagation(); setCancelGame(false)}}>No, keep playing</button>
        </ReactModal>
      </div>
}