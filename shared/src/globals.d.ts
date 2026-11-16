// structuredClone exists in Node 17+ and all modern browsers, but its type
// lives in the DOM / Node type packages. /shared runs in both places and
// shouldn't depend on either, so we declare just this one function.
declare function structuredClone<T>(value: T): T;
