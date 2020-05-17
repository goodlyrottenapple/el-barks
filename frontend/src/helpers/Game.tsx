import { letterValueMap, wordModifier, letterModifier } from './LetterValues';
import { Piece } from '../components/Board';


export const calculateScore = (words: Array<any[]>) => {
  return words.reduce((wAcc, w) => {
    let wMod = 1;
    const wScore = w.reduce((lAcc, l) => {
      const baseScore = l.blank ? 2 : letterValueMap[l.letter];
      if(!l.static) {
        wMod = Math.max(wMod, wordModifier(l));
        return lAcc+letterModifier(l)*baseScore;
      } else {
        return lAcc+baseScore;
      }
    }, 0);
    return wAcc+wMod*wScore;
  }, 0)
}



export const topUpLetters = (bag:any[], tray:any[]) => {
  const newBag = [...bag];
  const newLetters = newBag.splice(0, 7-tray.length);
  const newTray = [...tray];

  newLetters.forEach(l => {
    const x = getNextEmptySpaceInTray(newTray);
    newTray.push({...l, x:x})
  })
  return [newBag, newTray]
}


export const getNextEmptySpaceInTray = (tray:any[]) => {
  const spaces = new Set([1,2,3,4,5,6,7,8]);
  for (let i = 0; i < tray.length; i++) {
    spaces.delete(tray[i].x)
  }

  return Math.min(...Array.from(spaces.values()))
}


export const getAllWords = (board: Piece[]) => {
  if(board.filter(e => e.y < 17).length === 1) return [[board.filter(e => e.y < 17)], []];
  let rowWords:any = [], colWords:any = [];
  for(let y = 1; y < 16; y++) {
    const fullRow = board.filter(e => e.y === y).sort((a, b) => a.x - b.x);

    if(fullRow.length > 0){
      let current = fullRow[0];
      let buf:Piece[] = [current];
      for(let i = 1; i < fullRow.length; i++) {
        if(current.x+1 === fullRow[i].x){
          buf.push(fullRow[i]);
        } else if (buf.length > 1) {
          rowWords.push(buf);
          buf = [fullRow[i]];
        } else if (buf.length === 1) {
          buf = [fullRow[i]];
        }
        current = fullRow[i];
      }
      if (buf.length > 1) {
        rowWords.push(buf);
      }
    }
  }

  for(let x = 1; x < 16; x++) {
    const fullCol = board.filter(e => e.x === x).sort((a, b) => a.y - b.y);
    if(fullCol.length > 0){
      let current = fullCol[0];
      let buf:Piece[] = [current];
      for(let i = 1; i < fullCol.length; i++) {
        if(current.y+1 === fullCol[i].y){
          buf.push(fullCol[i]);
        } else if (buf.length > 1) {
          colWords.push(buf);
          buf = [fullCol[i]];
        } else if (buf.length === 1) {
          buf = [fullCol[i]];
        }
        current = fullCol[i];
      }
      if (buf.length > 1) {
        colWords.push(buf);
      }
    }
  }

  return [rowWords, colWords];
}

export const checkIfAllConnected = (words: Array<Piece[]>) => {
  let wordSets : Array<Set<string>> = words.map((w:any) => new Set(w.map((l:any) => `${l.x}-${l.y}`)));
  let dirty = true;
  if(wordSets.length < 2) {
    return true;
  }
  while(dirty) {
    dirty = false;
    let current = new Set(wordSets[0]);
    // console.log("current in this round", current);
    let newSets = [];
    for(let i = 1; i < wordSets.length; i++) {
      if(Array.from(wordSets[i]).filter(x => current.has(x)).length > 0){
        console.log("found intersection of", current, wordSets[i]);
        current = new Set([...Array.from(current), ...Array.from(wordSets[i])]);
        dirty = true;
      } else {
        newSets.push(wordSets[i])
      }
    }
    newSets.push(current);
    wordSets = newSets;
    // console.log("wordSets", newSets);
  }
  // console.log("final wSets", wordSets);
  return wordSets.length === 1;
}


export const isLetter = (c:string) => {
  return c.toLowerCase() !== c.toUpperCase();
}



