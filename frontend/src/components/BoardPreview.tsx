import React from 'react';
import RGL from "react-grid-layout";
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import './Board.css';
import { letterValueMap } from '../helpers/LetterValues';


export default function BoardPreview (props:any) {

  const staticLayout = [
    {i: 'empty-top', x: 0, y: 0, w: 17, h: 1, static: true},
    {i: 'empty-left', x: 0, y: 1, w: 1, h: 15, static: true},
    {i: 'empty-right', x: 16, y: 1, w: 1, h: 15, static: true},
    {i: 'empty-bottom', x: 0, y: 16, w: 17, h: 1, static: true},
    {i: 'empty-bottom2', x: 0, y: 17, w: 1, h: 1, static: true},
    {i: 'empty-bottom3', x: 9, y: 17, w: 8, h: 1, static: true},
  ];

  const mkLayout = (board:any[]) => {
    return [...staticLayout, ...board.map((e:any) => {return {...e, i:`${props.gameID}-${e.i}`, w:1, h:1}})];
  }

  const mkPieces = (board:any[]) => {
    return board.map((e:any) => 
      <div className="Piece" key={`${props.gameID}-${e.i}`}>
        <svg width="100%" height="100%" viewBox="-300 -350 1000 300">
          <text font-size="600" fill="black">{e.letter}</text>
        </svg>
      </div>);
  }


  return <RGL 
      className="Board Preview" 
      layout={mkLayout(props.board)} 
      cols={17}
      width={props.size}
      rowHeight={props.size/17}
      margin={[0,0]}
      maxRows={17}
      compactType={null}
      preventCollision
      isResizable={false}
    >
      <div key="empty-top"></div>
      <div key="empty-left"></div>
      <div key="empty-right"></div>
      <div key="empty-bottom"></div>
      {mkPieces(props.board)}
    </RGL>
}

