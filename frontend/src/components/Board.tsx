import React from 'react';
import RGL from "react-grid-layout";
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { SizeMe } from 'react-sizeme';

import './Board.css';
import { letterValueMap } from '../helpers/LetterValues';
import { useWindowDimensions } from '../helpers/WindowDimensions';
import { isLetter } from '../helpers/Game';
import Piece from './Piece'

export interface Piece {
  i: string;
  x: number;
  y: number;
  letter: string;
  static?: boolean;
  blank?:boolean,
}

export interface PieceTray {
  i: string;
  x: number;
  letter: string;
  static?: boolean;
  blank?:boolean,
}

interface BoardProps {
  gameState: [Piece[], PieceTray[]];
  editable: boolean;
  setGameState: any;
}

export default function Board(props:BoardProps) {

  const staticLayout = [
    {i: 'empty-top', x: 0, y: 0, w: 17, h: 1, static: true},
    {i: 'empty-left', x: 0, y: 1, w: 1, h: 15, static: true},
    {i: 'empty-right', x: 16, y: 1, w: 1, h: 15, static: true},
    {i: 'empty-bottom', x: 0, y: 16, w: 17, h: 1, static: true},
    {i: 'empty-bottom2', x: 0, y: 17, w: 1, h: 1, static: true},
    {i: 'empty-bottom3', x: 9, y: 17, w: 8, h: 1, static: true},
  ];

  const padEmpty = (board:Piece[]) => {
    var ret = [];
    var counter = 0;
    for(let x = 1; x < 16; x++){
      for(let y = 1; y < 16; y++){
        if(!board.some(e => e.x === x && e.y === y)){
          ret.push({i: `empty-${counter}`, x:x, y:y, w:1, h:1, static:true});
          counter++;
        }
      }
    }
    return ret;
  }


  const mkLayout = (gameState:[Piece[],PieceTray[]], editable:boolean) => {
    const empty = editable ? [] : padEmpty(gameState[0]);
    return [
      ...staticLayout, 
      ...empty, 
      ...gameState[0].map((e:Piece) => {return {...e, w:1, h:1}}), 
      ...gameState[1].map((e:PieceTray) => {return {...e, y:17, w:1, h:1}})
    ];
  }

  const unMkLayout = (gameState:[Piece[],PieceTray[]]) => (newLayout:any) => {
    const boardAndTray = [...props.gameState[0], ...props.gameState[1]];

    const boardAndTraySet = new Set(boardAndTray.map(e => e.i))

    const newBoard = newLayout.filter((e:any) => boardAndTraySet.has(e.i) && e.y < 17).map((p:any) => {
      const n = boardAndTray.find((e:any) => e.i === p.i);
      return {...n, x: p.x, y: p.y}
    })

    const newLetters = newLayout.filter((e:any) => boardAndTraySet.has(e.i) && e.y === 17).map((p:any) => {
      const n = boardAndTray.find((e:any) => e.i === p.i);
      return {...n, x: p.x}
    })

    props.setGameState([newBoard, newLetters]);
  }


  const saveBlankLetter = (i:string) => (event:any) => {
    const { value } = event.target;
    const val = value.slice(0, 1).toUpperCase();

    if(isLetter(val) || val === '') {
      const newBoard = props.gameState[0].map(p => {
        if(p.i === i) return {...p, letter:val};
        else return p;
      })

      const newLetters = props.gameState[1].map(p => {
        if(p.i === i) return {...p, letter:val};
        else return p;
      })

      props.setGameState([newBoard, newLetters]);
    }

  };


  const mkPieces = (board:any) => {
    return board.map((e:any) => 
      <Piece key={e.i} letterValue={letterValueMap[e.letter]} saveBlankLetter={saveBlankLetter(e.i)} {...e} />
      // <div className={`Piece${e.static ? '' : ' Movable'}${e.blank ? ' Blank' : ''}`} key={e.i}>
      //   {mkLetter(e)}
      //   {!e.blank && <svg style={{width:'100%', position:'fixed', bottom:'0px', left:'0px'}} width="100%" height="100%" viewBox={`${letterValueMap[e.letter] < 10 ? -700 : -590} -500 1000 300`}>
      //     <text className="Piece Number" font-size="280" fill="black">{letterValueMap[e.letter]}</text>
      //   </svg>}
      // </div>
    );
  }



  const blockMainBoard = (board:Piece[]) => {
    return Array.from(Array(225-board.filter(e => e.y < 17).length).keys()).map(i => <div key={`empty-${i}`}></div>)
  }

  const { height } = useWindowDimensions();

  console.log("gameState", props.gameState)
  return (
    <SizeMe>
    {({ size }) => 
      <RGL 
      className="Board" 
      layout={mkLayout(props.gameState, props.editable)} 
      cols={17}
      width={size.width && height ? Math.min(size.width, height) : 300/18*17}
      rowHeight={size.width && height ? Math.min(size.width, height)/17 : 300/17}
      margin={[0,0]}
      maxRows={18}
      onLayoutChange={unMkLayout(props.gameState)}

      onDragStart={(layout, oldItem, newItem, placeholder, e, element) => {
        const e_input = document.getElementById(`${newItem.i}-input`);
        if(e_input) e_input.focus();
      }}
      compactType={null}
      preventCollision
      isResizable={false}
    >
      <div key="empty-top"></div>
      <div key="empty-left"></div>
      <div key="empty-right"></div>
      <div key="empty-bottom"></div>
      <div key="empty-bottom2"></div>
      <div key="empty-bottom3"></div>
      {mkPieces(props.gameState[0])}
      {mkPieces(props.gameState[1])}
      {!props.editable ? blockMainBoard(props.gameState[0]) : []}
    </RGL>}
  </SizeMe>
  );
}

