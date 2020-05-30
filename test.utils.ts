// https://github.com/facebook/jest/issues/2157#issuecomment-279171856
export const tick = () => new Promise(res => setImmediate(res));