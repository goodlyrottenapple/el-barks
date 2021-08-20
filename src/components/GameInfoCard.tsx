import React, { useState, useEffect } from 'react';
import { Redirect } from "react-router-dom";

import ReactModal from 'react-modal';
import BoardPreview from './BoardPreview';
import { RiAddLine, RiCloseLine } from 'react-icons/ri';
import { FaRegClock, FaGamepad, FaMedal, FaBan } from 'react-icons/fa';
import { GiPlasticDuck } from 'react-icons/gi';
import Loader from 'react-loader-spinner';

import { Player } from '../pages/Game';

import './GameInfoCard.css';

export interface GameInfo {
  game_id: string;
  status: "active" | "finished" | "cancelled";
  players: Player[];
  started_on: Date;
  board: any[];
}

export default function GameInfoCard(props: {key?: any; gameInfo? : GameInfo; onClick?: () => void; removeGame?: () => void;}) {

  const [cancelGame, setCancelGame] = useState(false);
  const [redirect, setRedirect] = useState(false);
  
  const statusIcon = (status:string, gameStatus: string) => {
    if(gameStatus == "cancelled") return <FaBan className="Status Cancelled"/>
    switch(status){
      case "pending": return <FaRegClock className="Status Pending"/>
      case "finished": return <GiPlasticDuck className="Status Ended"/>
      case "winner": return <FaMedal className="Status Winner"/>
      default: return <FaGamepad className="Status Playing"/>
    }
  }

  if (props.gameInfo) {
    if (redirect)
      return <Redirect push to={`/${props.gameInfo.game_id}`}/>

    return props.gameInfo.players.length === 0 ? 
        <div className="GameInfoCard col-xs-12 col-sm-12 col-md-6 col-lg-4">
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
        <div className="GameInfoCard col-xs-12 col-sm-12 col-md-6 col-lg-4" onClick={() => setRedirect(true)}>
          <BoardPreview size={200} board={props.gameInfo.board} gameID={props.gameInfo.game_id}/>

          <div className="GameInfo">
            {props.removeGame && <div className="CancelGame" onClick={e => {e.stopPropagation(); setCancelGame(true)}}><RiCloseLine/></div>}
            <span className="Date">Started on {new Date(props.gameInfo.started_on).toLocaleString(undefined)}</span>
            <h4 style={{marginBottom: '7px', marginTop:'5px'}}>Players</h4>
            <ul>{props.gameInfo.players.map((p:Player, i) => 
              <li key={`li-${props.gameInfo!.game_id}-${i}`}><div className="Email">{p.email}</div> {statusIcon(p.status, props.gameInfo!.status)}</li>)}
            </ul>
          </div>
          <ReactModal className="ErrorModal" appElement={document.getElementById('root') as HTMLElement} isOpen={cancelGame}>
            <h1>Cancel game...</h1>
            <p>Are you sure you want to cancel this game?</p>
            <button className="Button WhiteRed" style={{marginRight:'5px'}} onClick={e => {
              e.stopPropagation();
              setCancelGame(false);
              // props.setLoading(true);
              if(props.removeGame) props.removeGame()
              // cancelGameFn({gameID: props.gameID})
                // .catch(error => console.error(error))
            }}>Yes, cancel</button><button className="Button WhiteRed" onClick={e => {e.stopPropagation(); setCancelGame(false)}}>No, keep playing</button>
          </ReactModal>
        </div>
  } else {
    return <div className="GameInfoCard col-xs-12 col-sm-12 col-md-6 col-lg-4" onClick={props.onClick}>
        <div className="NewGame"><RiAddLine className="AddIcon"/>New game</div>
      </div>
  }
}