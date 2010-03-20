PEG.grammarParser = (function(){
  var result = new PEG.Parser("grammar");
  
  result._parse_grammar = function(context) {
    this._cache["grammar"] = this._cache["grammar"] || [];
    var cachedResult = this._cache["grammar"][this._pos];
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
    
    
    
    this._cache["grammar"][pos] = {
      nextPos: this._pos,
      result:  result0
    };
    return result0;
  };
  
  result._parse_rule = function(context) {
    this._cache["rule"] = this._cache["rule"] || [];
    var cachedResult = this._cache["rule"][this._pos];
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
            this._matchFailed(new PEG.Parser.LiteralMatchFailure(""));
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
    
    
    
    this._cache["rule"][pos] = {
      nextPos: this._pos,
      result:  result8
    };
    return result8;
  };
  
  result._parse_expression = function(context) {
    this._cache["expression"] = this._cache["expression"] || [];
    var cachedResult = this._cache["expression"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    
    var result16 = this._parse_choice(context);
    
    
    
    this._cache["expression"][pos] = {
      nextPos: this._pos,
      result:  result16
    };
    return result16;
  };
  
  result._parse_choice = function(context) {
    this._cache["choice"] = this._cache["choice"] || [];
    var cachedResult = this._cache["choice"][this._pos];
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
    
    
    
    this._cache["choice"][pos] = {
      nextPos: this._pos,
      result:  result17
    };
    return result17;
  };
  
  result._parse_sequence = function(context) {
    this._cache["sequence"] = this._cache["sequence"] || [];
    var cachedResult = this._cache["sequence"][this._pos];
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
    
    
    
    this._cache["sequence"][pos] = {
      nextPos: this._pos,
      result:  result24
    };
    return result24;
  };
  
  result._parse_prefixed = function(context) {
    this._cache["prefixed"] = this._cache["prefixed"] || [];
    var cachedResult = this._cache["prefixed"][this._pos];
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
    
    
    
    this._cache["prefixed"][pos] = {
      nextPos: this._pos,
      result:  result33
    };
    return result33;
  };
  
  result._parse_suffixed = function(context) {
    this._cache["suffixed"] = this._cache["suffixed"] || [];
    var cachedResult = this._cache["suffixed"][this._pos];
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
    
    
    
    this._cache["suffixed"][pos] = {
      nextPos: this._pos,
      result:  result43
    };
    return result43;
  };
  
  result._parse_primary = function(context) {
    this._cache["primary"] = this._cache["primary"] || [];
    var cachedResult = this._cache["primary"][this._pos];
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
            this._matchFailed(new PEG.Parser.LiteralMatchFailure(""));
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
    
    
    
    this._cache["primary"][pos] = {
      nextPos: this._pos,
      result:  result57
    };
    return result57;
  };
  
  result._parse_action = function(context) {
    this._cache["action"] = this._cache["action"] || [];
    var cachedResult = this._cache["action"][this._pos];
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
      this._matchFailed(new PEG.Parser.NamedRuleMatchFailure("action"));
    }
    
    this._cache["action"][pos] = {
      nextPos: this._pos,
      result:  result78
    };
    return result78;
  };
  
  result._parse_braced = function(context) {
    this._cache["braced"] = this._cache["braced"] || [];
    var cachedResult = this._cache["braced"][this._pos];
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
        this._matchFailed(new PEG.Parser.LiteralMatchFailure("{"));
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
            this._matchFailed(new PEG.Parser.LiteralMatchFailure("}"));
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
    
    
    
    this._cache["braced"][pos] = {
      nextPos: this._pos,
      result:  result82
    };
    return result82;
  };
  
  result._parse_nonBraceCharacters = function(context) {
    this._cache["nonBraceCharacters"] = this._cache["nonBraceCharacters"] || [];
    var cachedResult = this._cache["nonBraceCharacters"][this._pos];
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
    
    
    
    this._cache["nonBraceCharacters"][pos] = {
      nextPos: this._pos,
      result:  result90
    };
    return result90;
  };
  
  result._parse_nonBraceCharacter = function(context) {
    this._cache["nonBraceCharacter"] = this._cache["nonBraceCharacter"] || [];
    var cachedResult = this._cache["nonBraceCharacter"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    
    var savedPos18 = this._pos;
    var savedPos19 = this._pos;
    var savedReportMatchFailuresVar1 = context.reportMatchFailures;
    context.reportMatchFailures = false;
    if (this._input.substr(this._pos, 1) === "{") {
      var result102 = "{";
      this._pos += 1;
    } else {
      var result102 = null;
      if (context.reportMatchFailures) {
        this._matchFailed(new PEG.Parser.LiteralMatchFailure("{"));
      }
    }
    if (result102 !== null) {
      var result100 = result102;
    } else {
      if (this._input.substr(this._pos, 1) === "}") {
        var result101 = "}";
        this._pos += 1;
      } else {
        var result101 = null;
        if (context.reportMatchFailures) {
          this._matchFailed(new PEG.Parser.LiteralMatchFailure("}"));
        }
      }
      if (result101 !== null) {
        var result100 = result101;
      } else {
        var result100 = null;;
      };
    }
    context.reportMatchFailures = savedReportMatchFailuresVar1;
    if (result100 === null) {
      var result98 = '';
    } else {
      var result98 = null;
      this._pos = savedPos19;
    }
    if (result98 !== null) {
      if (this._input.length > this._pos) {
        var result99 = this._input[this._pos];
        this._pos++;
      } else {
        var result99 = null;
        if (context.reportMatchFailures) {
          this._matchFailed(new PEG.Parser.AnyMatchFailure());
        }
      }
      if (result99 !== null) {
        var result97 = [result98, result99];
      } else {
        var result97 = null;
        this._pos = savedPos18;
      }
    } else {
      var result97 = null;
      this._pos = savedPos18;
    }
    var result96 = result97 !== null
      ? (function() {  return (arguments[1]);  }).apply(this, result97)
      : null;
    
    
    
    this._cache["nonBraceCharacter"][pos] = {
      nextPos: this._pos,
      result:  result96
    };
    return result96;
  };
  
  result._parse_colon = function(context) {
    this._cache["colon"] = this._cache["colon"] || [];
    var cachedResult = this._cache["colon"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    
    var savedPos20 = this._pos;
    if (this._input.substr(this._pos, 1) === ":") {
      var result105 = ":";
      this._pos += 1;
    } else {
      var result105 = null;
      if (context.reportMatchFailures) {
        this._matchFailed(new PEG.Parser.LiteralMatchFailure(":"));
      }
    }
    if (result105 !== null) {
      var result106 = this._parse___(context);
      if (result106 !== null) {
        var result104 = [result105, result106];
      } else {
        var result104 = null;
        this._pos = savedPos20;
      }
    } else {
      var result104 = null;
      this._pos = savedPos20;
    }
    var result103 = result104 !== null
      ? (function() {  return (arguments[0]);  }).apply(this, result104)
      : null;
    
    
    
    this._cache["colon"][pos] = {
      nextPos: this._pos,
      result:  result103
    };
    return result103;
  };
  
  result._parse_slash = function(context) {
    this._cache["slash"] = this._cache["slash"] || [];
    var cachedResult = this._cache["slash"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    
    var savedPos21 = this._pos;
    if (this._input.substr(this._pos, 1) === "/") {
      var result109 = "/";
      this._pos += 1;
    } else {
      var result109 = null;
      if (context.reportMatchFailures) {
        this._matchFailed(new PEG.Parser.LiteralMatchFailure("/"));
      }
    }
    if (result109 !== null) {
      var result110 = this._parse___(context);
      if (result110 !== null) {
        var result108 = [result109, result110];
      } else {
        var result108 = null;
        this._pos = savedPos21;
      }
    } else {
      var result108 = null;
      this._pos = savedPos21;
    }
    var result107 = result108 !== null
      ? (function() {  return (arguments[0]);  }).apply(this, result108)
      : null;
    
    
    
    this._cache["slash"][pos] = {
      nextPos: this._pos,
      result:  result107
    };
    return result107;
  };
  
  result._parse_and = function(context) {
    this._cache["and"] = this._cache["and"] || [];
    var cachedResult = this._cache["and"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    
    var savedPos22 = this._pos;
    if (this._input.substr(this._pos, 1) === "&") {
      var result113 = "&";
      this._pos += 1;
    } else {
      var result113 = null;
      if (context.reportMatchFailures) {
        this._matchFailed(new PEG.Parser.LiteralMatchFailure("&"));
      }
    }
    if (result113 !== null) {
      var result114 = this._parse___(context);
      if (result114 !== null) {
        var result112 = [result113, result114];
      } else {
        var result112 = null;
        this._pos = savedPos22;
      }
    } else {
      var result112 = null;
      this._pos = savedPos22;
    }
    var result111 = result112 !== null
      ? (function() {  return (arguments[0]);  }).apply(this, result112)
      : null;
    
    
    
    this._cache["and"][pos] = {
      nextPos: this._pos,
      result:  result111
    };
    return result111;
  };
  
  result._parse_not = function(context) {
    this._cache["not"] = this._cache["not"] || [];
    var cachedResult = this._cache["not"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    
    var savedPos23 = this._pos;
    if (this._input.substr(this._pos, 1) === "!") {
      var result117 = "!";
      this._pos += 1;
    } else {
      var result117 = null;
      if (context.reportMatchFailures) {
        this._matchFailed(new PEG.Parser.LiteralMatchFailure("!"));
      }
    }
    if (result117 !== null) {
      var result118 = this._parse___(context);
      if (result118 !== null) {
        var result116 = [result117, result118];
      } else {
        var result116 = null;
        this._pos = savedPos23;
      }
    } else {
      var result116 = null;
      this._pos = savedPos23;
    }
    var result115 = result116 !== null
      ? (function() {  return (arguments[0]);  }).apply(this, result116)
      : null;
    
    
    
    this._cache["not"][pos] = {
      nextPos: this._pos,
      result:  result115
    };
    return result115;
  };
  
  result._parse_question = function(context) {
    this._cache["question"] = this._cache["question"] || [];
    var cachedResult = this._cache["question"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    
    var savedPos24 = this._pos;
    if (this._input.substr(this._pos, 1) === "?") {
      var result121 = "?";
      this._pos += 1;
    } else {
      var result121 = null;
      if (context.reportMatchFailures) {
        this._matchFailed(new PEG.Parser.LiteralMatchFailure("?"));
      }
    }
    if (result121 !== null) {
      var result122 = this._parse___(context);
      if (result122 !== null) {
        var result120 = [result121, result122];
      } else {
        var result120 = null;
        this._pos = savedPos24;
      }
    } else {
      var result120 = null;
      this._pos = savedPos24;
    }
    var result119 = result120 !== null
      ? (function() {  return (arguments[0]);  }).apply(this, result120)
      : null;
    
    
    
    this._cache["question"][pos] = {
      nextPos: this._pos,
      result:  result119
    };
    return result119;
  };
  
  result._parse_star = function(context) {
    this._cache["star"] = this._cache["star"] || [];
    var cachedResult = this._cache["star"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    
    var savedPos25 = this._pos;
    if (this._input.substr(this._pos, 1) === "*") {
      var result125 = "*";
      this._pos += 1;
    } else {
      var result125 = null;
      if (context.reportMatchFailures) {
        this._matchFailed(new PEG.Parser.LiteralMatchFailure("*"));
      }
    }
    if (result125 !== null) {
      var result126 = this._parse___(context);
      if (result126 !== null) {
        var result124 = [result125, result126];
      } else {
        var result124 = null;
        this._pos = savedPos25;
      }
    } else {
      var result124 = null;
      this._pos = savedPos25;
    }
    var result123 = result124 !== null
      ? (function() {  return (arguments[0]);  }).apply(this, result124)
      : null;
    
    
    
    this._cache["star"][pos] = {
      nextPos: this._pos,
      result:  result123
    };
    return result123;
  };
  
  result._parse_plus = function(context) {
    this._cache["plus"] = this._cache["plus"] || [];
    var cachedResult = this._cache["plus"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    
    var savedPos26 = this._pos;
    if (this._input.substr(this._pos, 1) === "+") {
      var result129 = "+";
      this._pos += 1;
    } else {
      var result129 = null;
      if (context.reportMatchFailures) {
        this._matchFailed(new PEG.Parser.LiteralMatchFailure("+"));
      }
    }
    if (result129 !== null) {
      var result130 = this._parse___(context);
      if (result130 !== null) {
        var result128 = [result129, result130];
      } else {
        var result128 = null;
        this._pos = savedPos26;
      }
    } else {
      var result128 = null;
      this._pos = savedPos26;
    }
    var result127 = result128 !== null
      ? (function() {  return (arguments[0]);  }).apply(this, result128)
      : null;
    
    
    
    this._cache["plus"][pos] = {
      nextPos: this._pos,
      result:  result127
    };
    return result127;
  };
  
  result._parse_lparen = function(context) {
    this._cache["lparen"] = this._cache["lparen"] || [];
    var cachedResult = this._cache["lparen"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    
    var savedPos27 = this._pos;
    if (this._input.substr(this._pos, 1) === "(") {
      var result133 = "(";
      this._pos += 1;
    } else {
      var result133 = null;
      if (context.reportMatchFailures) {
        this._matchFailed(new PEG.Parser.LiteralMatchFailure("("));
      }
    }
    if (result133 !== null) {
      var result134 = this._parse___(context);
      if (result134 !== null) {
        var result132 = [result133, result134];
      } else {
        var result132 = null;
        this._pos = savedPos27;
      }
    } else {
      var result132 = null;
      this._pos = savedPos27;
    }
    var result131 = result132 !== null
      ? (function() {  return (arguments[0]);  }).apply(this, result132)
      : null;
    
    
    
    this._cache["lparen"][pos] = {
      nextPos: this._pos,
      result:  result131
    };
    return result131;
  };
  
  result._parse_rparen = function(context) {
    this._cache["rparen"] = this._cache["rparen"] || [];
    var cachedResult = this._cache["rparen"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    
    var savedPos28 = this._pos;
    if (this._input.substr(this._pos, 1) === ")") {
      var result137 = ")";
      this._pos += 1;
    } else {
      var result137 = null;
      if (context.reportMatchFailures) {
        this._matchFailed(new PEG.Parser.LiteralMatchFailure(")"));
      }
    }
    if (result137 !== null) {
      var result138 = this._parse___(context);
      if (result138 !== null) {
        var result136 = [result137, result138];
      } else {
        var result136 = null;
        this._pos = savedPos28;
      }
    } else {
      var result136 = null;
      this._pos = savedPos28;
    }
    var result135 = result136 !== null
      ? (function() {  return (arguments[0]);  }).apply(this, result136)
      : null;
    
    
    
    this._cache["rparen"][pos] = {
      nextPos: this._pos,
      result:  result135
    };
    return result135;
  };
  
  result._parse_dot = function(context) {
    this._cache["dot"] = this._cache["dot"] || [];
    var cachedResult = this._cache["dot"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    
    var savedPos29 = this._pos;
    if (this._input.substr(this._pos, 1) === ".") {
      var result141 = ".";
      this._pos += 1;
    } else {
      var result141 = null;
      if (context.reportMatchFailures) {
        this._matchFailed(new PEG.Parser.LiteralMatchFailure("."));
      }
    }
    if (result141 !== null) {
      var result142 = this._parse___(context);
      if (result142 !== null) {
        var result140 = [result141, result142];
      } else {
        var result140 = null;
        this._pos = savedPos29;
      }
    } else {
      var result140 = null;
      this._pos = savedPos29;
    }
    var result139 = result140 !== null
      ? (function() {  return (arguments[0]);  }).apply(this, result140)
      : null;
    
    
    
    this._cache["dot"][pos] = {
      nextPos: this._pos,
      result:  result139
    };
    return result139;
  };
  
  result._parse_identifier = function(context) {
    this._cache["identifier"] = this._cache["identifier"] || [];
    var cachedResult = this._cache["identifier"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    var savedReportMatchFailures = context.reportMatchFailures;
    context.reportMatchFailures = false;
    var savedPos30 = this._pos;
    var result155 = this._parse_letter(context);
    if (result155 !== null) {
      var result145 = result155;
    } else {
      if (this._input.substr(this._pos, 1) === "_") {
        var result154 = "_";
        this._pos += 1;
      } else {
        var result154 = null;
        if (context.reportMatchFailures) {
          this._matchFailed(new PEG.Parser.LiteralMatchFailure("_"));
        }
      }
      if (result154 !== null) {
        var result145 = result154;
      } else {
        if (this._input.substr(this._pos, 1) === "$") {
          var result153 = "$";
          this._pos += 1;
        } else {
          var result153 = null;
          if (context.reportMatchFailures) {
            this._matchFailed(new PEG.Parser.LiteralMatchFailure("$"));
          }
        }
        if (result153 !== null) {
          var result145 = result153;
        } else {
          var result145 = null;;
        };
      };
    }
    if (result145 !== null) {
      var result146 = [];
      var result152 = this._parse_letter(context);
      if (result152 !== null) {
        var result148 = result152;
      } else {
        var result151 = this._parse_digit(context);
        if (result151 !== null) {
          var result148 = result151;
        } else {
          if (this._input.substr(this._pos, 1) === "_") {
            var result150 = "_";
            this._pos += 1;
          } else {
            var result150 = null;
            if (context.reportMatchFailures) {
              this._matchFailed(new PEG.Parser.LiteralMatchFailure("_"));
            }
          }
          if (result150 !== null) {
            var result148 = result150;
          } else {
            if (this._input.substr(this._pos, 1) === "$") {
              var result149 = "$";
              this._pos += 1;
            } else {
              var result149 = null;
              if (context.reportMatchFailures) {
                this._matchFailed(new PEG.Parser.LiteralMatchFailure("$"));
              }
            }
            if (result149 !== null) {
              var result148 = result149;
            } else {
              var result148 = null;;
            };
          };
        };
      }
      while (result148 !== null) {
        result146.push(result148);
        var result152 = this._parse_letter(context);
        if (result152 !== null) {
          var result148 = result152;
        } else {
          var result151 = this._parse_digit(context);
          if (result151 !== null) {
            var result148 = result151;
          } else {
            if (this._input.substr(this._pos, 1) === "_") {
              var result150 = "_";
              this._pos += 1;
            } else {
              var result150 = null;
              if (context.reportMatchFailures) {
                this._matchFailed(new PEG.Parser.LiteralMatchFailure("_"));
              }
            }
            if (result150 !== null) {
              var result148 = result150;
            } else {
              if (this._input.substr(this._pos, 1) === "$") {
                var result149 = "$";
                this._pos += 1;
              } else {
                var result149 = null;
                if (context.reportMatchFailures) {
                  this._matchFailed(new PEG.Parser.LiteralMatchFailure("$"));
                }
              }
              if (result149 !== null) {
                var result148 = result149;
              } else {
                var result148 = null;;
              };
            };
          };
        }
      }
      if (result146 !== null) {
        var result147 = this._parse___(context);
        if (result147 !== null) {
          var result144 = [result145, result146, result147];
        } else {
          var result144 = null;
          this._pos = savedPos30;
        }
      } else {
        var result144 = null;
        this._pos = savedPos30;
      }
    } else {
      var result144 = null;
      this._pos = savedPos30;
    }
    var result143 = result144 !== null
      ? (function() { 
        return (arguments[0]) + (arguments[1]).join("");
       }).apply(this, result144)
      : null;
    context.reportMatchFailures = savedReportMatchFailures;
    if (context.reportMatchFailures && result143 === null) {
      this._matchFailed(new PEG.Parser.NamedRuleMatchFailure("identifier"));
    }
    
    this._cache["identifier"][pos] = {
      nextPos: this._pos,
      result:  result143
    };
    return result143;
  };
  
  result._parse_literal = function(context) {
    this._cache["literal"] = this._cache["literal"] || [];
    var cachedResult = this._cache["literal"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    var savedReportMatchFailures = context.reportMatchFailures;
    context.reportMatchFailures = false;
    var savedPos31 = this._pos;
    var result161 = this._parse_doubleQuotedLiteral(context);
    if (result161 !== null) {
      var result158 = result161;
    } else {
      var result160 = this._parse_singleQuotedLiteral(context);
      if (result160 !== null) {
        var result158 = result160;
      } else {
        var result158 = null;;
      };
    }
    if (result158 !== null) {
      var result159 = this._parse___(context);
      if (result159 !== null) {
        var result157 = [result158, result159];
      } else {
        var result157 = null;
        this._pos = savedPos31;
      }
    } else {
      var result157 = null;
      this._pos = savedPos31;
    }
    var result156 = result157 !== null
      ? (function() {  return (arguments[0]);  }).apply(this, result157)
      : null;
    context.reportMatchFailures = savedReportMatchFailures;
    if (context.reportMatchFailures && result156 === null) {
      this._matchFailed(new PEG.Parser.NamedRuleMatchFailure("literal"));
    }
    
    this._cache["literal"][pos] = {
      nextPos: this._pos,
      result:  result156
    };
    return result156;
  };
  
  result._parse_doubleQuotedLiteral = function(context) {
    this._cache["doubleQuotedLiteral"] = this._cache["doubleQuotedLiteral"] || [];
    var cachedResult = this._cache["doubleQuotedLiteral"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    
    var savedPos32 = this._pos;
    if (this._input.substr(this._pos, 1) === "\"") {
      var result164 = "\"";
      this._pos += 1;
    } else {
      var result164 = null;
      if (context.reportMatchFailures) {
        this._matchFailed(new PEG.Parser.LiteralMatchFailure("\""));
      }
    }
    if (result164 !== null) {
      var result165 = [];
      var result167 = this._parse_doubleQuotedCharacter(context);
      while (result167 !== null) {
        result165.push(result167);
        var result167 = this._parse_doubleQuotedCharacter(context);
      }
      if (result165 !== null) {
        if (this._input.substr(this._pos, 1) === "\"") {
          var result166 = "\"";
          this._pos += 1;
        } else {
          var result166 = null;
          if (context.reportMatchFailures) {
            this._matchFailed(new PEG.Parser.LiteralMatchFailure("\""));
          }
        }
        if (result166 !== null) {
          var result163 = [result164, result165, result166];
        } else {
          var result163 = null;
          this._pos = savedPos32;
        }
      } else {
        var result163 = null;
        this._pos = savedPos32;
      }
    } else {
      var result163 = null;
      this._pos = savedPos32;
    }
    var result162 = result163 !== null
      ? (function() {  return (arguments[1]).join("");  }).apply(this, result163)
      : null;
    
    
    
    this._cache["doubleQuotedLiteral"][pos] = {
      nextPos: this._pos,
      result:  result162
    };
    return result162;
  };
  
  result._parse_doubleQuotedCharacter = function(context) {
    this._cache["doubleQuotedCharacter"] = this._cache["doubleQuotedCharacter"] || [];
    var cachedResult = this._cache["doubleQuotedCharacter"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    
    var result174 = this._parse_simpleDoubleQuotedCharacter(context);
    if (result174 !== null) {
      var result168 = result174;
    } else {
      var result173 = this._parse_simpleEscapeSequence(context);
      if (result173 !== null) {
        var result168 = result173;
      } else {
        var result172 = this._parse_zeroEscapeSequence(context);
        if (result172 !== null) {
          var result168 = result172;
        } else {
          var result171 = this._parse_hexEscapeSequence(context);
          if (result171 !== null) {
            var result168 = result171;
          } else {
            var result170 = this._parse_unicodeEscapeSequence(context);
            if (result170 !== null) {
              var result168 = result170;
            } else {
              var result169 = this._parse_eolEscapeSequence(context);
              if (result169 !== null) {
                var result168 = result169;
              } else {
                var result168 = null;;
              };
            };
          };
        };
      };
    }
    
    
    
    this._cache["doubleQuotedCharacter"][pos] = {
      nextPos: this._pos,
      result:  result168
    };
    return result168;
  };
  
  result._parse_simpleDoubleQuotedCharacter = function(context) {
    this._cache["simpleDoubleQuotedCharacter"] = this._cache["simpleDoubleQuotedCharacter"] || [];
    var cachedResult = this._cache["simpleDoubleQuotedCharacter"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    
    var savedPos33 = this._pos;
    var savedPos34 = this._pos;
    var savedReportMatchFailuresVar2 = context.reportMatchFailures;
    context.reportMatchFailures = false;
    if (this._input.substr(this._pos, 1) === "\"") {
      var result182 = "\"";
      this._pos += 1;
    } else {
      var result182 = null;
      if (context.reportMatchFailures) {
        this._matchFailed(new PEG.Parser.LiteralMatchFailure("\""));
      }
    }
    if (result182 !== null) {
      var result179 = result182;
    } else {
      if (this._input.substr(this._pos, 1) === "\\") {
        var result181 = "\\";
        this._pos += 1;
      } else {
        var result181 = null;
        if (context.reportMatchFailures) {
          this._matchFailed(new PEG.Parser.LiteralMatchFailure("\\"));
        }
      }
      if (result181 !== null) {
        var result179 = result181;
      } else {
        var result180 = this._parse_eolChar(context);
        if (result180 !== null) {
          var result179 = result180;
        } else {
          var result179 = null;;
        };
      };
    }
    context.reportMatchFailures = savedReportMatchFailuresVar2;
    if (result179 === null) {
      var result177 = '';
    } else {
      var result177 = null;
      this._pos = savedPos34;
    }
    if (result177 !== null) {
      if (this._input.length > this._pos) {
        var result178 = this._input[this._pos];
        this._pos++;
      } else {
        var result178 = null;
        if (context.reportMatchFailures) {
          this._matchFailed(new PEG.Parser.AnyMatchFailure());
        }
      }
      if (result178 !== null) {
        var result176 = [result177, result178];
      } else {
        var result176 = null;
        this._pos = savedPos33;
      }
    } else {
      var result176 = null;
      this._pos = savedPos33;
    }
    var result175 = result176 !== null
      ? (function() {  return (arguments[1]);  }).apply(this, result176)
      : null;
    
    
    
    this._cache["simpleDoubleQuotedCharacter"][pos] = {
      nextPos: this._pos,
      result:  result175
    };
    return result175;
  };
  
  result._parse_singleQuotedLiteral = function(context) {
    this._cache["singleQuotedLiteral"] = this._cache["singleQuotedLiteral"] || [];
    var cachedResult = this._cache["singleQuotedLiteral"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    
    var savedPos35 = this._pos;
    if (this._input.substr(this._pos, 1) === "'") {
      var result185 = "'";
      this._pos += 1;
    } else {
      var result185 = null;
      if (context.reportMatchFailures) {
        this._matchFailed(new PEG.Parser.LiteralMatchFailure("'"));
      }
    }
    if (result185 !== null) {
      var result186 = [];
      var result188 = this._parse_singleQuotedCharacter(context);
      while (result188 !== null) {
        result186.push(result188);
        var result188 = this._parse_singleQuotedCharacter(context);
      }
      if (result186 !== null) {
        if (this._input.substr(this._pos, 1) === "'") {
          var result187 = "'";
          this._pos += 1;
        } else {
          var result187 = null;
          if (context.reportMatchFailures) {
            this._matchFailed(new PEG.Parser.LiteralMatchFailure("'"));
          }
        }
        if (result187 !== null) {
          var result184 = [result185, result186, result187];
        } else {
          var result184 = null;
          this._pos = savedPos35;
        }
      } else {
        var result184 = null;
        this._pos = savedPos35;
      }
    } else {
      var result184 = null;
      this._pos = savedPos35;
    }
    var result183 = result184 !== null
      ? (function() {  return (arguments[1]).join("");  }).apply(this, result184)
      : null;
    
    
    
    this._cache["singleQuotedLiteral"][pos] = {
      nextPos: this._pos,
      result:  result183
    };
    return result183;
  };
  
  result._parse_singleQuotedCharacter = function(context) {
    this._cache["singleQuotedCharacter"] = this._cache["singleQuotedCharacter"] || [];
    var cachedResult = this._cache["singleQuotedCharacter"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    
    var result195 = this._parse_simpleSingleQuotedCharacter(context);
    if (result195 !== null) {
      var result189 = result195;
    } else {
      var result194 = this._parse_simpleEscapeSequence(context);
      if (result194 !== null) {
        var result189 = result194;
      } else {
        var result193 = this._parse_zeroEscapeSequence(context);
        if (result193 !== null) {
          var result189 = result193;
        } else {
          var result192 = this._parse_hexEscapeSequence(context);
          if (result192 !== null) {
            var result189 = result192;
          } else {
            var result191 = this._parse_unicodeEscapeSequence(context);
            if (result191 !== null) {
              var result189 = result191;
            } else {
              var result190 = this._parse_eolEscapeSequence(context);
              if (result190 !== null) {
                var result189 = result190;
              } else {
                var result189 = null;;
              };
            };
          };
        };
      };
    }
    
    
    
    this._cache["singleQuotedCharacter"][pos] = {
      nextPos: this._pos,
      result:  result189
    };
    return result189;
  };
  
  result._parse_simpleSingleQuotedCharacter = function(context) {
    this._cache["simpleSingleQuotedCharacter"] = this._cache["simpleSingleQuotedCharacter"] || [];
    var cachedResult = this._cache["simpleSingleQuotedCharacter"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    
    var savedPos36 = this._pos;
    var savedPos37 = this._pos;
    var savedReportMatchFailuresVar3 = context.reportMatchFailures;
    context.reportMatchFailures = false;
    if (this._input.substr(this._pos, 1) === "'") {
      var result203 = "'";
      this._pos += 1;
    } else {
      var result203 = null;
      if (context.reportMatchFailures) {
        this._matchFailed(new PEG.Parser.LiteralMatchFailure("'"));
      }
    }
    if (result203 !== null) {
      var result200 = result203;
    } else {
      if (this._input.substr(this._pos, 1) === "\\") {
        var result202 = "\\";
        this._pos += 1;
      } else {
        var result202 = null;
        if (context.reportMatchFailures) {
          this._matchFailed(new PEG.Parser.LiteralMatchFailure("\\"));
        }
      }
      if (result202 !== null) {
        var result200 = result202;
      } else {
        var result201 = this._parse_eolChar(context);
        if (result201 !== null) {
          var result200 = result201;
        } else {
          var result200 = null;;
        };
      };
    }
    context.reportMatchFailures = savedReportMatchFailuresVar3;
    if (result200 === null) {
      var result198 = '';
    } else {
      var result198 = null;
      this._pos = savedPos37;
    }
    if (result198 !== null) {
      if (this._input.length > this._pos) {
        var result199 = this._input[this._pos];
        this._pos++;
      } else {
        var result199 = null;
        if (context.reportMatchFailures) {
          this._matchFailed(new PEG.Parser.AnyMatchFailure());
        }
      }
      if (result199 !== null) {
        var result197 = [result198, result199];
      } else {
        var result197 = null;
        this._pos = savedPos36;
      }
    } else {
      var result197 = null;
      this._pos = savedPos36;
    }
    var result196 = result197 !== null
      ? (function() {  return (arguments[1]);  }).apply(this, result197)
      : null;
    
    
    
    this._cache["simpleSingleQuotedCharacter"][pos] = {
      nextPos: this._pos,
      result:  result196
    };
    return result196;
  };
  
  result._parse_class = function(context) {
    this._cache["class"] = this._cache["class"] || [];
    var cachedResult = this._cache["class"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    var savedReportMatchFailures = context.reportMatchFailures;
    context.reportMatchFailures = false;
    var savedPos38 = this._pos;
    if (this._input.substr(this._pos, 1) === "[") {
      var result206 = "[";
      this._pos += 1;
    } else {
      var result206 = null;
      if (context.reportMatchFailures) {
        this._matchFailed(new PEG.Parser.LiteralMatchFailure("["));
      }
    }
    if (result206 !== null) {
      var result207 = [];
      var result212 = this._parse_classCharacterRange(context);
      if (result212 !== null) {
        var result210 = result212;
      } else {
        var result211 = this._parse_classCharacter(context);
        if (result211 !== null) {
          var result210 = result211;
        } else {
          var result210 = null;;
        };
      }
      while (result210 !== null) {
        result207.push(result210);
        var result212 = this._parse_classCharacterRange(context);
        if (result212 !== null) {
          var result210 = result212;
        } else {
          var result211 = this._parse_classCharacter(context);
          if (result211 !== null) {
            var result210 = result211;
          } else {
            var result210 = null;;
          };
        }
      }
      if (result207 !== null) {
        if (this._input.substr(this._pos, 1) === "]") {
          var result208 = "]";
          this._pos += 1;
        } else {
          var result208 = null;
          if (context.reportMatchFailures) {
            this._matchFailed(new PEG.Parser.LiteralMatchFailure("]"));
          }
        }
        if (result208 !== null) {
          var result209 = this._parse___(context);
          if (result209 !== null) {
            var result205 = [result206, result207, result208, result209];
          } else {
            var result205 = null;
            this._pos = savedPos38;
          }
        } else {
          var result205 = null;
          this._pos = savedPos38;
        }
      } else {
        var result205 = null;
        this._pos = savedPos38;
      }
    } else {
      var result205 = null;
      this._pos = savedPos38;
    }
    var result204 = result205 !== null
      ? (function() { 
        return (arguments[1]).join("");
       }).apply(this, result205)
      : null;
    context.reportMatchFailures = savedReportMatchFailures;
    if (context.reportMatchFailures && result204 === null) {
      this._matchFailed(new PEG.Parser.NamedRuleMatchFailure("character class"));
    }
    
    this._cache["class"][pos] = {
      nextPos: this._pos,
      result:  result204
    };
    return result204;
  };
  
  result._parse_classCharacterRange = function(context) {
    this._cache["classCharacterRange"] = this._cache["classCharacterRange"] || [];
    var cachedResult = this._cache["classCharacterRange"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    
    var savedPos39 = this._pos;
    var result215 = this._parse_bracketDelimitedCharacter(context);
    if (result215 !== null) {
      if (this._input.substr(this._pos, 1) === "-") {
        var result216 = "-";
        this._pos += 1;
      } else {
        var result216 = null;
        if (context.reportMatchFailures) {
          this._matchFailed(new PEG.Parser.LiteralMatchFailure("-"));
        }
      }
      if (result216 !== null) {
        var result217 = this._parse_bracketDelimitedCharacter(context);
        if (result217 !== null) {
          var result214 = [result215, result216, result217];
        } else {
          var result214 = null;
          this._pos = savedPos39;
        }
      } else {
        var result214 = null;
        this._pos = savedPos39;
      }
    } else {
      var result214 = null;
      this._pos = savedPos39;
    }
    var result213 = result214 !== null
      ? (function() { 
        if ((arguments[0]).charCodeAt(0) > (arguments[2]).charCodeAt(0)) {
          throw new PEG.Parser.SyntaxError(
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
       }).apply(this, result214)
      : null;
    
    
    
    this._cache["classCharacterRange"][pos] = {
      nextPos: this._pos,
      result:  result213
    };
    return result213;
  };
  
  result._parse_classCharacter = function(context) {
    this._cache["classCharacter"] = this._cache["classCharacter"] || [];
    var cachedResult = this._cache["classCharacter"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    
    var result219 = this._parse_bracketDelimitedCharacter(context);
    var result218 = result219 !== null
      ? (function() { 
        return PEG.RegExpUtils.quoteForClass((arguments[0]));
       }).call(this, result219)
      : null;
    
    
    
    this._cache["classCharacter"][pos] = {
      nextPos: this._pos,
      result:  result218
    };
    return result218;
  };
  
  result._parse_bracketDelimitedCharacter = function(context) {
    this._cache["bracketDelimitedCharacter"] = this._cache["bracketDelimitedCharacter"] || [];
    var cachedResult = this._cache["bracketDelimitedCharacter"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    
    var result226 = this._parse_simpleBracketDelimitedCharacter(context);
    if (result226 !== null) {
      var result220 = result226;
    } else {
      var result225 = this._parse_simpleEscapeSequence(context);
      if (result225 !== null) {
        var result220 = result225;
      } else {
        var result224 = this._parse_zeroEscapeSequence(context);
        if (result224 !== null) {
          var result220 = result224;
        } else {
          var result223 = this._parse_hexEscapeSequence(context);
          if (result223 !== null) {
            var result220 = result223;
          } else {
            var result222 = this._parse_unicodeEscapeSequence(context);
            if (result222 !== null) {
              var result220 = result222;
            } else {
              var result221 = this._parse_eolEscapeSequence(context);
              if (result221 !== null) {
                var result220 = result221;
              } else {
                var result220 = null;;
              };
            };
          };
        };
      };
    }
    
    
    
    this._cache["bracketDelimitedCharacter"][pos] = {
      nextPos: this._pos,
      result:  result220
    };
    return result220;
  };
  
  result._parse_simpleBracketDelimitedCharacter = function(context) {
    this._cache["simpleBracketDelimitedCharacter"] = this._cache["simpleBracketDelimitedCharacter"] || [];
    var cachedResult = this._cache["simpleBracketDelimitedCharacter"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    
    var savedPos40 = this._pos;
    var savedPos41 = this._pos;
    var savedReportMatchFailuresVar4 = context.reportMatchFailures;
    context.reportMatchFailures = false;
    if (this._input.substr(this._pos, 1) === "]") {
      var result234 = "]";
      this._pos += 1;
    } else {
      var result234 = null;
      if (context.reportMatchFailures) {
        this._matchFailed(new PEG.Parser.LiteralMatchFailure("]"));
      }
    }
    if (result234 !== null) {
      var result231 = result234;
    } else {
      if (this._input.substr(this._pos, 1) === "\\") {
        var result233 = "\\";
        this._pos += 1;
      } else {
        var result233 = null;
        if (context.reportMatchFailures) {
          this._matchFailed(new PEG.Parser.LiteralMatchFailure("\\"));
        }
      }
      if (result233 !== null) {
        var result231 = result233;
      } else {
        var result232 = this._parse_eolChar(context);
        if (result232 !== null) {
          var result231 = result232;
        } else {
          var result231 = null;;
        };
      };
    }
    context.reportMatchFailures = savedReportMatchFailuresVar4;
    if (result231 === null) {
      var result229 = '';
    } else {
      var result229 = null;
      this._pos = savedPos41;
    }
    if (result229 !== null) {
      if (this._input.length > this._pos) {
        var result230 = this._input[this._pos];
        this._pos++;
      } else {
        var result230 = null;
        if (context.reportMatchFailures) {
          this._matchFailed(new PEG.Parser.AnyMatchFailure());
        }
      }
      if (result230 !== null) {
        var result228 = [result229, result230];
      } else {
        var result228 = null;
        this._pos = savedPos40;
      }
    } else {
      var result228 = null;
      this._pos = savedPos40;
    }
    var result227 = result228 !== null
      ? (function() {  return (arguments[1]);  }).apply(this, result228)
      : null;
    
    
    
    this._cache["simpleBracketDelimitedCharacter"][pos] = {
      nextPos: this._pos,
      result:  result227
    };
    return result227;
  };
  
  result._parse_simpleEscapeSequence = function(context) {
    this._cache["simpleEscapeSequence"] = this._cache["simpleEscapeSequence"] || [];
    var cachedResult = this._cache["simpleEscapeSequence"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    
    var savedPos42 = this._pos;
    if (this._input.substr(this._pos, 1) === "\\") {
      var result237 = "\\";
      this._pos += 1;
    } else {
      var result237 = null;
      if (context.reportMatchFailures) {
        this._matchFailed(new PEG.Parser.LiteralMatchFailure("\\"));
      }
    }
    if (result237 !== null) {
      var savedPos43 = this._pos;
      var savedReportMatchFailuresVar5 = context.reportMatchFailures;
      context.reportMatchFailures = false;
      var result244 = this._parse_digit(context);
      if (result244 !== null) {
        var result240 = result244;
      } else {
        if (this._input.substr(this._pos, 1) === "x") {
          var result243 = "x";
          this._pos += 1;
        } else {
          var result243 = null;
          if (context.reportMatchFailures) {
            this._matchFailed(new PEG.Parser.LiteralMatchFailure("x"));
          }
        }
        if (result243 !== null) {
          var result240 = result243;
        } else {
          if (this._input.substr(this._pos, 1) === "u") {
            var result242 = "u";
            this._pos += 1;
          } else {
            var result242 = null;
            if (context.reportMatchFailures) {
              this._matchFailed(new PEG.Parser.LiteralMatchFailure("u"));
            }
          }
          if (result242 !== null) {
            var result240 = result242;
          } else {
            var result241 = this._parse_eolChar(context);
            if (result241 !== null) {
              var result240 = result241;
            } else {
              var result240 = null;;
            };
          };
        };
      }
      context.reportMatchFailures = savedReportMatchFailuresVar5;
      if (result240 === null) {
        var result238 = '';
      } else {
        var result238 = null;
        this._pos = savedPos43;
      }
      if (result238 !== null) {
        if (this._input.length > this._pos) {
          var result239 = this._input[this._pos];
          this._pos++;
        } else {
          var result239 = null;
          if (context.reportMatchFailures) {
            this._matchFailed(new PEG.Parser.AnyMatchFailure());
          }
        }
        if (result239 !== null) {
          var result236 = [result237, result238, result239];
        } else {
          var result236 = null;
          this._pos = savedPos42;
        }
      } else {
        var result236 = null;
        this._pos = savedPos42;
      }
    } else {
      var result236 = null;
      this._pos = savedPos42;
    }
    var result235 = result236 !== null
      ? (function() { 
        return (arguments[2])
          .replace("b", "\b")
          .replace("f", "\f")
          .replace("n", "\n")
          .replace("r", "\r")
          .replace("t", "\t")
          .replace("v", "\v")
       }).apply(this, result236)
      : null;
    
    
    
    this._cache["simpleEscapeSequence"][pos] = {
      nextPos: this._pos,
      result:  result235
    };
    return result235;
  };
  
  result._parse_zeroEscapeSequence = function(context) {
    this._cache["zeroEscapeSequence"] = this._cache["zeroEscapeSequence"] || [];
    var cachedResult = this._cache["zeroEscapeSequence"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    
    var savedPos44 = this._pos;
    if (this._input.substr(this._pos, 2) === "\\0") {
      var result247 = "\\0";
      this._pos += 2;
    } else {
      var result247 = null;
      if (context.reportMatchFailures) {
        this._matchFailed(new PEG.Parser.LiteralMatchFailure("\\0"));
      }
    }
    if (result247 !== null) {
      var savedPos45 = this._pos;
      var savedReportMatchFailuresVar6 = context.reportMatchFailures;
      context.reportMatchFailures = false;
      var result249 = this._parse_digit(context);
      context.reportMatchFailures = savedReportMatchFailuresVar6;
      if (result249 === null) {
        var result248 = '';
      } else {
        var result248 = null;
        this._pos = savedPos45;
      }
      if (result248 !== null) {
        var result246 = [result247, result248];
      } else {
        var result246 = null;
        this._pos = savedPos44;
      }
    } else {
      var result246 = null;
      this._pos = savedPos44;
    }
    var result245 = result246 !== null
      ? (function() {  return "\0";  }).apply(this, result246)
      : null;
    
    
    
    this._cache["zeroEscapeSequence"][pos] = {
      nextPos: this._pos,
      result:  result245
    };
    return result245;
  };
  
  result._parse_hexEscapeSequence = function(context) {
    this._cache["hexEscapeSequence"] = this._cache["hexEscapeSequence"] || [];
    var cachedResult = this._cache["hexEscapeSequence"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    
    var savedPos46 = this._pos;
    if (this._input.substr(this._pos, 2) === "\\x") {
      var result252 = "\\x";
      this._pos += 2;
    } else {
      var result252 = null;
      if (context.reportMatchFailures) {
        this._matchFailed(new PEG.Parser.LiteralMatchFailure("\\x"));
      }
    }
    if (result252 !== null) {
      var result253 = this._parse_hexDigit(context);
      if (result253 !== null) {
        var result254 = this._parse_hexDigit(context);
        if (result254 !== null) {
          var result251 = [result252, result253, result254];
        } else {
          var result251 = null;
          this._pos = savedPos46;
        }
      } else {
        var result251 = null;
        this._pos = savedPos46;
      }
    } else {
      var result251 = null;
      this._pos = savedPos46;
    }
    var result250 = result251 !== null
      ? (function() { 
        return String.fromCharCode(parseInt("0x" + (arguments[1]) + (arguments[2])));
       }).apply(this, result251)
      : null;
    
    
    
    this._cache["hexEscapeSequence"][pos] = {
      nextPos: this._pos,
      result:  result250
    };
    return result250;
  };
  
  result._parse_unicodeEscapeSequence = function(context) {
    this._cache["unicodeEscapeSequence"] = this._cache["unicodeEscapeSequence"] || [];
    var cachedResult = this._cache["unicodeEscapeSequence"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    
    var savedPos47 = this._pos;
    if (this._input.substr(this._pos, 2) === "\\u") {
      var result257 = "\\u";
      this._pos += 2;
    } else {
      var result257 = null;
      if (context.reportMatchFailures) {
        this._matchFailed(new PEG.Parser.LiteralMatchFailure("\\u"));
      }
    }
    if (result257 !== null) {
      var result258 = this._parse_hexDigit(context);
      if (result258 !== null) {
        var result259 = this._parse_hexDigit(context);
        if (result259 !== null) {
          var result260 = this._parse_hexDigit(context);
          if (result260 !== null) {
            var result261 = this._parse_hexDigit(context);
            if (result261 !== null) {
              var result256 = [result257, result258, result259, result260, result261];
            } else {
              var result256 = null;
              this._pos = savedPos47;
            }
          } else {
            var result256 = null;
            this._pos = savedPos47;
          }
        } else {
          var result256 = null;
          this._pos = savedPos47;
        }
      } else {
        var result256 = null;
        this._pos = savedPos47;
      }
    } else {
      var result256 = null;
      this._pos = savedPos47;
    }
    var result255 = result256 !== null
      ? (function() { 
        return String.fromCharCode(parseInt("0x" + (arguments[1]) + (arguments[2]) + (arguments[3]) + (arguments[4])));
       }).apply(this, result256)
      : null;
    
    
    
    this._cache["unicodeEscapeSequence"][pos] = {
      nextPos: this._pos,
      result:  result255
    };
    return result255;
  };
  
  result._parse_eolEscapeSequence = function(context) {
    this._cache["eolEscapeSequence"] = this._cache["eolEscapeSequence"] || [];
    var cachedResult = this._cache["eolEscapeSequence"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    
    var savedPos48 = this._pos;
    if (this._input.substr(this._pos, 1) === "\\") {
      var result264 = "\\";
      this._pos += 1;
    } else {
      var result264 = null;
      if (context.reportMatchFailures) {
        this._matchFailed(new PEG.Parser.LiteralMatchFailure("\\"));
      }
    }
    if (result264 !== null) {
      var result265 = this._parse_eol(context);
      if (result265 !== null) {
        var result263 = [result264, result265];
      } else {
        var result263 = null;
        this._pos = savedPos48;
      }
    } else {
      var result263 = null;
      this._pos = savedPos48;
    }
    var result262 = result263 !== null
      ? (function() {  return (arguments[1]);  }).apply(this, result263)
      : null;
    
    
    
    this._cache["eolEscapeSequence"][pos] = {
      nextPos: this._pos,
      result:  result262
    };
    return result262;
  };
  
  result._parse_digit = function(context) {
    this._cache["digit"] = this._cache["digit"] || [];
    var cachedResult = this._cache["digit"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    
    if (this._input.substr(this._pos).match(/^[0-9]/) !== null) {
      var result266 = this._input[this._pos];
      this._pos++;
    } else {
      var result266 = null;
      if (context.reportMatchFailures) {
        this._matchFailed(new PEG.Parser.ClassMatchFailure("0-9"));
      }
    }
    
    
    
    this._cache["digit"][pos] = {
      nextPos: this._pos,
      result:  result266
    };
    return result266;
  };
  
  result._parse_hexDigit = function(context) {
    this._cache["hexDigit"] = this._cache["hexDigit"] || [];
    var cachedResult = this._cache["hexDigit"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    
    if (this._input.substr(this._pos).match(/^[0-9a-fA-F]/) !== null) {
      var result267 = this._input[this._pos];
      this._pos++;
    } else {
      var result267 = null;
      if (context.reportMatchFailures) {
        this._matchFailed(new PEG.Parser.ClassMatchFailure("0-9a-fA-F"));
      }
    }
    
    
    
    this._cache["hexDigit"][pos] = {
      nextPos: this._pos,
      result:  result267
    };
    return result267;
  };
  
  result._parse_letter = function(context) {
    this._cache["letter"] = this._cache["letter"] || [];
    var cachedResult = this._cache["letter"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    
    var result270 = this._parse_lowerCaseLetter(context);
    if (result270 !== null) {
      var result268 = result270;
    } else {
      var result269 = this._parse_upperCaseLetter(context);
      if (result269 !== null) {
        var result268 = result269;
      } else {
        var result268 = null;;
      };
    }
    
    
    
    this._cache["letter"][pos] = {
      nextPos: this._pos,
      result:  result268
    };
    return result268;
  };
  
  result._parse_lowerCaseLetter = function(context) {
    this._cache["lowerCaseLetter"] = this._cache["lowerCaseLetter"] || [];
    var cachedResult = this._cache["lowerCaseLetter"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    
    if (this._input.substr(this._pos).match(/^[a-z]/) !== null) {
      var result271 = this._input[this._pos];
      this._pos++;
    } else {
      var result271 = null;
      if (context.reportMatchFailures) {
        this._matchFailed(new PEG.Parser.ClassMatchFailure("a-z"));
      }
    }
    
    
    
    this._cache["lowerCaseLetter"][pos] = {
      nextPos: this._pos,
      result:  result271
    };
    return result271;
  };
  
  result._parse_upperCaseLetter = function(context) {
    this._cache["upperCaseLetter"] = this._cache["upperCaseLetter"] || [];
    var cachedResult = this._cache["upperCaseLetter"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    
    if (this._input.substr(this._pos).match(/^[A-Z]/) !== null) {
      var result272 = this._input[this._pos];
      this._pos++;
    } else {
      var result272 = null;
      if (context.reportMatchFailures) {
        this._matchFailed(new PEG.Parser.ClassMatchFailure("A-Z"));
      }
    }
    
    
    
    this._cache["upperCaseLetter"][pos] = {
      nextPos: this._pos,
      result:  result272
    };
    return result272;
  };
  
  result._parse___ = function(context) {
    this._cache["__"] = this._cache["__"] || [];
    var cachedResult = this._cache["__"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    
    var result273 = [];
    var result277 = this._parse_whitespace(context);
    if (result277 !== null) {
      var result274 = result277;
    } else {
      var result276 = this._parse_eol(context);
      if (result276 !== null) {
        var result274 = result276;
      } else {
        var result275 = this._parse_comment(context);
        if (result275 !== null) {
          var result274 = result275;
        } else {
          var result274 = null;;
        };
      };
    }
    while (result274 !== null) {
      result273.push(result274);
      var result277 = this._parse_whitespace(context);
      if (result277 !== null) {
        var result274 = result277;
      } else {
        var result276 = this._parse_eol(context);
        if (result276 !== null) {
          var result274 = result276;
        } else {
          var result275 = this._parse_comment(context);
          if (result275 !== null) {
            var result274 = result275;
          } else {
            var result274 = null;;
          };
        };
      }
    }
    
    
    
    this._cache["__"][pos] = {
      nextPos: this._pos,
      result:  result273
    };
    return result273;
  };
  
  result._parse_comment = function(context) {
    this._cache["comment"] = this._cache["comment"] || [];
    var cachedResult = this._cache["comment"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    var savedReportMatchFailures = context.reportMatchFailures;
    context.reportMatchFailures = false;
    var result280 = this._parse_singleLineComment(context);
    if (result280 !== null) {
      var result278 = result280;
    } else {
      var result279 = this._parse_multiLineComment(context);
      if (result279 !== null) {
        var result278 = result279;
      } else {
        var result278 = null;;
      };
    }
    context.reportMatchFailures = savedReportMatchFailures;
    if (context.reportMatchFailures && result278 === null) {
      this._matchFailed(new PEG.Parser.NamedRuleMatchFailure("comment"));
    }
    
    this._cache["comment"][pos] = {
      nextPos: this._pos,
      result:  result278
    };
    return result278;
  };
  
  result._parse_singleLineComment = function(context) {
    this._cache["singleLineComment"] = this._cache["singleLineComment"] || [];
    var cachedResult = this._cache["singleLineComment"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    
    var savedPos49 = this._pos;
    if (this._input.substr(this._pos, 2) === "//") {
      var result282 = "//";
      this._pos += 2;
    } else {
      var result282 = null;
      if (context.reportMatchFailures) {
        this._matchFailed(new PEG.Parser.LiteralMatchFailure("//"));
      }
    }
    if (result282 !== null) {
      var result283 = [];
      var savedPos50 = this._pos;
      var savedPos51 = this._pos;
      var savedReportMatchFailuresVar7 = context.reportMatchFailures;
      context.reportMatchFailures = false;
      var result287 = this._parse_eolChar(context);
      context.reportMatchFailures = savedReportMatchFailuresVar7;
      if (result287 === null) {
        var result285 = '';
      } else {
        var result285 = null;
        this._pos = savedPos51;
      }
      if (result285 !== null) {
        if (this._input.length > this._pos) {
          var result286 = this._input[this._pos];
          this._pos++;
        } else {
          var result286 = null;
          if (context.reportMatchFailures) {
            this._matchFailed(new PEG.Parser.AnyMatchFailure());
          }
        }
        if (result286 !== null) {
          var result284 = [result285, result286];
        } else {
          var result284 = null;
          this._pos = savedPos50;
        }
      } else {
        var result284 = null;
        this._pos = savedPos50;
      }
      while (result284 !== null) {
        result283.push(result284);
        var savedPos50 = this._pos;
        var savedPos51 = this._pos;
        var savedReportMatchFailuresVar7 = context.reportMatchFailures;
        context.reportMatchFailures = false;
        var result287 = this._parse_eolChar(context);
        context.reportMatchFailures = savedReportMatchFailuresVar7;
        if (result287 === null) {
          var result285 = '';
        } else {
          var result285 = null;
          this._pos = savedPos51;
        }
        if (result285 !== null) {
          if (this._input.length > this._pos) {
            var result286 = this._input[this._pos];
            this._pos++;
          } else {
            var result286 = null;
            if (context.reportMatchFailures) {
              this._matchFailed(new PEG.Parser.AnyMatchFailure());
            }
          }
          if (result286 !== null) {
            var result284 = [result285, result286];
          } else {
            var result284 = null;
            this._pos = savedPos50;
          }
        } else {
          var result284 = null;
          this._pos = savedPos50;
        }
      }
      if (result283 !== null) {
        var result281 = [result282, result283];
      } else {
        var result281 = null;
        this._pos = savedPos49;
      }
    } else {
      var result281 = null;
      this._pos = savedPos49;
    }
    
    
    
    this._cache["singleLineComment"][pos] = {
      nextPos: this._pos,
      result:  result281
    };
    return result281;
  };
  
  result._parse_multiLineComment = function(context) {
    this._cache["multiLineComment"] = this._cache["multiLineComment"] || [];
    var cachedResult = this._cache["multiLineComment"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    
    var savedPos52 = this._pos;
    if (this._input.substr(this._pos, 2) === "/*") {
      var result289 = "/*";
      this._pos += 2;
    } else {
      var result289 = null;
      if (context.reportMatchFailures) {
        this._matchFailed(new PEG.Parser.LiteralMatchFailure("/*"));
      }
    }
    if (result289 !== null) {
      var result290 = [];
      var savedPos53 = this._pos;
      var savedPos54 = this._pos;
      var savedReportMatchFailuresVar8 = context.reportMatchFailures;
      context.reportMatchFailures = false;
      if (this._input.substr(this._pos, 2) === "*/") {
        var result295 = "*/";
        this._pos += 2;
      } else {
        var result295 = null;
        if (context.reportMatchFailures) {
          this._matchFailed(new PEG.Parser.LiteralMatchFailure("*/"));
        }
      }
      context.reportMatchFailures = savedReportMatchFailuresVar8;
      if (result295 === null) {
        var result293 = '';
      } else {
        var result293 = null;
        this._pos = savedPos54;
      }
      if (result293 !== null) {
        if (this._input.length > this._pos) {
          var result294 = this._input[this._pos];
          this._pos++;
        } else {
          var result294 = null;
          if (context.reportMatchFailures) {
            this._matchFailed(new PEG.Parser.AnyMatchFailure());
          }
        }
        if (result294 !== null) {
          var result292 = [result293, result294];
        } else {
          var result292 = null;
          this._pos = savedPos53;
        }
      } else {
        var result292 = null;
        this._pos = savedPos53;
      }
      while (result292 !== null) {
        result290.push(result292);
        var savedPos53 = this._pos;
        var savedPos54 = this._pos;
        var savedReportMatchFailuresVar8 = context.reportMatchFailures;
        context.reportMatchFailures = false;
        if (this._input.substr(this._pos, 2) === "*/") {
          var result295 = "*/";
          this._pos += 2;
        } else {
          var result295 = null;
          if (context.reportMatchFailures) {
            this._matchFailed(new PEG.Parser.LiteralMatchFailure("*/"));
          }
        }
        context.reportMatchFailures = savedReportMatchFailuresVar8;
        if (result295 === null) {
          var result293 = '';
        } else {
          var result293 = null;
          this._pos = savedPos54;
        }
        if (result293 !== null) {
          if (this._input.length > this._pos) {
            var result294 = this._input[this._pos];
            this._pos++;
          } else {
            var result294 = null;
            if (context.reportMatchFailures) {
              this._matchFailed(new PEG.Parser.AnyMatchFailure());
            }
          }
          if (result294 !== null) {
            var result292 = [result293, result294];
          } else {
            var result292 = null;
            this._pos = savedPos53;
          }
        } else {
          var result292 = null;
          this._pos = savedPos53;
        }
      }
      if (result290 !== null) {
        if (this._input.substr(this._pos, 2) === "*/") {
          var result291 = "*/";
          this._pos += 2;
        } else {
          var result291 = null;
          if (context.reportMatchFailures) {
            this._matchFailed(new PEG.Parser.LiteralMatchFailure("*/"));
          }
        }
        if (result291 !== null) {
          var result288 = [result289, result290, result291];
        } else {
          var result288 = null;
          this._pos = savedPos52;
        }
      } else {
        var result288 = null;
        this._pos = savedPos52;
      }
    } else {
      var result288 = null;
      this._pos = savedPos52;
    }
    
    
    
    this._cache["multiLineComment"][pos] = {
      nextPos: this._pos,
      result:  result288
    };
    return result288;
  };
  
  result._parse_eol = function(context) {
    this._cache["eol"] = this._cache["eol"] || [];
    var cachedResult = this._cache["eol"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    var savedReportMatchFailures = context.reportMatchFailures;
    context.reportMatchFailures = false;
    if (this._input.substr(this._pos, 1) === "\n") {
      var result301 = "\n";
      this._pos += 1;
    } else {
      var result301 = null;
      if (context.reportMatchFailures) {
        this._matchFailed(new PEG.Parser.LiteralMatchFailure("\n"));
      }
    }
    if (result301 !== null) {
      var result296 = result301;
    } else {
      if (this._input.substr(this._pos, 2) === "\r\n") {
        var result300 = "\r\n";
        this._pos += 2;
      } else {
        var result300 = null;
        if (context.reportMatchFailures) {
          this._matchFailed(new PEG.Parser.LiteralMatchFailure("\r\n"));
        }
      }
      if (result300 !== null) {
        var result296 = result300;
      } else {
        if (this._input.substr(this._pos, 1) === "\r") {
          var result299 = "\r";
          this._pos += 1;
        } else {
          var result299 = null;
          if (context.reportMatchFailures) {
            this._matchFailed(new PEG.Parser.LiteralMatchFailure("\r"));
          }
        }
        if (result299 !== null) {
          var result296 = result299;
        } else {
          if (this._input.substr(this._pos, 1) === "\u2028") {
            var result298 = "\u2028";
            this._pos += 1;
          } else {
            var result298 = null;
            if (context.reportMatchFailures) {
              this._matchFailed(new PEG.Parser.LiteralMatchFailure("\u2028"));
            }
          }
          if (result298 !== null) {
            var result296 = result298;
          } else {
            if (this._input.substr(this._pos, 1) === "\u2029") {
              var result297 = "\u2029";
              this._pos += 1;
            } else {
              var result297 = null;
              if (context.reportMatchFailures) {
                this._matchFailed(new PEG.Parser.LiteralMatchFailure("\u2029"));
              }
            }
            if (result297 !== null) {
              var result296 = result297;
            } else {
              var result296 = null;;
            };
          };
        };
      };
    }
    context.reportMatchFailures = savedReportMatchFailures;
    if (context.reportMatchFailures && result296 === null) {
      this._matchFailed(new PEG.Parser.NamedRuleMatchFailure("end of line"));
    }
    
    this._cache["eol"][pos] = {
      nextPos: this._pos,
      result:  result296
    };
    return result296;
  };
  
  result._parse_eolChar = function(context) {
    this._cache["eolChar"] = this._cache["eolChar"] || [];
    var cachedResult = this._cache["eolChar"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    
    if (this._input.substr(this._pos).match(/^[\n\r\u2028\u2029]/) !== null) {
      var result302 = this._input[this._pos];
      this._pos++;
    } else {
      var result302 = null;
      if (context.reportMatchFailures) {
        this._matchFailed(new PEG.Parser.ClassMatchFailure("\\n\\r\\u2028\\u2029"));
      }
    }
    
    
    
    this._cache["eolChar"][pos] = {
      nextPos: this._pos,
      result:  result302
    };
    return result302;
  };
  
  result._parse_whitespace = function(context) {
    this._cache["whitespace"] = this._cache["whitespace"] || [];
    var cachedResult = this._cache["whitespace"][this._pos];
    if (cachedResult !== undefined) {
      this._pos = cachedResult.nextPos;
      return cachedResult.result;
    }
    
    var pos = this._pos;
    
    var savedReportMatchFailures = context.reportMatchFailures;
    context.reportMatchFailures = false;
    if (this._input.substr(this._pos).match(/^[ 	  ᠎ -   　]/) !== null) {
      var result303 = this._input[this._pos];
      this._pos++;
    } else {
      var result303 = null;
      if (context.reportMatchFailures) {
        this._matchFailed(new PEG.Parser.ClassMatchFailure(" 	  ᠎ -   　"));
      }
    }
    context.reportMatchFailures = savedReportMatchFailures;
    if (context.reportMatchFailures && result303 === null) {
      this._matchFailed(new PEG.Parser.NamedRuleMatchFailure("whitespace"));
    }
    
    this._cache["whitespace"][pos] = {
      nextPos: this._pos,
      result:  result303
    };
    return result303;
  };
  
  return result;
})();
