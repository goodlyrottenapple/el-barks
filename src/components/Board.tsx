import React from 'react';
import GridLayout from "react-grid-layout";
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { SizeMe } from 'react-sizeme';

import './Board.css';
import { letterValueMap } from '../helpers/LetterValues';
import { useWindowDimensions } from '../helpers/WindowDimensions';
import { isLetter, getNextEmptySpaceInTray } from '../helpers/Game';
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
  gameState: [Piece[],PieceTray[]];
  editable: boolean;
  setGameState: any;
}

export default function Board(props:BoardProps) {

  const unMkLayout = (newLayout:any) => {
    const boardAndTray = [...props.gameState[0], ...props.gameState[1]];
    const boardAndTraySet = new Set(boardAndTray.map(e => e.i))
    const fixedLayout = [...newLayout]

    for (const i in fixedLayout) {
      if(fixedLayout[i].y > 17) {
        fixedLayout[i].x = getNextEmptySpaceInTray(fixedLayout.filter(e => e.y === 17))
        fixedLayout[i].y = 17
      }
    }


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

  const mkPiece = (board:Piece[]) => {
    return board.map((e:Piece) => 
      <Piece 
        key={e.i}
        data-grid={{x: e.x, y: e.y, w:1, h:1, i: e.i, static: e.static}}
        letterValue={letterValueMap[e.letter]} 
        saveBlankLetter={saveBlankLetter(e.i)} {...e}/>
    );
  }

  const mkPieceTray = (board:PieceTray[]) => {
    return board.map((e:PieceTray) => 
      <Piece 
        key={e.i}
        data-grid={{x: e.x, y: 17, w:1, h:1, i: e.i, static: e.static}}
        letterValue={letterValueMap[e.letter]} 
        saveBlankLetter={saveBlankLetter(e.i)} {...e}/>
    );
  }



  const blockMainBoard = (board:Piece[]) => {
    var ret = [];
    var counter = 0;
    for(let x = 1; x < 16; x++){
      for(let y = 1; y < 16; y++){
        const e = board.find(e => e.x === x && e.y === y)
        if(e)
          ret.push(<Piece 
            key={e.i}
            data-grid={{x: x, y: y, w:1, h:1, i: e.i, static: e.static}}
            letterValue={letterValueMap[e.letter]} 
            saveBlankLetter={saveBlankLetter(e.i)} {...e}/>)
        else 
          ret.push(<div 
            key={`empty-${counter}`} 
            data-grid={{i: `empty-${counter}`, x: x, y: y, w:1, h:1, static:true}}/>);
        counter++;
      }
    }
    return ret;
  }

  const { height } = useWindowDimensions();

  return (
    <SizeMe>
    {({ size }) => 
      <GridLayout 
      className="Board" 
      // layout={layout}
      cols={17}
      width={size.width && height ? Math.min(size.width, height) : 300/18*17}
      rowHeight={size.width && height ? Math.min(size.width, height)/17 : 300/17}
      margin={[0,0]}
      maxRows={18}
      onLayoutChange={unMkLayout}
      onDragStart={(_layout, _oldItem, newItem) => {
        const e_input = document.getElementById(`${newItem.i}-input`);
        if(e_input) e_input.focus();
      }}
      compactType={null}
      isResizable={false}
    >
      <div key="empty-top" data-grid={{x: 0, y: 0, w: 17, h: 1, static: true}}></div>
      <div key="empty-left" data-grid={{x: 0, y: 1, w: 1, h: 15, static: true}}></div>
      <div key="empty-right" data-grid={{x: 16, y: 1, w: 1, h: 15, static: true}}></div>
      <div key="empty-bottom" data-grid={{x: 0, y: 16, w: 17, h: 1, static: true}}></div>
      <div key="empty-bottom2" data-grid={{x: 0, y: 17, w: 1, h: 1, static: true}}></div>
      <div key="empty-bottom3" data-grid={{x: 9, y: 17, w: 8, h: 1, static: true}}></div>
      {[...(!props.editable ? blockMainBoard(props.gameState[0]) : mkPiece(props.gameState[0])), ...mkPieceTray(props.gameState[1])]}
    </GridLayout>}
  </SizeMe>
  );
}

