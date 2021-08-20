import React, { useState, useEffect } from 'react';
import ReactModal from 'react-modal';
import Loader from 'react-loader-spinner';
import { Link } from "react-router-dom";
import useSound from 'use-sound';
import { FaVolumeOff, FaVolumeUp } from 'react-icons/fa';
import { useStickyState } from '../helpers/StickyState';

import * as PTrie from 'dawg-lookup/lib/ptrie';
import { supabase } from '../helpers/SupabaseClient';

import Board, { Piece, PieceTray } from '../components/Board';
import { calculateScore, getNextEmptySpaceInTray, getAllWords, checkIfAllConnected } from '../helpers/Game';
import './Game.css';



export interface Player {
  email: string;
  status: "winner" | "finished" | "playing" | "skipped";
  player_id: string;
  score: number;
  blank?:boolean,
}

export default function Game(props:any) {
  const gameId = props.match.params.id;
  const [loading, setLoading] = useState(true);

  // const [prevBoard, setPrevBoard] = useState<Piece[]>([]);
  const [gameCurrentState, setGameCurrentState] = useState<[Piece[], PieceTray[]]>([[], []]);
  const [boardServerState, setBoardServerState] = useState<Piece[]>([]);

  const [gameStatus, setGameStatus] = useState<"active" | "finished" | "cancelled">("active");

  const [dictionary,setDictionary] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);


  const [publicPlayers, setPublicPlayers] = useState<Player[]>([]);
  const [endGameModal, setEndGameModal] = useState(false);

  const popMP3 = require('../assets/pop.mp3')
  const [playPop] = useSound(popMP3);
  const [volume, setVolume] = useStickyState(false, "volume")

  const isMyTurn = publicPlayers[0] && props.session.user && publicPlayers[0].player_id === props.session.user.id;

  useEffect(() => {
    if (volume && isMyTurn) playPop();
  }, [volume, isMyTurn, playPop])


  useEffect(()=>{
    const dict = require('../assets/dictionary.txt');
    fetch(dict)
    .then(r => r.text())
    .then(text => setDictionary(new PTrie.PTrie(text)))
    .catch(console.error)
  }, []);


  useEffect(() => {
    console.log("subscribing", gameId)
    if (gameId) supabase
      .from(`game_board:game_id=eq.${gameId}`)
      .on('*', async function(payload) {
        // console.log('Change received!', payload.new.board, payload.new.board.join())
        const board: any[] = Array.from(new Set(JSON.parse(`[${payload.new.board.join()}]`).map((e : string) => JSON.parse(e))));
        if (JSON.stringify(board) !== JSON.stringify(gameCurrentState[0])) {
          console.log("not equal", board, gameCurrentState[0])
          setGameCurrentState(([_, tray]) => [board, tray]);
          setBoardServerState(board);
        }
        getLetterTray();
        getPlayers(gameId);
        setGameStatus(payload.new.status);
      })
      .subscribe()

  }, [gameId]);


  async function getBoard() {
    try {

      let { data, error, status } = await supabase
        .from('game_board')
        .select(`board, status`)
        .eq('game_id', gameId)
        .single()

      if (error && status !== 406) {
        throw error
      }

      if (data) {
        // console.log("getting game data", data.board)
        const no_dups : any[] = Array.from(new Set(data.board));
        setGameCurrentState(([_, tray]) => [no_dups, tray]);
        setBoardServerState(no_dups);
        setGameStatus(data.status)
      }
    } catch (error) {
      alert(error.message)
    }
  }

  async function getLetterTray() {
    try {

      let { data, error, status } = await supabase
        .from('game_letter_tray')
        .select(`letter_tray`)
        .eq('game_id', gameId)
        .eq('player_id', props.session.user.id)
        .single()

      if (error && status !== 406) {
        throw error
      }

      if (data) {
        console.log("getting game letter tray data", data.letter_tray)
        const no_dups = Array.from(new Set(data.letter_tray));
        let has_x : any[] = no_dups.filter((o : any) => 'x' in o && !isNaN(o.x) && Number.isFinite(o.x));
        const no_x : any[] = no_dups.filter((o : any) => !('x' in o));

        for (const l of no_x) {
          const x_val = getNextEmptySpaceInTray(has_x);
          has_x.push({...l, x: x_val})
        }

        setGameCurrentState(([board, _]) => [board, has_x]);
      }
    } catch (error) {
      alert(error.message)
    }
  }

  async function getPlayers(gameId: string) {
    try {
      const { data,  error } = await supabase
        .rpc('view_game_status', { game_id: gameId })

      if (error) {
        throw error
      }

      if (data) {
        setPublicPlayers(data as any)
      }
    } catch (error) {
      alert(error.message)
    }
  }

  async function initLoadData(gid: string) {
    await Promise.all([getBoard(), getLetterTray(), getPlayers(gid)]);
    setLoading(false)
  }

  useEffect(() => {
    if (gameId) initLoadData(gameId)
  }, [gameId]);

  async function skipRound() {
    try {
      const { error } = await supabase
        .rpc('skip_round', { 
          game_id: gameId, 
          player_id: props.session.user.id
        })

      if (error) {
        throw error
      }
      
      setEndGameModal(false);
    } catch (error) {
      alert(error.message)
    }
  }

  async function updateBoard(updatedBoard:Piece[], updatedTray: PieceTray[], newScore:number) {
    setGameCurrentState([updatedBoard, updatedTray])
    try {
      const { error } = await supabase
        .rpc('update_board', { 
          game_id: gameId, 
          player_id: props.session.user.id,
          new_board: updatedBoard,
          new_letter_tray: updatedTray,
          round_score: newScore
        })

      if (error) {
        throw error
      }
      setLoading(false);
    } catch (error) {
      alert(error.message)
    }
  }
  const validateBoard = (oldBoard: Piece[], newBoard: Piece[]) => {
    setLoading(true);
    if(!isMyTurn) throw new Error("It's not currently your turn. Wait for your opponents to play.")
    console.log("validating", newBoard)
    const oldBoardOnTheBoard = oldBoard;
    const movableOnTheBoard = newBoard.filter(e => !e.static);

    console.log("validate", oldBoard, newBoard)
    
    if (movableOnTheBoard.length === 0) {
      throw new Error("You haven't placed any new tiles on the board.")
    }

    if (oldBoardOnTheBoard.length === 0 && !movableOnTheBoard.find(e => e.x === 8 && e.y === 8)) {
      throw new Error ("Your starting word must be placed over the star.")
    }
    var horizontalWord = true, verticalWord = true;
    var x = movableOnTheBoard[0].x, y = movableOnTheBoard[0].y;
    if (movableOnTheBoard.length > 1){
      for (let i = 1; i < movableOnTheBoard.length; i++) {
        if(x !== movableOnTheBoard[i].x) {
          verticalWord = false;
        }
        if(y !== movableOnTheBoard[i].y) {
          horizontalWord = false;
        }
      }
      if(!horizontalWord && !verticalWord) throw new Error("This is not a valid move. Place tiles in a row or a column.")
    }


    const [rowW, colW] = getAllWords(newBoard);
    const allWords = [...rowW, ...colW];
    const lettersFromAllWords = allWords.reduce((s, w) => new Set([...Array.from(s), ...w.map((l:any) => `${l.x}-${l.y}`) ]), new Set([]))
    
    console.log("allWords", allWords)
    console.log("lettersFromAllWords", lettersFromAllWords, newBoard.filter(e => e.y < 17))

    if(!newBoard.filter(e => e.y < 17).reduce((b, l) => b && lettersFromAllWords.has(`${l.x}-${l.y}`), true)) {
      throw new Error("This is not a contiguous word.")
    }
    if(!checkIfAllConnected(allWords)) throw new Error("This word is not connected to any previously played words.")

    const allNewWords = allWords.filter(w => w.some((l:Piece) => !l.static))
    allNewWords.forEach(w => {
      const word = w.reduce((s:string,l:Piece) => {
        if(l.letter === ''){
          throw new Error("Please fill in the letter in the blank piece.")
        }
        return s.concat(l.letter.toLowerCase());
      }, '');
      if (!dictionary.isWord(word)){
        throw new Error(`The word '${word.toUpperCase()}' is not valid.`)
      }
    });

    let score = calculateScore(allNewWords);
    const numberOfTilesPlayed = newBoard.filter(l => l.y < 17 && !l.static).length
    if(numberOfTilesPlayed === 7) {
      console.log("score bonus!");
      score += 50;
    }

    console.log("score", score);

    const updatedBoard = newBoard.map(l => l.y < 17 ? {...l, static: true} : l)

    updateBoard(updatedBoard, gameCurrentState[1], score)
  }

  return (
    <div className="Game">
      <button className={`Sound${volume ? '' : ' Mute'}`} onClick={() => setVolume(!volume)}>{volume ? <FaVolumeUp/> : <FaVolumeOff/>}</button>
      <div className="Sidebar" >
      <Link className="Logo" to="/"><img alt="" src={require('../assets/logo.svg')}/></Link>

      <div className="ButtonGroup">
        <button className="Button Green" onClick={() => {
          try {
            validateBoard(boardServerState, gameCurrentState[0])
          } catch(e) {
            setLoading(false);
            setError(e.message);
          }
        }}>Play</button>

        <button className="Button" onClick={() => setEndGameModal(true)}>Skip</button>
      </div>

      <div className="Scores">
        <div className="Heading"><h2>Players</h2></div>
        {publicPlayers.map(({player_id, email, score}, i) => 
          <div key={`player-${player_id}`} className={`Turn${i === 0 ? ' MyTurn' : ''}`}>
          {/* <div key={`player-${i}`} className={`Turn${i === userTurn ? ' MyTurn' : (gameIsFinished && p.status === "winner" ? ' Winner':'')}${i===playerID ?' Me':''}`}> */}
            <div className="Name">{props.session.user.id===player_id ? 'me' : email}</div>
            <div className="Score">{score}</div>
          </div>)}
      </div>
    </div>
    <Board 
      gameState={gameCurrentState} 
      setGameState={setGameCurrentState} 
      editable={isMyTurn}/>

    <ReactModal 
      className="WinModal" 
      appElement={document.getElementById('root') as HTMLElement} 
      isOpen={gameStatus === "finished" && publicPlayers.find(p => p.player_id == props.session.user.id)?.status == "winner"}
    >
      <h1>You won!</h1>
      <p>Congratulations on winning this game.</p>
    </ReactModal>

    <ReactModal 
      className="EndModal" 
      appElement={document.getElementById('root') as HTMLElement} 
      isOpen={gameStatus === "finished" && publicPlayers.find(p => p.player_id == props.session.user.id)?.status == "finished"}>
      <h1>Oh well...</h1>
      <p>You'll get them next time!</p>
    </ReactModal>

    <ReactModal 
      className="ErrorModal" 
      appElement={document.getElementById('root') as HTMLElement} 
      isOpen={gameStatus === "cancelled"}>
      <h1>This game was cancelled! Booo...</h1>
      <p>Maybe you could start a new game. Just go back to the main menu and invite your frinds!</p>
    </ReactModal>

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

    <ReactModal className="EndModal" appElement={document.getElementById('root') as HTMLElement} isOpen={endGameModal}>
        <h1>Skip round...</h1>
        <p>Are you sure you want to skip this round?</p>
        <button className="Button WhiteBlack" style={{marginRight:'5px'}} onClick={_ => skipRound()}>Yes</button>
        <button className="Button WhiteBlack" onClick={_ => setEndGameModal(false)}>No, play this round</button>
      </ReactModal>
  </div>
  );
}