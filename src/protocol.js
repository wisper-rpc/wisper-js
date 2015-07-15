// import WisperError from './error.es6';

// Checks whether the `msg` is a `wisper.protocol.Message`.
export function isMessage(msg) {
  return msg && (isInvoke(msg) || isResponse(msg) || isPlainError(msg));
}


export function isInvoke(msg) {
  return ('method' in msg && Array.isArray(msg.params));
}


export function isPlainError(msg) {
  return 'error' in msg;
}


// Checks whether the `msg` is a `wisper.protocol.ResponseMessage`.
export function isResponse(msg) {
  return 'id' in msg && ('result' in msg || 'error' in msg);
}


export function isResult(msg) {
  return 'id' in msg && 'result' in msg;
}


export function isError(msg) {
  return 'id' in msg && 'error' in msg;
}
