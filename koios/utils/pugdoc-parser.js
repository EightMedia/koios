var pug = require("pug");

var path = require("path");
var YAML = require("js-yaml");
var getCodeBlock = require("pug-code-block");
var detectIndent = require("detect-indent");
var rebaseIndent = require("rebase-indent");
var pugdocArguments = require("./pugdoc-arguments");

var MIXIN_NAME_REGEX = /^mixin +([-\w]+)?/;
var DOC_REGEX = /^\s*\/\/-\s+?\@pugdoc\s*$/;
var DOC_STRING = "//- @pugdoc";
var CAPTURE_ALL = "all";
var CAPTURE_SECTION = "section";
var EXAMPLE_BLOCK = "block";

/**
 * Returns all pugdoc comment and code blocks for the given code
 *
 * @param templateSrc {string}
 * @return {{lineNumber: number, comment: string, code: string}[]}
 */

function extractPugdocBlocks(templateSrc) {
  return (
    templateSrc
      .split("\n")
      // Walk through every line and look for a pugdoc comment
      .map(function (line, lineIndex) {
        // If the line does not contain a pugdoc comment skip it
        if (!line.match(DOC_REGEX)) {
          return undefined;
        }

        // If the line contains a pugdoc comment return
        // the comment block and the next code block
        var comment = getCodeBlock.byLine(templateSrc, lineIndex + 1);
        var meta = parsePugdocComment(comment);

        // add number of captured blocks
        if (meta.capture <= 0) {
          return undefined;
        }

        var capture = 2;
        if (meta.capture) {
          if (meta.capture === CAPTURE_ALL) {
            capture = Infinity;
          } else if (meta.capture === CAPTURE_SECTION) {
            capture = Infinity;
          } else {
            capture = meta.capture + 1;
          }
        }

        // get all code blocks
        var code = getCodeBlock.byLine(templateSrc, lineIndex + 1, capture);

        // make string
        if (Array.isArray(code)) {
          // remove comment
          code.shift();

          // join all code
          code = code.join("\n");
        } else {
          return undefined;
        }

        // filter out all but current pugdoc section
        if (meta.capture === CAPTURE_SECTION) {
          var nextPugDocIndex = code.indexOf(DOC_STRING);
          if (nextPugDocIndex > -1) {
            code = code.substr(0, nextPugDocIndex);
          }
        }

        // if no code and no comment, skip
        if (comment.match(DOC_REGEX) && code === "") {
          return undefined;
        }

        return {
          lineNumber: lineIndex + 1,
          comment: comment,
          code: code
        };
      })
      // Remove skiped lines
      .filter(function (result) {
        return result !== undefined;
      })
  );
}

/**
 * Extract pug attributes from comment block
 */

function parsePugdocComment(comment) {
  // remove first line (@pugdoc)
  if (comment.indexOf("\n") === -1) {
    return {};
  }

  comment = comment.substr(comment.indexOf("\n"));
  comment = pugdocArguments.escapeArgumentsYAML(comment, "arguments");
  comment = pugdocArguments.escapeArgumentsYAML(comment, "attributes");

  // parse YAML
  return YAML.safeLoad(comment) || {};
}

/**
 * get all examples from the meta object
 * either one or both of meta.example and meta.examples can be given
 */

function getExamples(meta) {
  var examples = [];
  if (meta.example) {
    examples = examples.concat(meta.example);
  }
  if (meta.examples) {
    examples = examples.concat(meta.examples);
  }
  return examples;
}

/**
 * Compile Pug
 */

function compilePug(source, meta, filename, locals) {
  var newSrc = [source];

  // add example calls
  getExamples(meta).forEach(function (example, i) {
    // append to pug if it's a mixin example
    if (MIXIN_NAME_REGEX.test(source)) {
      newSrc.push(example);

      // replace example block with source
    } else {
      if (i === 0) {
        newSrc = [];
      }

      var lines = example.split("\n");
      lines.forEach(function (line) {
        if (line.trim() === EXAMPLE_BLOCK) {
          var indent = detectIndent(line).indent.length;
          line = rebaseIndent(source.split("\n"), indent).join("\n");
        }
        newSrc.push(line);
      });
    }
  });

  newSrc = newSrc.join("\n");
  
  const fn = pug.compile(newSrc, { cache: false, filename, compileDebug: true, self: true });
  
  // compile pug
  return fn(Object.assign({}, locals, meta.locals));
}

/**
 * Returns all pugdocDocuments for the given code
 *
 * @param templateSrc {string}
 * @param filename {string}
 */

function getPugdocDocuments(templateSrc, filename, locals) {
  return extractPugdocBlocks(templateSrc).map(function (pugdocBlock) {
    var meta = parsePugdocComment(pugdocBlock.comment);
    var fragments = [];

    // parse jsdoc style arguments list
    if (meta.arguments) {
      meta.arguments = meta.arguments.map(function (arg) {
        return pugdocArguments.parse(arg, true);
      });
    }

    // parse jsdoc style attributes list
    if (meta.attributes) {
      meta.attributes = meta.attributes.map(function (arg) {
        return pugdocArguments.parse(arg, true);
      });
    }

    var source = pugdocBlock.code;
    source = source.replace(/\u2028|\u200B/g, "");

    // get example objects and add them to parent example
    // also return them as separate pugdoc blocks
    if (meta.examples) {
      for (let i = 0, l = meta.examples.length; i < l; ++i) {
        const x = meta.examples[i];

        // do nothing for simple examples
        if (typeof x === "string") {
          continue;
        }

        // merge example/examples with parent examples
        meta.examples[i] = getExamples(x).reduce(
          (acc, val) => acc.concat(val),
          []
        );

        // add fragments
        fragments.push(x);
      }

      meta.examples = meta.examples.reduce((acc, val) => acc.concat(val), []);
    }

    var obj = {
      meta: meta,
      file: path.relative(".", filename),
      source: source,
      output: compilePug(source, meta, filename, locals)
    };

    // add fragments
    if (fragments && fragments.length) {
      obj.fragments = fragments.map(subexample => ({ meta: subexample, output: compilePug(source, subexample, filename, locals) }));
    }

    if (obj.output) {
      return obj;
    }

    return null;
  });
}

// Exports
module.exports = getPugdocDocuments;