import { decodeJsonParamsAsString } from '../dist/cjs/index.js';

// These benchmark results vary from run to run on my multi-tasking
// machine, with no consistent bias. All seem to perform about the same.

const sampleParams =
  "param1='string1$'&param2=1234&param3=true&param4='string2%20with%20%27single-quote'&list=('abc',123,'def%27,hij')&last='ending%20with%20single-quote'";

const ITERATIONS = 2000000;

const lookupFunc = decodeJsonParamsAsString.bind({}, sampleParams);

const switchFunc = () => {
  return (
    '{"' +
    decodeURIComponent(
      sampleParams.replace(/'|\(|\)|=|&/g, (match) => {
        switch (match) {
          case "'":
            return `"`;
          case '(':
            return '[';
          case ')':
            return ']';
          case '=':
            return `":`;
          case '&':
            return `,"`;
        }
        throw Error(`Unexpected match: [${match}]`);
      })
    ) +
    '}'
  );
};

const sequentialFunc = () => {
  return (
    '{"' +
    decodeURIComponent(
      sampleParams
        .replaceAll("'", '"')
        .replaceAll('(', '[')
        .replaceAll(')', ']')
        .replaceAll('=', '":')
        .replaceAll('&', ',"')
    ) +
    '}'
  );
};

const result = lookupFunc();
//console.log('\nRESULT:', result);
if (switchFunc() !== result || sequentialFunc() !== result) {
  //console.log('**** Functions are not equivalent');
  throw Error('Functions are not equivalent');
}

console.log('settling down...');
await new Promise((resolve) => setTimeout(resolve, 2000));
const [lookupTime, lookupHeap] = benchmark('lookup', ITERATIONS, lookupFunc);
const [switchTime, switchHeap] = benchmark('switch', ITERATIONS, switchFunc);
const [sequentialTime, sequentialHeap] = benchmark(
  'sequential',
  ITERATIONS,
  sequentialFunc
);

console.log('\nTime:');
const fastestTime = Math.min(lookupTime, switchTime, sequentialTime);
console.log(
  `  Lookup: ${multiplier(lookupTime, fastestTime)}x, ${lookupTime} ms`
);
console.log(
  `  Switch: ${multiplier(switchTime, fastestTime)}x, ${switchTime} ms`
);
console.log(
  `  Sequential: ${multiplier(
    sequentialTime,
    fastestTime
  )}x, ${sequentialTime} ms`
);

console.log('\nHeap:');
const smallestHeap = Math.min(lookupHeap, switchHeap, sequentialHeap);
console.log(
  `  Lookup: ${multiplier(lookupHeap, smallestHeap)}x, ${lookupHeap} bytes`
);
console.log(
  `  Switch: ${multiplier(switchHeap, smallestHeap)}x, ${switchHeap} bytes`
);
console.log(
  `  Sequential: ${multiplier(
    sequentialHeap,
    smallestHeap
  )}x, ${sequentialHeap} bytes`
);
console.log();

function benchmark(name, iterations, func) {
  console.log(`running ${name} benchmark...`);

  gc();
  const startHeap = process.memoryUsage().heapUsed;
  const startTime = performance.now();

  for (let i = 0; i < iterations; ++i) {
    //console.log(func());
    func();
  }

  const endTime = performance.now();
  const endHeap = process.memoryUsage().heapUsed;
  return [endTime - startTime, endHeap - startHeap];
}

function multiplier(sample, best) {
  return Math.round((sample * 100) / best) / 100;
}
