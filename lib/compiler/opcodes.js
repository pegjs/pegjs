/* Bytecode instruction opcodes. */
module.exports = {
  /* Stack Manipulation */

  PUSH:             0,    // PUSH c
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
  IF_ARRLEN_MIN:    12,   // IF_ARRLEN_MIN t f
  IF_ARRLEN_MAX:    13,   // IF_ARRLEN_MAX t f
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
  SILENT_FAILS_OFF: 27    // SILENT_FAILS_OFF
};
