export const letterValueMap : { [key:string]:number; } = {
  'A': 1,
  'E': 1, 
  'I': 1,
  'O': 1,
  'U': 1,
  'L': 1,
  'N': 1,
  'S': 1,
  'T': 1,
  'R': 1,
  'D': 2,
  'G': 2,
  'B': 3,
  'C': 3,
  'M': 3,
  'P': 3,
  'F': 4,
  'H': 4,
  'V': 4,
  'W': 4,
  'Y': 4,
  'K': 5,
  'J': 8,
  'X': 8,
  'Q': 10,
  'Z': 10,
  ' ': 2
}


export const wordModifier = (l : any) => {
  const tripleWord = new Set([
    '1-1', '8-1', '15-1', 
    '1-8', '15-8', 
    '1-15', '8-15', '15-15'])
  const doubleWord = new Set([
    '2-2', '14-2', 
    '3-3', '13-3', 
    '4-4', '12-4', 
    '5-5', '11-5',
    '8-8',
    '5-11', '11-11', 
    '4-12', '12-12', 
    '3-13', '13-13', 
    '2-14', '14-14'
  ]);

  if(tripleWord.has(`${l.x}-${l.y}`)) return 3;
  if(doubleWord.has(`${l.x}-${l.y}`)) return 2;
  return 1;
}

export const letterModifier = (l : any) => {
  const tripleLetter = new Set([
    '6-2', '10-2', 
    '2-6', '6-6', '10-6', '14-6',
    '2-10', '6-10', '10-10', '14-10',
    '6-14', '10-14'
  ]);
  const doubleLetter = new Set([
    '4-1', '12-1',
    '7-3', '9-3', 
    '1-4', '8-4', '15-4',
    '3-7', '7-7', '9-7', '13-7',
    '4-8', '12-8',
    '3-9', '7-9', '9-9', '13-9',
    '1-12', '8-12', '15-12',
    '7-13', '9-13',
    '4-15', '12-15'
    ]);

  if(tripleLetter.has(`${l.x}-${l.y}`)) return 3;
  if(doubleLetter.has(`${l.x}-${l.y}`)) return 2;
  return 1;
}