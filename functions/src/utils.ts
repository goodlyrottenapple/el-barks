export function shuffle(array:any[]) {
  let currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

export function topUpLetters(bag:any[], tray:any[]) {
  const newBag = [...bag];
  const newLetters = newBag.splice(0, 7-tray.length);
  const newTray = [...tray];

  newLetters.forEach(l => {
    const x = getNextEmptySpaceInTray(newTray);
    newTray.push({...l, x:x})
  })
  return [newBag, newTray]
}


export function getNextEmptySpaceInTray(tray:any[]) {
  const spaces = new Set([1,2,3,4,5,6,7,8]);
  for (let i = 0; i < tray.length; i++) {
    spaces.delete(tray[i].x)
  }

  return Math.min(...Array.from(spaces.values()))
}