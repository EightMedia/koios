const pug = require("pug");

const path = require("path");
const YAML = require("js-yaml");
const getCodeBlock = require("pug-code-block");
const detectIndent = require("detect-indent");
const rebaseIndent = require("rebase-indent");
const pugdocArguments = require("./pugdoc-arguments");

const MIXIN_NAME_REGEX = /^mixin +([-\w]+)?/;
const EXTENDS_REGEX = /^extends +([-\w]+)?/;
const DOC_REGEX = /^\s*\/\/-\s+?\@pugdoc\s*$/;
const DOC_STRING = "//- @pugdoc";
const CAPTURE_ALL = "all";
const CAPTURE_SECTION = "section";
const EXAMPLE_BLOCK = "block";

/**
 * Returns all pugdoc comment and code blocks for the given code
 *
 * @param templateSrc {string}
 * @return {{lineNumber: number, comment: string, code: string}[]}
 */

function extractPugdocBlocks(templateSrc) {
  const lines = templateSrc.split("\n");
  const blocks = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    if (!DOC_REGEX.test(line)) continue;

    // if the line contains a pugdoc comment return
    // the comment block and the next code block
    const comment = getCodeBlock.byLine(templateSrc, lineIndex + 1);
    const meta = Object.assign({ 
      capture: CAPTURE_SECTION,
      examples: [],
    }, parsePugdocComment(comment));
    
    // move single example to examples array
    meta.example && meta.examples.push(meta.example) && delete meta.example;

    // skip if capture is 0 or below
    if (meta.capture <= 0) continue;

    let capture = Number.isInteger(meta.capture) ? meta.capture + 1 : Infinity;
    
    // get all code blocks
    let code = getCodeBlock.byLine(templateSrc, lineIndex + 1, capture);

    // skip if no array of code is returned
    if (!Array.isArray(code)) continue;

    // join all blocks into one string
    code = code.join("\n").substr(comment.length);

    // filter out all but current pugdoc section
    if (meta.capture === CAPTURE_SECTION) {
      const nextPugDocIndex = code.indexOf(DOC_STRING);
      if (nextPugDocIndex > -1) code = code.substr(0, nextPugDocIndex);
    }

    // if no code and no comment, skip
    if (comment.match(DOC_REGEX) && code === "") continue;

    // add to blocks array
    blocks.push({ lineNumber: lineIndex + 1, meta, code });
  }
  
  return blocks;
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
  return YAML.load(comment) || {};
}

/**
 * Compile Pug
 */

function compilePug(source, example, filename) {
  let code = "";
  const lines = example.split("\n");

  if (EXTENDS_REGEX.test(lines[0])) {
    code = `${lines.shift()}\n`;
  }

  if (MIXIN_NAME_REGEX.test(source)) {
    code = `${code}${source}\n${lines.join("\n")}`;
  } else {
    lines.forEach(function (line) {
      if (line.trim() === EXAMPLE_BLOCK) {
        const indent = detectIndent(line).indent.length;
        line = rebaseIndent(source.split("\n"), indent).join("\n");
      }
      code = `${code}\n${line}`;
    });
  }

  return pug.compile(code, { cache: false, filename, compileDebug: true, self: true });
}

/**
 * Returns all pugdocDocuments for the given code
 *
 * @param templateSrc {string}
 * @param filename {string}
 */

function getPugdocDocuments(templateSrc, filename, locals) {
  return extractPugdocBlocks(templateSrc).map(function (block) {
    const meta = block.meta;
    const source = block.code.replace(/^\s*$(?:\r\n?|\n)/gm, "");
    const fragments = [];

    // parse jsdoc style arguments list
    meta.arguments = meta.arguments && meta.arguments.map(function (arg) {
      return pugdocArguments.parse(arg, true);
    });
    
    // parse jsdoc style attributes list
    meta.attributes = meta.attributes && meta.attributes.map(function (arg) {
      return pugdocArguments.parse(arg, true);
    });

    // process examples
    meta.examples.forEach(fragment => {
      if (typeof fragment === "string") {
        fragment = { name: meta.name, example: fragment };
      }
      
      meta.beforeEach && (fragment.example = `${meta.beforeEach}\n${fragment.example}`);
      meta.afterEach && (fragment.example = `${fragment.example}\n${meta.afterEach}`);

      // add fragment
      fragments.push({
        meta: fragment,
        output: compilePug(source, fragment.example, filename)({ ...locals, ...meta.locals })
      });
    });

    return {
      meta, fragments, file: path.relative(".", filename)
    };
  });
}


// Exports
module.exports = getPugdocDocuments;