import React, { useState, useEffect } from 'react';

// export interface PieceProps {
//   i: string;
//   x: number;
//   y: number;
//   letter: string;
//   static?: boolean;
//   blank?:boolean,
// }

export default function Piece(props:any) {
  const [ shouldAnimate, setShouldAnimate ] = useState(true);
  const mountedStyle = {opacity: 1, transition: "opacity 500ms ease-in"};
  const unmountedStyle = {opacity: 0, transition: "opacity 500ms ease-in"};


  useEffect(() => {
    const timeoutId = setTimeout(
      () => setShouldAnimate(false), 
      500
    );
    return () => clearTimeout(timeoutId);
  }, []);

  const mkLetter = () => {
    if (props.blank) {
      if(props.static) {
        return <svg width="100%" height="100%" viewBox="-300 -350 1000 300">
            <text font-size="600" fill="black">{props.letter}</text>
          </svg>
      } else {
        return <input id={`${props.i}-input`} type="text" value={props.letter} onChange={props.saveBlankLetter} />
      }
    } else {
      return <svg width="100%" height="100%" viewBox="-300 -350 1000 300">
          <text font-size="600" fill="black">{props.letter}</text>
        </svg>
    }
  }

  return <div 
    key={props.key} 
    className={`Piece${props.static ? '' : ' Movable'}${props.blank ? ' Blank' : ''} `+ props.className} 
    style={{...(props.static && shouldAnimate ? unmountedStyle : mountedStyle), ...props.style}}
    data-grid={props.grid}
    onMouseUp={props.onMouseUp}
    onMouseDown={props.onMouseDown}
    onTouchStart={props.onTouchStart}
    onTouchEnd={props.onTouchEnd}>
      {mkLetter()}
      {!props.blank && <svg style={{width:'100%', position:'fixed', bottom:'0px', left:'0px'}} width="100%" height="100%" viewBox={`${props.letterValue < 10 ? -700 : -590} -500 1000 300`}>
        <text className="Piece Number" font-size="280" fill="black">{props.letterValue}</text>
      </svg>}
    </div>
}

