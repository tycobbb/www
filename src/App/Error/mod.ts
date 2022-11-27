// a fatal error that terminates the program
export class Fatal extends Error {
}

// a warning that logs but continues execution
export class Warning extends Error {
}