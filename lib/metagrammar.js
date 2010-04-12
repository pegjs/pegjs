PEG.grammarParser = (function(){
  var result = {
    _startRule: "grammar",
    
    _quoteString: function(s) {
      /*
       * ECMA-262, 5th ed., 7.8.4: All characters may appear literally in a string
       * literal except for the closing quote character, backslash, carriage
       * return, line separator, paragraph separator, and line feed. Any character
       * may appear in the form of an escape sequence.
       */
      return '"' + s
        .replace(/\\/g, '\\\\')        // backslash
        .replace(/"/g, '\\"')          // closing quote character
        .replace(/\r/g, '\\r')         // carriage return
        .replace(/\u2028/g, '\\u2028') // line separator
        .replace(/\u2029/g, '\\u2029') // paragraph separator
        .replace(/\n/g, '\\n')         // line feed
        + '"';
    },
    
    _arrayContains: function(array, value) {
      /*
       * Stupid IE does not have Array.prototype.indexOf, otherwise this function
       * would be a one-liner.
       */
      var length = array.length;
      for (var i = 0; i < length; i++) {
        if (array[i] === value) {
          return true;
        }
      }
      return false;
    },
    
    _matchFailed: function(failure) {
      if (this._pos > this._rightmostMatchFailuresPos) {
        this._rightmostMatchFailuresPos = this._pos;
        this._rightmostMatchFailuresExpected = [];
      }
      
      if (!this._arrayContains(this._rightmostMatchFailuresExpected, failure)) {
        this._rightmostMatchFailuresExpected.push(failure);
      }
    },
    
    _parse_grammar: function(context) {
      var cacheKey = "grammar" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var savedPos0 = this._pos;
      var result2 = this._parse___(context);
      if (result2 !== null) {
        var savedPos1 = this._pos;
        var result5 = this._parse_rule(context);
        if (result5 !== null) {
          var result6 = [];
          var result7 = this._parse_rule(context);
          while (result7 !== null) {
            result6.push(result7);
            var result7 = this._parse_rule(context);
          }
          if (result6 !== null) {
            var result4 = [result5, result6];
          } else {
            var result4 = null;
            this._pos = savedPos1;
          }
        } else {
          var result4 = null;
          this._pos = savedPos1;
        }
        var result3 = result4 !== null
          ? (
          function (first, rest) {
              return [first].concat(rest);
          }
          ).apply(this, result4)
          : null;
        if (result3 !== null) {
          var result1 = [result2, result3];
        } else {
          var result1 = null;
          this._pos = savedPos0;
        }
      } else {
        var result1 = null;
        this._pos = savedPos0;
      }
      var result0 = result1 !== null
        ? (function() { 
          var result = {};
          PEG.ArrayUtils.each((arguments[1]), function(rule) { result[rule.getName()] = rule; });
          return result;
         }).apply(this, result1)
        : null;
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result0
      };
      return result0;
    },
    
    _parse_rule: function(context) {
      var cacheKey = "rule" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var savedPos2 = this._pos;
      var result10 = this._parse_identifier(context);
      if (result10 !== null) {
        var result15 = this._parse_literal(context);
        if (result15 !== null) {
          var result11 = result15;
        } else {
          if (this._input.substr(this._pos, 0) === "") {
            var result14 = "";
            this._pos += 0;
          } else {
            var result14 = null;
            if (context.reportMatchFailures) {
              this._matchFailed(this._quoteString(""));
            }
          }
          if (result14 !== null) {
            var result11 = result14;
          } else {
            var result11 = null;;
          };
        }
        if (result11 !== null) {
          var result12 = this._parse_colon(context);
          if (result12 !== null) {
            var result13 = this._parse_expression(context);
            if (result13 !== null) {
              var result9 = [result10, result11, result12, result13];
            } else {
              var result9 = null;
              this._pos = savedPos2;
            }
          } else {
            var result9 = null;
            this._pos = savedPos2;
          }
        } else {
          var result9 = null;
          this._pos = savedPos2;
        }
      } else {
        var result9 = null;
        this._pos = savedPos2;
      }
      var result8 = result9 !== null
        ? (function() { 
          return new PEG.Grammar.Rule((arguments[0]), (arguments[1]) !== "" ? (arguments[1]) : null, (arguments[3]));
         }).apply(this, result9)
        : null;
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result8
      };
      return result8;
    },
    
    _parse_expression: function(context) {
      var cacheKey = "expression" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var result16 = this._parse_choice(context);
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result16
      };
      return result16;
    },
    
    _parse_choice: function(context) {
      var cacheKey = "choice" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var savedPos3 = this._pos;
      var result19 = this._parse_sequence(context);
      if (result19 !== null) {
        var result20 = [];
        var savedPos4 = this._pos;
        var result22 = this._parse_slash(context);
        if (result22 !== null) {
          var result23 = this._parse_sequence(context);
          if (result23 !== null) {
            var result21 = [result22, result23];
          } else {
            var result21 = null;
            this._pos = savedPos4;
          }
        } else {
          var result21 = null;
          this._pos = savedPos4;
        }
        while (result21 !== null) {
          result20.push(result21);
          var savedPos4 = this._pos;
          var result22 = this._parse_slash(context);
          if (result22 !== null) {
            var result23 = this._parse_sequence(context);
            if (result23 !== null) {
              var result21 = [result22, result23];
            } else {
              var result21 = null;
              this._pos = savedPos4;
            }
          } else {
            var result21 = null;
            this._pos = savedPos4;
          }
        }
        if (result20 !== null) {
          var result18 = [result19, result20];
        } else {
          var result18 = null;
          this._pos = savedPos3;
        }
      } else {
        var result18 = null;
        this._pos = savedPos3;
      }
      var result17 = result18 !== null
        ? (function() { 
          return (arguments[1]).length > 0
            ? new PEG.Grammar.Choice([(arguments[0])].concat(PEG.ArrayUtils.map(
                (arguments[1]),
                function(element) { return element[1]; }
              )))
            : (arguments[0]);
         }).apply(this, result18)
        : null;
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result17
      };
      return result17;
    },
    
    _parse_sequence: function(context) {
      var cacheKey = "sequence" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var savedPos5 = this._pos;
      var result30 = [];
      var result32 = this._parse_prefixed(context);
      while (result32 !== null) {
        result30.push(result32);
        var result32 = this._parse_prefixed(context);
      }
      if (result30 !== null) {
        var result31 = this._parse_action(context);
        if (result31 !== null) {
          var result29 = [result30, result31];
        } else {
          var result29 = null;
          this._pos = savedPos5;
        }
      } else {
        var result29 = null;
        this._pos = savedPos5;
      }
      var result28 = result29 !== null
        ? (function() { 
              return new PEG.Grammar.Action(
                (arguments[0]).length != 1 ? new PEG.Grammar.Sequence((arguments[0])) : (arguments[0])[0],
                (arguments[1])
              );
             }).apply(this, result29)
        : null;
      if (result28 !== null) {
        var result24 = result28;
      } else {
        var result26 = [];
        var result27 = this._parse_prefixed(context);
        while (result27 !== null) {
          result26.push(result27);
          var result27 = this._parse_prefixed(context);
        }
        var result25 = result26 !== null
          ? (function() {  return (arguments[0]).length != 1 ? new PEG.Grammar.Sequence((arguments[0])) : (arguments[0])[0];  }).call(this, result26)
          : null;
        if (result25 !== null) {
          var result24 = result25;
        } else {
          var result24 = null;;
        };
      }
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result24
      };
      return result24;
    },
    
    _parse_prefixed: function(context) {
      var cacheKey = "prefixed" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var savedPos7 = this._pos;
      var result41 = this._parse_and(context);
      if (result41 !== null) {
        var result42 = this._parse_suffixed(context);
        if (result42 !== null) {
          var result40 = [result41, result42];
        } else {
          var result40 = null;
          this._pos = savedPos7;
        }
      } else {
        var result40 = null;
        this._pos = savedPos7;
      }
      var result39 = result40 !== null
        ? (function() { 
              return new PEG.Grammar.NotPredicate(new PEG.Grammar.NotPredicate((arguments[1])));
             }).apply(this, result40)
        : null;
      if (result39 !== null) {
        var result33 = result39;
      } else {
        var savedPos6 = this._pos;
        var result37 = this._parse_not(context);
        if (result37 !== null) {
          var result38 = this._parse_suffixed(context);
          if (result38 !== null) {
            var result36 = [result37, result38];
          } else {
            var result36 = null;
            this._pos = savedPos6;
          }
        } else {
          var result36 = null;
          this._pos = savedPos6;
        }
        var result35 = result36 !== null
          ? (function() {  return new PEG.Grammar.NotPredicate((arguments[1]));  }).apply(this, result36)
          : null;
        if (result35 !== null) {
          var result33 = result35;
        } else {
          var result34 = this._parse_suffixed(context);
          if (result34 !== null) {
            var result33 = result34;
          } else {
            var result33 = null;;
          };
        };
      }
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result33
      };
      return result33;
    },
    
    _parse_suffixed: function(context) {
      var cacheKey = "suffixed" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var savedPos10 = this._pos;
      var result55 = this._parse_primary(context);
      if (result55 !== null) {
        var result56 = this._parse_question(context);
        if (result56 !== null) {
          var result54 = [result55, result56];
        } else {
          var result54 = null;
          this._pos = savedPos10;
        }
      } else {
        var result54 = null;
        this._pos = savedPos10;
      }
      var result53 = result54 !== null
        ? (function() { 
              return new PEG.Grammar.Choice([(arguments[0]), new PEG.Grammar.Literal("")]);
             }).apply(this, result54)
        : null;
      if (result53 !== null) {
        var result43 = result53;
      } else {
        var savedPos9 = this._pos;
        var result51 = this._parse_primary(context);
        if (result51 !== null) {
          var result52 = this._parse_star(context);
          if (result52 !== null) {
            var result50 = [result51, result52];
          } else {
            var result50 = null;
            this._pos = savedPos9;
          }
        } else {
          var result50 = null;
          this._pos = savedPos9;
        }
        var result49 = result50 !== null
          ? (function() {  return new PEG.Grammar.ZeroOrMore((arguments[0]));  }).apply(this, result50)
          : null;
        if (result49 !== null) {
          var result43 = result49;
        } else {
          var savedPos8 = this._pos;
          var result47 = this._parse_primary(context);
          if (result47 !== null) {
            var result48 = this._parse_plus(context);
            if (result48 !== null) {
              var result46 = [result47, result48];
            } else {
              var result46 = null;
              this._pos = savedPos8;
            }
          } else {
            var result46 = null;
            this._pos = savedPos8;
          }
          var result45 = result46 !== null
            ? (function() { 
                  return new PEG.Grammar.Action(
                    new PEG.Grammar.Sequence([(arguments[0]), new PEG.Grammar.ZeroOrMore((arguments[0]))]),
                    function(first, rest) { return [first].concat(rest); }
                  );
                 }).apply(this, result46)
            : null;
          if (result45 !== null) {
            var result43 = result45;
          } else {
            var result44 = this._parse_primary(context);
            if (result44 !== null) {
              var result43 = result44;
            } else {
              var result43 = null;;
            };
          };
        };
      }
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result43
      };
      return result43;
    },
    
    _parse_primary: function(context) {
      var cacheKey = "primary" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var savedPos12 = this._pos;
      var result71 = this._parse_identifier(context);
      if (result71 !== null) {
        var savedPos13 = this._pos;
        var savedReportMatchFailuresVar0 = context.reportMatchFailures;
        context.reportMatchFailures = false;
        var savedPos14 = this._pos;
        var result77 = this._parse_literal(context);
        if (result77 !== null) {
          var result74 = result77;
        } else {
          if (this._input.substr(this._pos, 0) === "") {
            var result76 = "";
            this._pos += 0;
          } else {
            var result76 = null;
            if (context.reportMatchFailures) {
              this._matchFailed(this._quoteString(""));
            }
          }
          if (result76 !== null) {
            var result74 = result76;
          } else {
            var result74 = null;;
          };
        }
        if (result74 !== null) {
          var result75 = this._parse_colon(context);
          if (result75 !== null) {
            var result73 = [result74, result75];
          } else {
            var result73 = null;
            this._pos = savedPos14;
          }
        } else {
          var result73 = null;
          this._pos = savedPos14;
        }
        context.reportMatchFailures = savedReportMatchFailuresVar0;
        if (result73 === null) {
          var result72 = '';
        } else {
          var result72 = null;
          this._pos = savedPos13;
        }
        if (result72 !== null) {
          var result70 = [result71, result72];
        } else {
          var result70 = null;
          this._pos = savedPos12;
        }
      } else {
        var result70 = null;
        this._pos = savedPos12;
      }
      var result69 = result70 !== null
        ? (function() {  return new PEG.Grammar.RuleRef((arguments[0]));  }).apply(this, result70)
        : null;
      if (result69 !== null) {
        var result57 = result69;
      } else {
        var result68 = this._parse_literal(context);
        var result67 = result68 !== null
          ? (function() {  return new PEG.Grammar.Literal((arguments[0]));  }).call(this, result68)
          : null;
        if (result67 !== null) {
          var result57 = result67;
        } else {
          var result66 = this._parse_dot(context);
          var result65 = result66 !== null
            ? (function() {  return new PEG.Grammar.Any();        }).call(this, result66)
            : null;
          if (result65 !== null) {
            var result57 = result65;
          } else {
            var result64 = this._parse_class(context);
            var result63 = result64 !== null
              ? (function() {  return new PEG.Grammar.Class((arguments[0]));    }).call(this, result64)
              : null;
            if (result63 !== null) {
              var result57 = result63;
            } else {
              var savedPos11 = this._pos;
              var result60 = this._parse_lparen(context);
              if (result60 !== null) {
                var result61 = this._parse_expression(context);
                if (result61 !== null) {
                  var result62 = this._parse_rparen(context);
                  if (result62 !== null) {
                    var result59 = [result60, result61, result62];
                  } else {
                    var result59 = null;
                    this._pos = savedPos11;
                  }
                } else {
                  var result59 = null;
                  this._pos = savedPos11;
                }
              } else {
                var result59 = null;
                this._pos = savedPos11;
              }
              var result58 = result59 !== null
                ? (function() {  return (arguments[1]);  }).apply(this, result59)
                : null;
              if (result58 !== null) {
                var result57 = result58;
              } else {
                var result57 = null;;
              };
            };
          };
        };
      }
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result57
      };
      return result57;
    },
    
    _parse_action: function(context) {
      var cacheKey = "action" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      var savedReportMatchFailures = context.reportMatchFailures;
      context.reportMatchFailures = false;
      var savedPos15 = this._pos;
      var result80 = this._parse_braced(context);
      if (result80 !== null) {
        var result81 = this._parse___(context);
        if (result81 !== null) {
          var result79 = [result80, result81];
        } else {
          var result79 = null;
          this._pos = savedPos15;
        }
      } else {
        var result79 = null;
        this._pos = savedPos15;
      }
      var result78 = result79 !== null
        ? (function() {  return (arguments[0]).substr(1, (arguments[0]).length - 2);  }).apply(this, result79)
        : null;
      context.reportMatchFailures = savedReportMatchFailures;
      if (context.reportMatchFailures && result78 === null) {
        this._matchFailed("action");
      }
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result78
      };
      return result78;
    },
    
    _parse_braced: function(context) {
      var cacheKey = "braced" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var savedPos16 = this._pos;
      if (this._input.substr(this._pos, 1) === "{") {
        var result84 = "{";
        this._pos += 1;
      } else {
        var result84 = null;
        if (context.reportMatchFailures) {
          this._matchFailed(this._quoteString("{"));
        }
      }
      if (result84 !== null) {
        var result85 = [];
        var result89 = this._parse_braced(context);
        if (result89 !== null) {
          var result87 = result89;
        } else {
          var result88 = this._parse_nonBraceCharacter(context);
          if (result88 !== null) {
            var result87 = result88;
          } else {
            var result87 = null;;
          };
        }
        while (result87 !== null) {
          result85.push(result87);
          var result89 = this._parse_braced(context);
          if (result89 !== null) {
            var result87 = result89;
          } else {
            var result88 = this._parse_nonBraceCharacter(context);
            if (result88 !== null) {
              var result87 = result88;
            } else {
              var result87 = null;;
            };
          }
        }
        if (result85 !== null) {
          if (this._input.substr(this._pos, 1) === "}") {
            var result86 = "}";
            this._pos += 1;
          } else {
            var result86 = null;
            if (context.reportMatchFailures) {
              this._matchFailed(this._quoteString("}"));
            }
          }
          if (result86 !== null) {
            var result83 = [result84, result85, result86];
          } else {
            var result83 = null;
            this._pos = savedPos16;
          }
        } else {
          var result83 = null;
          this._pos = savedPos16;
        }
      } else {
        var result83 = null;
        this._pos = savedPos16;
      }
      var result82 = result83 !== null
        ? (function() {  return (arguments[0]) + (arguments[1]).join("") + (arguments[2]);  }).apply(this, result83)
        : null;
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result82
      };
      return result82;
    },
    
    _parse_nonBraceCharacters: function(context) {
      var cacheKey = "nonBraceCharacters" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var savedPos17 = this._pos;
      var result93 = this._parse_nonBraceCharacter(context);
      if (result93 !== null) {
        var result94 = [];
        var result95 = this._parse_nonBraceCharacter(context);
        while (result95 !== null) {
          result94.push(result95);
          var result95 = this._parse_nonBraceCharacter(context);
        }
        if (result94 !== null) {
          var result92 = [result93, result94];
        } else {
          var result92 = null;
          this._pos = savedPos17;
        }
      } else {
        var result92 = null;
        this._pos = savedPos17;
      }
      var result91 = result92 !== null
        ? (
        function (first, rest) {
            return [first].concat(rest);
        }
        ).apply(this, result92)
        : null;
      var result90 = result91 !== null
        ? (function() {  return (arguments[0]).join("");  }).call(this, result91)
        : null;
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result90
      };
      return result90;
    },
    
    _parse_nonBraceCharacter: function(context) {
      var cacheKey = "nonBraceCharacter" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      if (this._input.substr(this._pos).match(/^[^{}]/) !== null) {
        var result97 = this._input[this._pos];
        this._pos++;
      } else {
        var result97 = null;
        if (context.reportMatchFailures) {
          this._matchFailed('[' + "^{}" + ']');
        }
      }
      var result96 = result97 !== null
        ? (function() {  return (arguments[0]);  }).call(this, result97)
        : null;
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result96
      };
      return result96;
    },
    
    _parse_colon: function(context) {
      var cacheKey = "colon" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var savedPos18 = this._pos;
      if (this._input.substr(this._pos, 1) === ":") {
        var result100 = ":";
        this._pos += 1;
      } else {
        var result100 = null;
        if (context.reportMatchFailures) {
          this._matchFailed(this._quoteString(":"));
        }
      }
      if (result100 !== null) {
        var result101 = this._parse___(context);
        if (result101 !== null) {
          var result99 = [result100, result101];
        } else {
          var result99 = null;
          this._pos = savedPos18;
        }
      } else {
        var result99 = null;
        this._pos = savedPos18;
      }
      var result98 = result99 !== null
        ? (function() {  return (arguments[0]);  }).apply(this, result99)
        : null;
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result98
      };
      return result98;
    },
    
    _parse_slash: function(context) {
      var cacheKey = "slash" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var savedPos19 = this._pos;
      if (this._input.substr(this._pos, 1) === "/") {
        var result104 = "/";
        this._pos += 1;
      } else {
        var result104 = null;
        if (context.reportMatchFailures) {
          this._matchFailed(this._quoteString("/"));
        }
      }
      if (result104 !== null) {
        var result105 = this._parse___(context);
        if (result105 !== null) {
          var result103 = [result104, result105];
        } else {
          var result103 = null;
          this._pos = savedPos19;
        }
      } else {
        var result103 = null;
        this._pos = savedPos19;
      }
      var result102 = result103 !== null
        ? (function() {  return (arguments[0]);  }).apply(this, result103)
        : null;
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result102
      };
      return result102;
    },
    
    _parse_and: function(context) {
      var cacheKey = "and" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var savedPos20 = this._pos;
      if (this._input.substr(this._pos, 1) === "&") {
        var result108 = "&";
        this._pos += 1;
      } else {
        var result108 = null;
        if (context.reportMatchFailures) {
          this._matchFailed(this._quoteString("&"));
        }
      }
      if (result108 !== null) {
        var result109 = this._parse___(context);
        if (result109 !== null) {
          var result107 = [result108, result109];
        } else {
          var result107 = null;
          this._pos = savedPos20;
        }
      } else {
        var result107 = null;
        this._pos = savedPos20;
      }
      var result106 = result107 !== null
        ? (function() {  return (arguments[0]);  }).apply(this, result107)
        : null;
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result106
      };
      return result106;
    },
    
    _parse_not: function(context) {
      var cacheKey = "not" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var savedPos21 = this._pos;
      if (this._input.substr(this._pos, 1) === "!") {
        var result112 = "!";
        this._pos += 1;
      } else {
        var result112 = null;
        if (context.reportMatchFailures) {
          this._matchFailed(this._quoteString("!"));
        }
      }
      if (result112 !== null) {
        var result113 = this._parse___(context);
        if (result113 !== null) {
          var result111 = [result112, result113];
        } else {
          var result111 = null;
          this._pos = savedPos21;
        }
      } else {
        var result111 = null;
        this._pos = savedPos21;
      }
      var result110 = result111 !== null
        ? (function() {  return (arguments[0]);  }).apply(this, result111)
        : null;
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result110
      };
      return result110;
    },
    
    _parse_question: function(context) {
      var cacheKey = "question" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var savedPos22 = this._pos;
      if (this._input.substr(this._pos, 1) === "?") {
        var result116 = "?";
        this._pos += 1;
      } else {
        var result116 = null;
        if (context.reportMatchFailures) {
          this._matchFailed(this._quoteString("?"));
        }
      }
      if (result116 !== null) {
        var result117 = this._parse___(context);
        if (result117 !== null) {
          var result115 = [result116, result117];
        } else {
          var result115 = null;
          this._pos = savedPos22;
        }
      } else {
        var result115 = null;
        this._pos = savedPos22;
      }
      var result114 = result115 !== null
        ? (function() {  return (arguments[0]);  }).apply(this, result115)
        : null;
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result114
      };
      return result114;
    },
    
    _parse_star: function(context) {
      var cacheKey = "star" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var savedPos23 = this._pos;
      if (this._input.substr(this._pos, 1) === "*") {
        var result120 = "*";
        this._pos += 1;
      } else {
        var result120 = null;
        if (context.reportMatchFailures) {
          this._matchFailed(this._quoteString("*"));
        }
      }
      if (result120 !== null) {
        var result121 = this._parse___(context);
        if (result121 !== null) {
          var result119 = [result120, result121];
        } else {
          var result119 = null;
          this._pos = savedPos23;
        }
      } else {
        var result119 = null;
        this._pos = savedPos23;
      }
      var result118 = result119 !== null
        ? (function() {  return (arguments[0]);  }).apply(this, result119)
        : null;
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result118
      };
      return result118;
    },
    
    _parse_plus: function(context) {
      var cacheKey = "plus" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var savedPos24 = this._pos;
      if (this._input.substr(this._pos, 1) === "+") {
        var result124 = "+";
        this._pos += 1;
      } else {
        var result124 = null;
        if (context.reportMatchFailures) {
          this._matchFailed(this._quoteString("+"));
        }
      }
      if (result124 !== null) {
        var result125 = this._parse___(context);
        if (result125 !== null) {
          var result123 = [result124, result125];
        } else {
          var result123 = null;
          this._pos = savedPos24;
        }
      } else {
        var result123 = null;
        this._pos = savedPos24;
      }
      var result122 = result123 !== null
        ? (function() {  return (arguments[0]);  }).apply(this, result123)
        : null;
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result122
      };
      return result122;
    },
    
    _parse_lparen: function(context) {
      var cacheKey = "lparen" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var savedPos25 = this._pos;
      if (this._input.substr(this._pos, 1) === "(") {
        var result128 = "(";
        this._pos += 1;
      } else {
        var result128 = null;
        if (context.reportMatchFailures) {
          this._matchFailed(this._quoteString("("));
        }
      }
      if (result128 !== null) {
        var result129 = this._parse___(context);
        if (result129 !== null) {
          var result127 = [result128, result129];
        } else {
          var result127 = null;
          this._pos = savedPos25;
        }
      } else {
        var result127 = null;
        this._pos = savedPos25;
      }
      var result126 = result127 !== null
        ? (function() {  return (arguments[0]);  }).apply(this, result127)
        : null;
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result126
      };
      return result126;
    },
    
    _parse_rparen: function(context) {
      var cacheKey = "rparen" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var savedPos26 = this._pos;
      if (this._input.substr(this._pos, 1) === ")") {
        var result132 = ")";
        this._pos += 1;
      } else {
        var result132 = null;
        if (context.reportMatchFailures) {
          this._matchFailed(this._quoteString(")"));
        }
      }
      if (result132 !== null) {
        var result133 = this._parse___(context);
        if (result133 !== null) {
          var result131 = [result132, result133];
        } else {
          var result131 = null;
          this._pos = savedPos26;
        }
      } else {
        var result131 = null;
        this._pos = savedPos26;
      }
      var result130 = result131 !== null
        ? (function() {  return (arguments[0]);  }).apply(this, result131)
        : null;
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result130
      };
      return result130;
    },
    
    _parse_dot: function(context) {
      var cacheKey = "dot" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var savedPos27 = this._pos;
      if (this._input.substr(this._pos, 1) === ".") {
        var result136 = ".";
        this._pos += 1;
      } else {
        var result136 = null;
        if (context.reportMatchFailures) {
          this._matchFailed(this._quoteString("."));
        }
      }
      if (result136 !== null) {
        var result137 = this._parse___(context);
        if (result137 !== null) {
          var result135 = [result136, result137];
        } else {
          var result135 = null;
          this._pos = savedPos27;
        }
      } else {
        var result135 = null;
        this._pos = savedPos27;
      }
      var result134 = result135 !== null
        ? (function() {  return (arguments[0]);  }).apply(this, result135)
        : null;
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result134
      };
      return result134;
    },
    
    _parse_identifier: function(context) {
      var cacheKey = "identifier" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      var savedReportMatchFailures = context.reportMatchFailures;
      context.reportMatchFailures = false;
      var savedPos28 = this._pos;
      var result150 = this._parse_letter(context);
      if (result150 !== null) {
        var result140 = result150;
      } else {
        if (this._input.substr(this._pos, 1) === "_") {
          var result149 = "_";
          this._pos += 1;
        } else {
          var result149 = null;
          if (context.reportMatchFailures) {
            this._matchFailed(this._quoteString("_"));
          }
        }
        if (result149 !== null) {
          var result140 = result149;
        } else {
          if (this._input.substr(this._pos, 1) === "$") {
            var result148 = "$";
            this._pos += 1;
          } else {
            var result148 = null;
            if (context.reportMatchFailures) {
              this._matchFailed(this._quoteString("$"));
            }
          }
          if (result148 !== null) {
            var result140 = result148;
          } else {
            var result140 = null;;
          };
        };
      }
      if (result140 !== null) {
        var result141 = [];
        var result147 = this._parse_letter(context);
        if (result147 !== null) {
          var result143 = result147;
        } else {
          var result146 = this._parse_digit(context);
          if (result146 !== null) {
            var result143 = result146;
          } else {
            if (this._input.substr(this._pos, 1) === "_") {
              var result145 = "_";
              this._pos += 1;
            } else {
              var result145 = null;
              if (context.reportMatchFailures) {
                this._matchFailed(this._quoteString("_"));
              }
            }
            if (result145 !== null) {
              var result143 = result145;
            } else {
              if (this._input.substr(this._pos, 1) === "$") {
                var result144 = "$";
                this._pos += 1;
              } else {
                var result144 = null;
                if (context.reportMatchFailures) {
                  this._matchFailed(this._quoteString("$"));
                }
              }
              if (result144 !== null) {
                var result143 = result144;
              } else {
                var result143 = null;;
              };
            };
          };
        }
        while (result143 !== null) {
          result141.push(result143);
          var result147 = this._parse_letter(context);
          if (result147 !== null) {
            var result143 = result147;
          } else {
            var result146 = this._parse_digit(context);
            if (result146 !== null) {
              var result143 = result146;
            } else {
              if (this._input.substr(this._pos, 1) === "_") {
                var result145 = "_";
                this._pos += 1;
              } else {
                var result145 = null;
                if (context.reportMatchFailures) {
                  this._matchFailed(this._quoteString("_"));
                }
              }
              if (result145 !== null) {
                var result143 = result145;
              } else {
                if (this._input.substr(this._pos, 1) === "$") {
                  var result144 = "$";
                  this._pos += 1;
                } else {
                  var result144 = null;
                  if (context.reportMatchFailures) {
                    this._matchFailed(this._quoteString("$"));
                  }
                }
                if (result144 !== null) {
                  var result143 = result144;
                } else {
                  var result143 = null;;
                };
              };
            };
          }
        }
        if (result141 !== null) {
          var result142 = this._parse___(context);
          if (result142 !== null) {
            var result139 = [result140, result141, result142];
          } else {
            var result139 = null;
            this._pos = savedPos28;
          }
        } else {
          var result139 = null;
          this._pos = savedPos28;
        }
      } else {
        var result139 = null;
        this._pos = savedPos28;
      }
      var result138 = result139 !== null
        ? (function() { 
          return (arguments[0]) + (arguments[1]).join("");
         }).apply(this, result139)
        : null;
      context.reportMatchFailures = savedReportMatchFailures;
      if (context.reportMatchFailures && result138 === null) {
        this._matchFailed("identifier");
      }
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result138
      };
      return result138;
    },
    
    _parse_literal: function(context) {
      var cacheKey = "literal" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      var savedReportMatchFailures = context.reportMatchFailures;
      context.reportMatchFailures = false;
      var savedPos29 = this._pos;
      var result156 = this._parse_doubleQuotedLiteral(context);
      if (result156 !== null) {
        var result153 = result156;
      } else {
        var result155 = this._parse_singleQuotedLiteral(context);
        if (result155 !== null) {
          var result153 = result155;
        } else {
          var result153 = null;;
        };
      }
      if (result153 !== null) {
        var result154 = this._parse___(context);
        if (result154 !== null) {
          var result152 = [result153, result154];
        } else {
          var result152 = null;
          this._pos = savedPos29;
        }
      } else {
        var result152 = null;
        this._pos = savedPos29;
      }
      var result151 = result152 !== null
        ? (function() {  return (arguments[0]);  }).apply(this, result152)
        : null;
      context.reportMatchFailures = savedReportMatchFailures;
      if (context.reportMatchFailures && result151 === null) {
        this._matchFailed("literal");
      }
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result151
      };
      return result151;
    },
    
    _parse_doubleQuotedLiteral: function(context) {
      var cacheKey = "doubleQuotedLiteral" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var savedPos30 = this._pos;
      if (this._input.substr(this._pos, 1) === "\"") {
        var result159 = "\"";
        this._pos += 1;
      } else {
        var result159 = null;
        if (context.reportMatchFailures) {
          this._matchFailed(this._quoteString("\""));
        }
      }
      if (result159 !== null) {
        var result160 = [];
        var result162 = this._parse_doubleQuotedCharacter(context);
        while (result162 !== null) {
          result160.push(result162);
          var result162 = this._parse_doubleQuotedCharacter(context);
        }
        if (result160 !== null) {
          if (this._input.substr(this._pos, 1) === "\"") {
            var result161 = "\"";
            this._pos += 1;
          } else {
            var result161 = null;
            if (context.reportMatchFailures) {
              this._matchFailed(this._quoteString("\""));
            }
          }
          if (result161 !== null) {
            var result158 = [result159, result160, result161];
          } else {
            var result158 = null;
            this._pos = savedPos30;
          }
        } else {
          var result158 = null;
          this._pos = savedPos30;
        }
      } else {
        var result158 = null;
        this._pos = savedPos30;
      }
      var result157 = result158 !== null
        ? (function() {  return (arguments[1]).join("");  }).apply(this, result158)
        : null;
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result157
      };
      return result157;
    },
    
    _parse_doubleQuotedCharacter: function(context) {
      var cacheKey = "doubleQuotedCharacter" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var result169 = this._parse_simpleDoubleQuotedCharacter(context);
      if (result169 !== null) {
        var result163 = result169;
      } else {
        var result168 = this._parse_simpleEscapeSequence(context);
        if (result168 !== null) {
          var result163 = result168;
        } else {
          var result167 = this._parse_zeroEscapeSequence(context);
          if (result167 !== null) {
            var result163 = result167;
          } else {
            var result166 = this._parse_hexEscapeSequence(context);
            if (result166 !== null) {
              var result163 = result166;
            } else {
              var result165 = this._parse_unicodeEscapeSequence(context);
              if (result165 !== null) {
                var result163 = result165;
              } else {
                var result164 = this._parse_eolEscapeSequence(context);
                if (result164 !== null) {
                  var result163 = result164;
                } else {
                  var result163 = null;;
                };
              };
            };
          };
        };
      }
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result163
      };
      return result163;
    },
    
    _parse_simpleDoubleQuotedCharacter: function(context) {
      var cacheKey = "simpleDoubleQuotedCharacter" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var savedPos31 = this._pos;
      var savedPos32 = this._pos;
      var savedReportMatchFailuresVar1 = context.reportMatchFailures;
      context.reportMatchFailures = false;
      if (this._input.substr(this._pos, 1) === "\"") {
        var result177 = "\"";
        this._pos += 1;
      } else {
        var result177 = null;
        if (context.reportMatchFailures) {
          this._matchFailed(this._quoteString("\""));
        }
      }
      if (result177 !== null) {
        var result174 = result177;
      } else {
        if (this._input.substr(this._pos, 1) === "\\") {
          var result176 = "\\";
          this._pos += 1;
        } else {
          var result176 = null;
          if (context.reportMatchFailures) {
            this._matchFailed(this._quoteString("\\"));
          }
        }
        if (result176 !== null) {
          var result174 = result176;
        } else {
          var result175 = this._parse_eolChar(context);
          if (result175 !== null) {
            var result174 = result175;
          } else {
            var result174 = null;;
          };
        };
      }
      context.reportMatchFailures = savedReportMatchFailuresVar1;
      if (result174 === null) {
        var result172 = '';
      } else {
        var result172 = null;
        this._pos = savedPos32;
      }
      if (result172 !== null) {
        if (this._input.length > this._pos) {
          var result173 = this._input[this._pos];
          this._pos++;
        } else {
          var result173 = null;
          if (context.reportMatchFailures) {
            this._matchFailed('any character');
          }
        }
        if (result173 !== null) {
          var result171 = [result172, result173];
        } else {
          var result171 = null;
          this._pos = savedPos31;
        }
      } else {
        var result171 = null;
        this._pos = savedPos31;
      }
      var result170 = result171 !== null
        ? (function() {  return (arguments[1]);  }).apply(this, result171)
        : null;
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result170
      };
      return result170;
    },
    
    _parse_singleQuotedLiteral: function(context) {
      var cacheKey = "singleQuotedLiteral" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var savedPos33 = this._pos;
      if (this._input.substr(this._pos, 1) === "'") {
        var result180 = "'";
        this._pos += 1;
      } else {
        var result180 = null;
        if (context.reportMatchFailures) {
          this._matchFailed(this._quoteString("'"));
        }
      }
      if (result180 !== null) {
        var result181 = [];
        var result183 = this._parse_singleQuotedCharacter(context);
        while (result183 !== null) {
          result181.push(result183);
          var result183 = this._parse_singleQuotedCharacter(context);
        }
        if (result181 !== null) {
          if (this._input.substr(this._pos, 1) === "'") {
            var result182 = "'";
            this._pos += 1;
          } else {
            var result182 = null;
            if (context.reportMatchFailures) {
              this._matchFailed(this._quoteString("'"));
            }
          }
          if (result182 !== null) {
            var result179 = [result180, result181, result182];
          } else {
            var result179 = null;
            this._pos = savedPos33;
          }
        } else {
          var result179 = null;
          this._pos = savedPos33;
        }
      } else {
        var result179 = null;
        this._pos = savedPos33;
      }
      var result178 = result179 !== null
        ? (function() {  return (arguments[1]).join("");  }).apply(this, result179)
        : null;
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result178
      };
      return result178;
    },
    
    _parse_singleQuotedCharacter: function(context) {
      var cacheKey = "singleQuotedCharacter" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var result190 = this._parse_simpleSingleQuotedCharacter(context);
      if (result190 !== null) {
        var result184 = result190;
      } else {
        var result189 = this._parse_simpleEscapeSequence(context);
        if (result189 !== null) {
          var result184 = result189;
        } else {
          var result188 = this._parse_zeroEscapeSequence(context);
          if (result188 !== null) {
            var result184 = result188;
          } else {
            var result187 = this._parse_hexEscapeSequence(context);
            if (result187 !== null) {
              var result184 = result187;
            } else {
              var result186 = this._parse_unicodeEscapeSequence(context);
              if (result186 !== null) {
                var result184 = result186;
              } else {
                var result185 = this._parse_eolEscapeSequence(context);
                if (result185 !== null) {
                  var result184 = result185;
                } else {
                  var result184 = null;;
                };
              };
            };
          };
        };
      }
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result184
      };
      return result184;
    },
    
    _parse_simpleSingleQuotedCharacter: function(context) {
      var cacheKey = "simpleSingleQuotedCharacter" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var savedPos34 = this._pos;
      var savedPos35 = this._pos;
      var savedReportMatchFailuresVar2 = context.reportMatchFailures;
      context.reportMatchFailures = false;
      if (this._input.substr(this._pos, 1) === "'") {
        var result198 = "'";
        this._pos += 1;
      } else {
        var result198 = null;
        if (context.reportMatchFailures) {
          this._matchFailed(this._quoteString("'"));
        }
      }
      if (result198 !== null) {
        var result195 = result198;
      } else {
        if (this._input.substr(this._pos, 1) === "\\") {
          var result197 = "\\";
          this._pos += 1;
        } else {
          var result197 = null;
          if (context.reportMatchFailures) {
            this._matchFailed(this._quoteString("\\"));
          }
        }
        if (result197 !== null) {
          var result195 = result197;
        } else {
          var result196 = this._parse_eolChar(context);
          if (result196 !== null) {
            var result195 = result196;
          } else {
            var result195 = null;;
          };
        };
      }
      context.reportMatchFailures = savedReportMatchFailuresVar2;
      if (result195 === null) {
        var result193 = '';
      } else {
        var result193 = null;
        this._pos = savedPos35;
      }
      if (result193 !== null) {
        if (this._input.length > this._pos) {
          var result194 = this._input[this._pos];
          this._pos++;
        } else {
          var result194 = null;
          if (context.reportMatchFailures) {
            this._matchFailed('any character');
          }
        }
        if (result194 !== null) {
          var result192 = [result193, result194];
        } else {
          var result192 = null;
          this._pos = savedPos34;
        }
      } else {
        var result192 = null;
        this._pos = savedPos34;
      }
      var result191 = result192 !== null
        ? (function() {  return (arguments[1]);  }).apply(this, result192)
        : null;
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result191
      };
      return result191;
    },
    
    _parse_class: function(context) {
      var cacheKey = "class" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      var savedReportMatchFailures = context.reportMatchFailures;
      context.reportMatchFailures = false;
      var savedPos36 = this._pos;
      if (this._input.substr(this._pos, 1) === "[") {
        var result201 = "[";
        this._pos += 1;
      } else {
        var result201 = null;
        if (context.reportMatchFailures) {
          this._matchFailed(this._quoteString("["));
        }
      }
      if (result201 !== null) {
        if (this._input.substr(this._pos, 1) === "^") {
          var result210 = "^";
          this._pos += 1;
        } else {
          var result210 = null;
          if (context.reportMatchFailures) {
            this._matchFailed(this._quoteString("^"));
          }
        }
        if (result210 !== null) {
          var result202 = result210;
        } else {
          if (this._input.substr(this._pos, 0) === "") {
            var result209 = "";
            this._pos += 0;
          } else {
            var result209 = null;
            if (context.reportMatchFailures) {
              this._matchFailed(this._quoteString(""));
            }
          }
          if (result209 !== null) {
            var result202 = result209;
          } else {
            var result202 = null;;
          };
        }
        if (result202 !== null) {
          var result203 = [];
          var result208 = this._parse_classCharacterRange(context);
          if (result208 !== null) {
            var result206 = result208;
          } else {
            var result207 = this._parse_classCharacter(context);
            if (result207 !== null) {
              var result206 = result207;
            } else {
              var result206 = null;;
            };
          }
          while (result206 !== null) {
            result203.push(result206);
            var result208 = this._parse_classCharacterRange(context);
            if (result208 !== null) {
              var result206 = result208;
            } else {
              var result207 = this._parse_classCharacter(context);
              if (result207 !== null) {
                var result206 = result207;
              } else {
                var result206 = null;;
              };
            }
          }
          if (result203 !== null) {
            if (this._input.substr(this._pos, 1) === "]") {
              var result204 = "]";
              this._pos += 1;
            } else {
              var result204 = null;
              if (context.reportMatchFailures) {
                this._matchFailed(this._quoteString("]"));
              }
            }
            if (result204 !== null) {
              var result205 = this._parse___(context);
              if (result205 !== null) {
                var result200 = [result201, result202, result203, result204, result205];
              } else {
                var result200 = null;
                this._pos = savedPos36;
              }
            } else {
              var result200 = null;
              this._pos = savedPos36;
            }
          } else {
            var result200 = null;
            this._pos = savedPos36;
          }
        } else {
          var result200 = null;
          this._pos = savedPos36;
        }
      } else {
        var result200 = null;
        this._pos = savedPos36;
      }
      var result199 = result200 !== null
        ? (function() { 
          return (arguments[1]) + (arguments[2]).join("");
         }).apply(this, result200)
        : null;
      context.reportMatchFailures = savedReportMatchFailures;
      if (context.reportMatchFailures && result199 === null) {
        this._matchFailed("character class");
      }
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result199
      };
      return result199;
    },
    
    _parse_classCharacterRange: function(context) {
      var cacheKey = "classCharacterRange" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var savedPos37 = this._pos;
      var result213 = this._parse_bracketDelimitedCharacter(context);
      if (result213 !== null) {
        if (this._input.substr(this._pos, 1) === "-") {
          var result214 = "-";
          this._pos += 1;
        } else {
          var result214 = null;
          if (context.reportMatchFailures) {
            this._matchFailed(this._quoteString("-"));
          }
        }
        if (result214 !== null) {
          var result215 = this._parse_bracketDelimitedCharacter(context);
          if (result215 !== null) {
            var result212 = [result213, result214, result215];
          } else {
            var result212 = null;
            this._pos = savedPos37;
          }
        } else {
          var result212 = null;
          this._pos = savedPos37;
        }
      } else {
        var result212 = null;
        this._pos = savedPos37;
      }
      var result211 = result212 !== null
        ? (function() { 
          if ((arguments[0]).charCodeAt(0) > (arguments[2]).charCodeAt(0)) {
            throw new this.SyntaxError(
              "Invalid character range: "
                + PEG.RegExpUtils.quoteForClass((arguments[0]))
                + "-"
                + PEG.RegExpUtils.quoteForClass((arguments[2]))
                + "."
            );
          }
        
          return PEG.RegExpUtils.quoteForClass((arguments[0]))
            + "-"
            + PEG.RegExpUtils.quoteForClass((arguments[2]));
         }).apply(this, result212)
        : null;
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result211
      };
      return result211;
    },
    
    _parse_classCharacter: function(context) {
      var cacheKey = "classCharacter" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var result217 = this._parse_bracketDelimitedCharacter(context);
      var result216 = result217 !== null
        ? (function() { 
          return PEG.RegExpUtils.quoteForClass((arguments[0]));
         }).call(this, result217)
        : null;
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result216
      };
      return result216;
    },
    
    _parse_bracketDelimitedCharacter: function(context) {
      var cacheKey = "bracketDelimitedCharacter" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var result224 = this._parse_simpleBracketDelimitedCharacter(context);
      if (result224 !== null) {
        var result218 = result224;
      } else {
        var result223 = this._parse_simpleEscapeSequence(context);
        if (result223 !== null) {
          var result218 = result223;
        } else {
          var result222 = this._parse_zeroEscapeSequence(context);
          if (result222 !== null) {
            var result218 = result222;
          } else {
            var result221 = this._parse_hexEscapeSequence(context);
            if (result221 !== null) {
              var result218 = result221;
            } else {
              var result220 = this._parse_unicodeEscapeSequence(context);
              if (result220 !== null) {
                var result218 = result220;
              } else {
                var result219 = this._parse_eolEscapeSequence(context);
                if (result219 !== null) {
                  var result218 = result219;
                } else {
                  var result218 = null;;
                };
              };
            };
          };
        };
      }
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result218
      };
      return result218;
    },
    
    _parse_simpleBracketDelimitedCharacter: function(context) {
      var cacheKey = "simpleBracketDelimitedCharacter" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var savedPos38 = this._pos;
      var savedPos39 = this._pos;
      var savedReportMatchFailuresVar3 = context.reportMatchFailures;
      context.reportMatchFailures = false;
      if (this._input.substr(this._pos, 1) === "]") {
        var result232 = "]";
        this._pos += 1;
      } else {
        var result232 = null;
        if (context.reportMatchFailures) {
          this._matchFailed(this._quoteString("]"));
        }
      }
      if (result232 !== null) {
        var result229 = result232;
      } else {
        if (this._input.substr(this._pos, 1) === "\\") {
          var result231 = "\\";
          this._pos += 1;
        } else {
          var result231 = null;
          if (context.reportMatchFailures) {
            this._matchFailed(this._quoteString("\\"));
          }
        }
        if (result231 !== null) {
          var result229 = result231;
        } else {
          var result230 = this._parse_eolChar(context);
          if (result230 !== null) {
            var result229 = result230;
          } else {
            var result229 = null;;
          };
        };
      }
      context.reportMatchFailures = savedReportMatchFailuresVar3;
      if (result229 === null) {
        var result227 = '';
      } else {
        var result227 = null;
        this._pos = savedPos39;
      }
      if (result227 !== null) {
        if (this._input.length > this._pos) {
          var result228 = this._input[this._pos];
          this._pos++;
        } else {
          var result228 = null;
          if (context.reportMatchFailures) {
            this._matchFailed('any character');
          }
        }
        if (result228 !== null) {
          var result226 = [result227, result228];
        } else {
          var result226 = null;
          this._pos = savedPos38;
        }
      } else {
        var result226 = null;
        this._pos = savedPos38;
      }
      var result225 = result226 !== null
        ? (function() {  return (arguments[1]);  }).apply(this, result226)
        : null;
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result225
      };
      return result225;
    },
    
    _parse_simpleEscapeSequence: function(context) {
      var cacheKey = "simpleEscapeSequence" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var savedPos40 = this._pos;
      if (this._input.substr(this._pos, 1) === "\\") {
        var result235 = "\\";
        this._pos += 1;
      } else {
        var result235 = null;
        if (context.reportMatchFailures) {
          this._matchFailed(this._quoteString("\\"));
        }
      }
      if (result235 !== null) {
        var savedPos41 = this._pos;
        var savedReportMatchFailuresVar4 = context.reportMatchFailures;
        context.reportMatchFailures = false;
        var result242 = this._parse_digit(context);
        if (result242 !== null) {
          var result238 = result242;
        } else {
          if (this._input.substr(this._pos, 1) === "x") {
            var result241 = "x";
            this._pos += 1;
          } else {
            var result241 = null;
            if (context.reportMatchFailures) {
              this._matchFailed(this._quoteString("x"));
            }
          }
          if (result241 !== null) {
            var result238 = result241;
          } else {
            if (this._input.substr(this._pos, 1) === "u") {
              var result240 = "u";
              this._pos += 1;
            } else {
              var result240 = null;
              if (context.reportMatchFailures) {
                this._matchFailed(this._quoteString("u"));
              }
            }
            if (result240 !== null) {
              var result238 = result240;
            } else {
              var result239 = this._parse_eolChar(context);
              if (result239 !== null) {
                var result238 = result239;
              } else {
                var result238 = null;;
              };
            };
          };
        }
        context.reportMatchFailures = savedReportMatchFailuresVar4;
        if (result238 === null) {
          var result236 = '';
        } else {
          var result236 = null;
          this._pos = savedPos41;
        }
        if (result236 !== null) {
          if (this._input.length > this._pos) {
            var result237 = this._input[this._pos];
            this._pos++;
          } else {
            var result237 = null;
            if (context.reportMatchFailures) {
              this._matchFailed('any character');
            }
          }
          if (result237 !== null) {
            var result234 = [result235, result236, result237];
          } else {
            var result234 = null;
            this._pos = savedPos40;
          }
        } else {
          var result234 = null;
          this._pos = savedPos40;
        }
      } else {
        var result234 = null;
        this._pos = savedPos40;
      }
      var result233 = result234 !== null
        ? (function() { 
          return (arguments[2])
            .replace("b", "\b")
            .replace("f", "\f")
            .replace("n", "\n")
            .replace("r", "\r")
            .replace("t", "\t")
            .replace("v", "\v")
         }).apply(this, result234)
        : null;
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result233
      };
      return result233;
    },
    
    _parse_zeroEscapeSequence: function(context) {
      var cacheKey = "zeroEscapeSequence" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var savedPos42 = this._pos;
      if (this._input.substr(this._pos, 2) === "\\0") {
        var result245 = "\\0";
        this._pos += 2;
      } else {
        var result245 = null;
        if (context.reportMatchFailures) {
          this._matchFailed(this._quoteString("\\0"));
        }
      }
      if (result245 !== null) {
        var savedPos43 = this._pos;
        var savedReportMatchFailuresVar5 = context.reportMatchFailures;
        context.reportMatchFailures = false;
        var result247 = this._parse_digit(context);
        context.reportMatchFailures = savedReportMatchFailuresVar5;
        if (result247 === null) {
          var result246 = '';
        } else {
          var result246 = null;
          this._pos = savedPos43;
        }
        if (result246 !== null) {
          var result244 = [result245, result246];
        } else {
          var result244 = null;
          this._pos = savedPos42;
        }
      } else {
        var result244 = null;
        this._pos = savedPos42;
      }
      var result243 = result244 !== null
        ? (function() {  return "\0";  }).apply(this, result244)
        : null;
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result243
      };
      return result243;
    },
    
    _parse_hexEscapeSequence: function(context) {
      var cacheKey = "hexEscapeSequence" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var savedPos44 = this._pos;
      if (this._input.substr(this._pos, 2) === "\\x") {
        var result250 = "\\x";
        this._pos += 2;
      } else {
        var result250 = null;
        if (context.reportMatchFailures) {
          this._matchFailed(this._quoteString("\\x"));
        }
      }
      if (result250 !== null) {
        var result251 = this._parse_hexDigit(context);
        if (result251 !== null) {
          var result252 = this._parse_hexDigit(context);
          if (result252 !== null) {
            var result249 = [result250, result251, result252];
          } else {
            var result249 = null;
            this._pos = savedPos44;
          }
        } else {
          var result249 = null;
          this._pos = savedPos44;
        }
      } else {
        var result249 = null;
        this._pos = savedPos44;
      }
      var result248 = result249 !== null
        ? (function() { 
          return String.fromCharCode(parseInt("0x" + (arguments[1]) + (arguments[2])));
         }).apply(this, result249)
        : null;
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result248
      };
      return result248;
    },
    
    _parse_unicodeEscapeSequence: function(context) {
      var cacheKey = "unicodeEscapeSequence" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var savedPos45 = this._pos;
      if (this._input.substr(this._pos, 2) === "\\u") {
        var result255 = "\\u";
        this._pos += 2;
      } else {
        var result255 = null;
        if (context.reportMatchFailures) {
          this._matchFailed(this._quoteString("\\u"));
        }
      }
      if (result255 !== null) {
        var result256 = this._parse_hexDigit(context);
        if (result256 !== null) {
          var result257 = this._parse_hexDigit(context);
          if (result257 !== null) {
            var result258 = this._parse_hexDigit(context);
            if (result258 !== null) {
              var result259 = this._parse_hexDigit(context);
              if (result259 !== null) {
                var result254 = [result255, result256, result257, result258, result259];
              } else {
                var result254 = null;
                this._pos = savedPos45;
              }
            } else {
              var result254 = null;
              this._pos = savedPos45;
            }
          } else {
            var result254 = null;
            this._pos = savedPos45;
          }
        } else {
          var result254 = null;
          this._pos = savedPos45;
        }
      } else {
        var result254 = null;
        this._pos = savedPos45;
      }
      var result253 = result254 !== null
        ? (function() { 
          return String.fromCharCode(parseInt("0x" + (arguments[1]) + (arguments[2]) + (arguments[3]) + (arguments[4])));
         }).apply(this, result254)
        : null;
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result253
      };
      return result253;
    },
    
    _parse_eolEscapeSequence: function(context) {
      var cacheKey = "eolEscapeSequence" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var savedPos46 = this._pos;
      if (this._input.substr(this._pos, 1) === "\\") {
        var result262 = "\\";
        this._pos += 1;
      } else {
        var result262 = null;
        if (context.reportMatchFailures) {
          this._matchFailed(this._quoteString("\\"));
        }
      }
      if (result262 !== null) {
        var result263 = this._parse_eol(context);
        if (result263 !== null) {
          var result261 = [result262, result263];
        } else {
          var result261 = null;
          this._pos = savedPos46;
        }
      } else {
        var result261 = null;
        this._pos = savedPos46;
      }
      var result260 = result261 !== null
        ? (function() {  return (arguments[1]);  }).apply(this, result261)
        : null;
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result260
      };
      return result260;
    },
    
    _parse_digit: function(context) {
      var cacheKey = "digit" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      if (this._input.substr(this._pos).match(/^[0-9]/) !== null) {
        var result264 = this._input[this._pos];
        this._pos++;
      } else {
        var result264 = null;
        if (context.reportMatchFailures) {
          this._matchFailed('[' + "0-9" + ']');
        }
      }
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result264
      };
      return result264;
    },
    
    _parse_hexDigit: function(context) {
      var cacheKey = "hexDigit" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      if (this._input.substr(this._pos).match(/^[0-9a-fA-F]/) !== null) {
        var result265 = this._input[this._pos];
        this._pos++;
      } else {
        var result265 = null;
        if (context.reportMatchFailures) {
          this._matchFailed('[' + "0-9a-fA-F" + ']');
        }
      }
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result265
      };
      return result265;
    },
    
    _parse_letter: function(context) {
      var cacheKey = "letter" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var result268 = this._parse_lowerCaseLetter(context);
      if (result268 !== null) {
        var result266 = result268;
      } else {
        var result267 = this._parse_upperCaseLetter(context);
        if (result267 !== null) {
          var result266 = result267;
        } else {
          var result266 = null;;
        };
      }
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result266
      };
      return result266;
    },
    
    _parse_lowerCaseLetter: function(context) {
      var cacheKey = "lowerCaseLetter" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      if (this._input.substr(this._pos).match(/^[a-z]/) !== null) {
        var result269 = this._input[this._pos];
        this._pos++;
      } else {
        var result269 = null;
        if (context.reportMatchFailures) {
          this._matchFailed('[' + "a-z" + ']');
        }
      }
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result269
      };
      return result269;
    },
    
    _parse_upperCaseLetter: function(context) {
      var cacheKey = "upperCaseLetter" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      if (this._input.substr(this._pos).match(/^[A-Z]/) !== null) {
        var result270 = this._input[this._pos];
        this._pos++;
      } else {
        var result270 = null;
        if (context.reportMatchFailures) {
          this._matchFailed('[' + "A-Z" + ']');
        }
      }
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result270
      };
      return result270;
    },
    
    _parse___: function(context) {
      var cacheKey = "__" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var result271 = [];
      var result275 = this._parse_whitespace(context);
      if (result275 !== null) {
        var result272 = result275;
      } else {
        var result274 = this._parse_eol(context);
        if (result274 !== null) {
          var result272 = result274;
        } else {
          var result273 = this._parse_comment(context);
          if (result273 !== null) {
            var result272 = result273;
          } else {
            var result272 = null;;
          };
        };
      }
      while (result272 !== null) {
        result271.push(result272);
        var result275 = this._parse_whitespace(context);
        if (result275 !== null) {
          var result272 = result275;
        } else {
          var result274 = this._parse_eol(context);
          if (result274 !== null) {
            var result272 = result274;
          } else {
            var result273 = this._parse_comment(context);
            if (result273 !== null) {
              var result272 = result273;
            } else {
              var result272 = null;;
            };
          };
        }
      }
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result271
      };
      return result271;
    },
    
    _parse_comment: function(context) {
      var cacheKey = "comment" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      var savedReportMatchFailures = context.reportMatchFailures;
      context.reportMatchFailures = false;
      var result278 = this._parse_singleLineComment(context);
      if (result278 !== null) {
        var result276 = result278;
      } else {
        var result277 = this._parse_multiLineComment(context);
        if (result277 !== null) {
          var result276 = result277;
        } else {
          var result276 = null;;
        };
      }
      context.reportMatchFailures = savedReportMatchFailures;
      if (context.reportMatchFailures && result276 === null) {
        this._matchFailed("comment");
      }
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result276
      };
      return result276;
    },
    
    _parse_singleLineComment: function(context) {
      var cacheKey = "singleLineComment" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var savedPos47 = this._pos;
      if (this._input.substr(this._pos, 2) === "//") {
        var result280 = "//";
        this._pos += 2;
      } else {
        var result280 = null;
        if (context.reportMatchFailures) {
          this._matchFailed(this._quoteString("//"));
        }
      }
      if (result280 !== null) {
        var result281 = [];
        var savedPos48 = this._pos;
        var savedPos49 = this._pos;
        var savedReportMatchFailuresVar6 = context.reportMatchFailures;
        context.reportMatchFailures = false;
        var result285 = this._parse_eolChar(context);
        context.reportMatchFailures = savedReportMatchFailuresVar6;
        if (result285 === null) {
          var result283 = '';
        } else {
          var result283 = null;
          this._pos = savedPos49;
        }
        if (result283 !== null) {
          if (this._input.length > this._pos) {
            var result284 = this._input[this._pos];
            this._pos++;
          } else {
            var result284 = null;
            if (context.reportMatchFailures) {
              this._matchFailed('any character');
            }
          }
          if (result284 !== null) {
            var result282 = [result283, result284];
          } else {
            var result282 = null;
            this._pos = savedPos48;
          }
        } else {
          var result282 = null;
          this._pos = savedPos48;
        }
        while (result282 !== null) {
          result281.push(result282);
          var savedPos48 = this._pos;
          var savedPos49 = this._pos;
          var savedReportMatchFailuresVar6 = context.reportMatchFailures;
          context.reportMatchFailures = false;
          var result285 = this._parse_eolChar(context);
          context.reportMatchFailures = savedReportMatchFailuresVar6;
          if (result285 === null) {
            var result283 = '';
          } else {
            var result283 = null;
            this._pos = savedPos49;
          }
          if (result283 !== null) {
            if (this._input.length > this._pos) {
              var result284 = this._input[this._pos];
              this._pos++;
            } else {
              var result284 = null;
              if (context.reportMatchFailures) {
                this._matchFailed('any character');
              }
            }
            if (result284 !== null) {
              var result282 = [result283, result284];
            } else {
              var result282 = null;
              this._pos = savedPos48;
            }
          } else {
            var result282 = null;
            this._pos = savedPos48;
          }
        }
        if (result281 !== null) {
          var result279 = [result280, result281];
        } else {
          var result279 = null;
          this._pos = savedPos47;
        }
      } else {
        var result279 = null;
        this._pos = savedPos47;
      }
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result279
      };
      return result279;
    },
    
    _parse_multiLineComment: function(context) {
      var cacheKey = "multiLineComment" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      var savedPos50 = this._pos;
      if (this._input.substr(this._pos, 2) === "/*") {
        var result287 = "/*";
        this._pos += 2;
      } else {
        var result287 = null;
        if (context.reportMatchFailures) {
          this._matchFailed(this._quoteString("/*"));
        }
      }
      if (result287 !== null) {
        var result288 = [];
        var savedPos51 = this._pos;
        var savedPos52 = this._pos;
        var savedReportMatchFailuresVar7 = context.reportMatchFailures;
        context.reportMatchFailures = false;
        if (this._input.substr(this._pos, 2) === "*/") {
          var result293 = "*/";
          this._pos += 2;
        } else {
          var result293 = null;
          if (context.reportMatchFailures) {
            this._matchFailed(this._quoteString("*/"));
          }
        }
        context.reportMatchFailures = savedReportMatchFailuresVar7;
        if (result293 === null) {
          var result291 = '';
        } else {
          var result291 = null;
          this._pos = savedPos52;
        }
        if (result291 !== null) {
          if (this._input.length > this._pos) {
            var result292 = this._input[this._pos];
            this._pos++;
          } else {
            var result292 = null;
            if (context.reportMatchFailures) {
              this._matchFailed('any character');
            }
          }
          if (result292 !== null) {
            var result290 = [result291, result292];
          } else {
            var result290 = null;
            this._pos = savedPos51;
          }
        } else {
          var result290 = null;
          this._pos = savedPos51;
        }
        while (result290 !== null) {
          result288.push(result290);
          var savedPos51 = this._pos;
          var savedPos52 = this._pos;
          var savedReportMatchFailuresVar7 = context.reportMatchFailures;
          context.reportMatchFailures = false;
          if (this._input.substr(this._pos, 2) === "*/") {
            var result293 = "*/";
            this._pos += 2;
          } else {
            var result293 = null;
            if (context.reportMatchFailures) {
              this._matchFailed(this._quoteString("*/"));
            }
          }
          context.reportMatchFailures = savedReportMatchFailuresVar7;
          if (result293 === null) {
            var result291 = '';
          } else {
            var result291 = null;
            this._pos = savedPos52;
          }
          if (result291 !== null) {
            if (this._input.length > this._pos) {
              var result292 = this._input[this._pos];
              this._pos++;
            } else {
              var result292 = null;
              if (context.reportMatchFailures) {
                this._matchFailed('any character');
              }
            }
            if (result292 !== null) {
              var result290 = [result291, result292];
            } else {
              var result290 = null;
              this._pos = savedPos51;
            }
          } else {
            var result290 = null;
            this._pos = savedPos51;
          }
        }
        if (result288 !== null) {
          if (this._input.substr(this._pos, 2) === "*/") {
            var result289 = "*/";
            this._pos += 2;
          } else {
            var result289 = null;
            if (context.reportMatchFailures) {
              this._matchFailed(this._quoteString("*/"));
            }
          }
          if (result289 !== null) {
            var result286 = [result287, result288, result289];
          } else {
            var result286 = null;
            this._pos = savedPos50;
          }
        } else {
          var result286 = null;
          this._pos = savedPos50;
        }
      } else {
        var result286 = null;
        this._pos = savedPos50;
      }
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result286
      };
      return result286;
    },
    
    _parse_eol: function(context) {
      var cacheKey = "eol" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      var savedReportMatchFailures = context.reportMatchFailures;
      context.reportMatchFailures = false;
      if (this._input.substr(this._pos, 1) === "\n") {
        var result299 = "\n";
        this._pos += 1;
      } else {
        var result299 = null;
        if (context.reportMatchFailures) {
          this._matchFailed(this._quoteString("\n"));
        }
      }
      if (result299 !== null) {
        var result294 = result299;
      } else {
        if (this._input.substr(this._pos, 2) === "\r\n") {
          var result298 = "\r\n";
          this._pos += 2;
        } else {
          var result298 = null;
          if (context.reportMatchFailures) {
            this._matchFailed(this._quoteString("\r\n"));
          }
        }
        if (result298 !== null) {
          var result294 = result298;
        } else {
          if (this._input.substr(this._pos, 1) === "\r") {
            var result297 = "\r";
            this._pos += 1;
          } else {
            var result297 = null;
            if (context.reportMatchFailures) {
              this._matchFailed(this._quoteString("\r"));
            }
          }
          if (result297 !== null) {
            var result294 = result297;
          } else {
            if (this._input.substr(this._pos, 1) === "\u2028") {
              var result296 = "\u2028";
              this._pos += 1;
            } else {
              var result296 = null;
              if (context.reportMatchFailures) {
                this._matchFailed(this._quoteString("\u2028"));
              }
            }
            if (result296 !== null) {
              var result294 = result296;
            } else {
              if (this._input.substr(this._pos, 1) === "\u2029") {
                var result295 = "\u2029";
                this._pos += 1;
              } else {
                var result295 = null;
                if (context.reportMatchFailures) {
                  this._matchFailed(this._quoteString("\u2029"));
                }
              }
              if (result295 !== null) {
                var result294 = result295;
              } else {
                var result294 = null;;
              };
            };
          };
        };
      }
      context.reportMatchFailures = savedReportMatchFailures;
      if (context.reportMatchFailures && result294 === null) {
        this._matchFailed("end of line");
      }
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result294
      };
      return result294;
    },
    
    _parse_eolChar: function(context) {
      var cacheKey = "eolChar" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      
      if (this._input.substr(this._pos).match(/^[\n\r\u2028\u2029]/) !== null) {
        var result300 = this._input[this._pos];
        this._pos++;
      } else {
        var result300 = null;
        if (context.reportMatchFailures) {
          this._matchFailed('[' + "\\n\\r\\u2028\\u2029" + ']');
        }
      }
      
      
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result300
      };
      return result300;
    },
    
    _parse_whitespace: function(context) {
      var cacheKey = "whitespace" + '@' + this._pos;
      var cachedResult = this._cache[cacheKey];
      if (cachedResult !== undefined) {
        this._pos = cachedResult.nextPos;
        return cachedResult.result;
      }
      
      var pos = this._pos;
      
      var savedReportMatchFailures = context.reportMatchFailures;
      context.reportMatchFailures = false;
      if (this._input.substr(this._pos).match(/^[ 	 ﻿ ᠎ -   　]/) !== null) {
        var result301 = this._input[this._pos];
        this._pos++;
      } else {
        var result301 = null;
        if (context.reportMatchFailures) {
          this._matchFailed('[' + " 	 ﻿ ᠎ -   　" + ']');
        }
      }
      context.reportMatchFailures = savedReportMatchFailures;
      if (context.reportMatchFailures && result301 === null) {
        this._matchFailed("whitespace");
      }
      
      this._cache[cacheKey] = {
        nextPos: this._pos,
        result:  result301
      };
      return result301;
    },
    
    /*
     * Parses the input with a generated parser. If the parsing is successfull,
     * returns a value explicitly or implicitly specified by the grammar from
     * which the parser was generated (see |PEG.buildParser|). If the parsing is
     * unsuccessful, throws |PEG.grammarParser.SyntaxError| describing the error.
     */
    parse: function(input) {
      var that = this;
      
      function initialize() {
        that._input = input;
        that._pos = 0;
        that._rightmostMatchFailuresPos = 0;
        that._rightmostMatchFailuresExpected = [];
        that._cache = {};
      }
      
      function buildErrorMessage() {
        function buildExpected(failuresExpected) {
          switch (failuresExpected.length) {
            case 0:
              return 'end of input';
            case 1:
              return failuresExpected[0];
            default:
              failuresExpected.sort();
              return failuresExpected.slice(0, failuresExpected.length - 1).join(', ')
                + ' or '
                + failuresExpected[failuresExpected.length - 1];
          }
        }
        
        var expected = buildExpected(that._rightmostMatchFailuresExpected);
        var pos = Math.max(that._pos, that._rightmostMatchFailuresPos);
        var actual = pos < that._input.length
          ? that._quoteString(that._input.charAt(pos))
          : 'end of input';
        
        return 'Expected ' + expected + ' but ' + actual + ' found.';
      }
      
      function computeErrorPosition() {
        /*
         * The first idea was to use |String.split| to break the input up to the
         * error position along newlines and derive the line and column from
         * there. However IE's |split| implementation is so broken that it was
         * enough to prevent it.
         */
        
        var input = that._input;
        var pos = that._rightmostMatchFailuresPos;
        var line = 1;
        var column = 1;
        var seenCR = false;
        
        for (var i = 0; i < pos; i++) {
          var ch = input.charAt(i);
          if (ch === '\n') {
            if (!seenCR) { line++; }
            column = 1;
            seenCR = false;
          } else if (ch === '\r' | ch === '\u2028' || ch === '\u2029') {
            line++;
            column = 1;
            seenCR = true;
          } else {
            column++;
            seenCR = false;
          }
        }
        
        return { line: line, column: column };
      }
      
      initialize();
      
      var initialContext = {
        reportMatchFailures: true
      };
      
      var result = this['_parse_' + this._startRule](initialContext);
      
      /*
       * The parser is now in one of the following three states:
       *
       * 1. The parser successfully parsed the whole input.
       *
       *    - |result !== null|
       *    - |that._pos === input.length|
       *    - |that._rightmostMatchFailuresExpected.length| may or may not contain
       *      something
       *
       * 2. The parser successfully parsed only a part of the input.
       *
       *    - |result !== null|
       *    - |that._pos < input.length|
       *    - |that._rightmostMatchFailuresExpected.length| may or may not contain
       *      something
       *
       * 3. The parser did not successfully parse any part of the input.
       *
       *   - |result === null|
       *   - |that._pos === 0|
       *   - |that._rightmostMatchFailuresExpected.length| contains at least one failure
       *
       * All code following this comment (including called functions) must
       * handle these states.
       */
      if (result === null || this._pos !== input.length) {
        var errorPosition = computeErrorPosition();
        throw new this.SyntaxError(
          buildErrorMessage(),
          errorPosition.line,
          errorPosition.column
        );
      }
      
      return result;
    },
    
    /* Returns the parser source code. */
    toSource: function() { return this._source; }
  };
  
  /* Thrown when a parser encounters a syntax error. */
  
  result.SyntaxError = function(message, line, column) {
    this.name = 'SyntaxError';
    this.message = message;
    this.line = line;
    this.column = column;
  };
  
  result.SyntaxError.prototype = Error.prototype;
  
  return result;
})();
