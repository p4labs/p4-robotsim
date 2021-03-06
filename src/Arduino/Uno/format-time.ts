function zeroPad(value: number, length: number) {
  let sval = value.toString();
  while (sval.length < length) {
    sval = '0' + sval;
  }
  return sval;
}

export function formatTime(seconds: number) {
  const ms = Math.floor(seconds * 1000) % 1000;
  const secs = Math.floor(seconds % 60);
  const mins = Math.floor(seconds / 60);
  return `${zeroPad(mins, 2)}:${zeroPad(secs, 2)}.${zeroPad(ms, 3)}`;
}

export function getMilliSecconds(seconds: number){
  const ms = Math.floor(seconds * 10000) % 10000;
  return ms/10;
}

export function getMicroSeconds(seconds : number){
  return Math.floor(seconds * 1000000) % 1000000;
}