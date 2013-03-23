/* Bytecode instruction opcodes. */
module.exports = {
  /* Stack Manipulation */
  PUSH:             0,    // PUSH c
  PUSH_CURR_POS:    1,    // PUSH_CURR_POS
  PUSH_EMPTY_ARRAY: 2,    // PUSH_EMPTY_ARRAY
  POP:              3,    // POP
  POP_CURR_POS:     4,    // POP_CURR_POS
  POP_N:            5,    // POP_N n
  NIP:              6,    // NIP
  NIP_CURR_POS:     7,    // NIP_CURR_POS
  APPEND:           8,    // APPEND
  WRAP:             9,    // WRAP n
  TEXT:             10,   // TEXT

  /* Conditions and Loops */

  IF:               11,   // IF t, f
  IF_ERROR:         12,   // IF_ERROR t, f
  IF_NOT_ERROR:     13,   // IF_NOT_ERROR t, f
  WHILE_NOT_ERROR:  14,   // WHILE_NOT_ERROR b

  /* Matching */

  MATCH_ANY:        15,   // MATCH_ANY a, f, ...
  MATCH_STRING:     16,   // MATCH_STRING s, a, f, ...
  MATCH_STRING_IC:  17,   // MATCH_STRING_IC s, a, f, ...
  MATCH_REGEXP:     18,   // MATCH_REGEXP r, a, f, ...
  ACCEPT_N:         19,   // ACCEPT_N n
  ACCEPT_STRING:    20,   // ACCEPT_STRING s
  FAIL:             21,   // FAIL e

  /* Calls */

  REPORT_SAVED_POS: 22,   // REPORT_SAVED_POS p
  REPORT_CURR_POS:  23,   // REPORT_CURR_POS
  CALL:             24,   // CALL f, n, pc, p1, p2, ..., pN

  /* Rules */

  RULE:             25,   // RULE r

  /* Failure Reporting */

  SILENT_FAILS_ON:  26,   // SILENT_FAILS_ON
  SILENT_FAILS_OFF: 27    // SILENT_FAILS_FF
};
