"use strict";

/* Bytecode instruction opcodes. */
var opcodes = {
  /* Stack Manipulation */

  PUSH:             0,    // PUSH c
  PUSH_UNDEFINED:   26,   // PUSH_UNDEFINED
  PUSH_NULL:        27,   // PUSH_NULL
  PUSH_FAILED:      28,   // PUSH_FAILED
  PUSH_EMPTY_ARRAY: 29,   // PUSH_EMPTY_ARRAY
  PUSH_CURR_POS:    1,    // PUSH_CURR_POS
  POP:              2,    // POP
  POP_CURR_POS:     3,    // POP_CURR_POS
  POP_N:            4,    // POP_N n
  NIP:              5,    // NIP
  APPEND:           6,    // APPEND
  WRAP:             7,    // WRAP n
  TEXT:             8,    // TEXT

  /* Conditions and Loops */

  IF:               9,    // IF t, f
  IF_ERROR:         10,   // IF_ERROR t, f
  IF_NOT_ERROR:     11,   // IF_NOT_ERROR t, f
  WHILE_NOT_ERROR:  12,   // WHILE_NOT_ERROR b

  /* Matching */

  MATCH_ANY:        13,   // MATCH_ANY a, f, ...
  MATCH_STRING:     14,   // MATCH_STRING s, a, f, ...
  MATCH_STRING_IC:  15,   // MATCH_STRING_IC s, a, f, ...
  MATCH_REGEXP:     16,   // MATCH_REGEXP r, a, f, ...
  ACCEPT_N:         17,   // ACCEPT_N n
  ACCEPT_STRING:    18,   // ACCEPT_STRING s
  FAIL:             19,   // FAIL e

  /* Calls */

  LOAD_SAVED_POS:   20,   // LOAD_SAVED_POS p
  UPDATE_SAVED_POS: 21,   // UPDATE_SAVED_POS
  CALL:             22,   // CALL f, n, pc, p1, p2, ..., pN

  /* Rules */

  RULE:             23,   // RULE r

  /* Failure Reporting */

  SILENT_FAILS_ON:  24,   // SILENT_FAILS_ON
  SILENT_FAILS_OFF: 25    // SILENT_FAILS_FF
};

module.exports = opcodes;
