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
  const [ shouldAnimate, setShouldAnimate ] = useState(2);
  const mountedStyle = { opacity: 1, boxShadow: "inset 0px 0px 0px 0px rgba(16,173,229,1)", transition: "opacity 500ms ease-in, box-shadow 10s ease-in-out"};
  const unmountedStyle = { opacity: 0, boxShadow: "inset 0px 0px 10px 5px rgba(16,173,229,1)", transition: "opacity 500ms ease-in"};
  const glowingStyle = { 
    opacity: 0, 
    boxShadow: "inset 0px 0px 10px 5px rgba(16,173,229,1)", 
    // transition: "box-shadow 0.5s ease-in-out" 
  };


  useEffect(() => {
    let timeoutId2:any;
    const timeoutId1 = setTimeout(
      () => {
        setShouldAnimate(1);
        timeoutId2 = setTimeout(
          () => setShouldAnimate(0),
          2000
        );
      }, 
      100
    );
    return () => { 
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
    }
  }, []);

  const mkLetter = () => {
    if (props.blank) {
      if(props.static) {
        return <svg width="100%" height="100%" viewBox="-300 -350 1000 300">
            <text fontSize="600" fill="black">{props.letter}</text>
          </svg>
      } else {
        return <input id={`${props.i}-input`} type="text" value={props.letter} onChange={props.saveBlankLetter} />
      }
    } else {
      return <svg width="100%" height="100%" viewBox="-300 -350 1000 300">
          <text fontSize="600" fill="black">{props.letter}</text>
        </svg>
    }
  }

  const animStyle = (shouldAnim: number) => {
    switch (shouldAnim) {
      case 2: return unmountedStyle;
      case 1: return glowingStyle;
      case 0: return mountedStyle;
    }
  }

  return <div 
    key={props.key} 
    className={`Piece${props.static ? '' : ' Movable'}${props.blank ? ' Blank' : ''} `+ props.className} 
    style={{ ...(props.static && animStyle(shouldAnimate)), ...props.style, borderRadius: '5px'}}
    data-grid={props.grid}
    onMouseUp={props.onMouseUp}
    onMouseDown={props.onMouseDown}
    onTouchStart={props.onTouchStart}
    onTouchEnd={props.onTouchEnd}>
      {mkLetter()}
      {!props.blank && <svg style={{width:'100%', position:'fixed', bottom:'0px', left:'0px'}} width="100%" height="100%" viewBox={`${props.letterValue < 10 ? -700 : -590} -500 1000 300`}>
        <text className="Piece Number" fontSize="280" fill="black">{props.letterValue}</text>
      </svg>}
    </div>
}

