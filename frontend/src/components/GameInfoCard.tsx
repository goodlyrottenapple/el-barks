import React, { useState, useEffect } from 'react';
import { Redirect } from "react-router-dom";

import ReactModal from 'react-modal';
import BoardPreview from './BoardPreview';
import { RiAddLine, RiCloseLine } from 'react-icons/ri';
import { FaRegClock, FaGamepad, FaMedal } from 'react-icons/fa';
import { GiPlasticDuck } from 'react-icons/gi';
import Loader from 'react-loader-spinner';

import { db, functions } from "../helpers/Firebase"
import './GameInfoCard.css';

export default function GameInfoCard(props: any) {
  const [board, setBoard] = useState([]);
  const [players, setPlayers] = useState([]);
  const [cancelGame, setCancelGame] = useState(false);
  const [redirect, setRedirect] = useState(false);

  useEffect(() => {
    try {
      const unsubscribe = db.ref(`game/${props.gameID}/public`).on("value", snapshot => {
        if(snapshot){
          const data = snapshot.val();
          console.log("got data here", data)
          if(data) {
            console.log("data", data)
            if(data.board) setBoard(data.board)
            if(data.players) setPlayers(data.players)
          }
        }
      });
      return (unsubscribe as any);
    } catch (error) {
      console.error(error.message);
    }

  }, [props.gameID]);

  const cancelGameFn = functions().httpsCallable('cancelGame');

  const statusIcon = (status:string) => {
    switch(status){
      case "pending": return <FaRegClock className="Status Pending"/>
      case "finished": return <GiPlasticDuck className="Status Ended"/>
      case "winner": return <FaMedal className="Status Winner"/>
      default: return <FaGamepad className="Status Playing"/>
    }
  }

  return props.newGame? 
    <div className="GameInfoCard" onClick={props.onClick}>
      <div className="NewGame"><RiAddLine className="AddIcon"/>New game</div>
    </div> : (redirect ?
    <Redirect push to={`/game/${props.gameID}`}/> :
    (players.length === 0 ? <div className="GameInfoCard">
      <div className="Loader">
        <Loader
          type="ThreeDots"
          color="#E63328"
          height={100}
          width={100}
        />
      </div>
    </div> :
    <div className="GameInfoCard" onClick={() => setRedirect(true)}>

      <BoardPreview size={200} board={board} gameID={props.gameID}/>

      <div className="GameInfo">
        <div className="CancelGame" onClick={e => {e.stopPropagation(); setCancelGame(true)}}><RiCloseLine/></div>
        <span className="Date">Started on {props.creation_date}</span>
        <h4 style={{marginBottom: '7px', marginTop:'5px'}}>Players</h4>
        <ul>{players.map((p:any, i) => 
          <li key={`li-${props.gameID}-${i}`}><div>{p.email}</div> {statusIcon(p.status)}</li>)}
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
          cancelGameFn({gameID: props.gameID})
            .catch(error => console.error(error))
        }}>Yes, cancel</button><button className="Button WhiteRed" onClick={e => {e.stopPropagation(); setCancelGame(false)}}>No, keep playing</button>
      </ReactModal>
      </div>
    ))
}