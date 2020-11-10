/**
 * -----------------------------------------------------------------------
 * model_definitions_to_gv.js
 * 
 * DESCRIPTION
 *  utility node script to create a dot readable graphviz (.gv) file, representing a graph visual representation of models found in a data model definitions folder.
 *  The .gv output will be written to STDOUT
 * 
 * USAGE
 *  node model_definitions_to_gv path_to_model_folder > out.gv
 * 
 *  ARGUMENTS
 *    argv[0] - path to folder
 *    argv[1] - optional String representation of a desired order in the graph output. By default the order is depending on the folder itself.
 *              for example:
 *              node model_definitions_to_gv path_to_model_folder "model2,model1,model3,..."
 * 
 * CONVERT TO PDF
 *  make sure to install graphviz (https://graphviz.org/download/)
 * 
 *  dot out.gv -Tpdf -o out.pdf
 * 
 */

const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);

/**
 * Configuration of the graph
 */
const graphConfig = "digraph hierarchy {\n \
node[shape=record,style=filled,fillcolor=gray95, fontname=Courier, fontsize=15]\n \
graph [splines=ortho]\n \
edge[arrowsize=1.5, style=bold]\n \
ranksep=0.5\n \
nodesep=1\n \
esep=1\n";

// globals
let associations = {};
let attributes = {};
let fKattributes = {};
let idattributes = {};
let longestAttribute = {};

/**
 * run
 * 
 * main function
 */
function run() {

  if(argv.length < 1) {
    console.error('Please provide the path to your data model definitions folder');
    process.exit(1);
  }

  fs.readdirSync(argv[0])
    .filter(function (file) {
      return (file.indexOf('.') !== 0) && (file.slice(-5) === '.json') && !file.includes('_to_');
    })
    .forEach(function (file) {
      let json = require(path.relative(__dirname, path.join(argv[0], file)));
      parseModel(json);
    });
  process.stdout.write(graphConfig);
  createNodes(attributes);
  createEdges(associations);
  process.stdout.write('}')
}

/**
 * parse the json input of a model and write to the global variables
 * @param {JSON} json the json input for a model definition
 */
function parseModel(json) {
  attributes[json['model']] = {};
  associations[json['model']] = {};
  fKattributes[json['model']] = [];

  Object.assign(attributes[json['model']], json['attributes']);
  Object.assign(associations[json['model']], json['associations']);

  idattributes[json['model']] = json['internalId'] ? json['internalId'] : 'id';
  longestAttribute[json['model']] = 0;
  Object.keys(attributes[json['model']]).forEach(attr => {
    if (attr.length + attributes[json['model']][attr].length > longestAttribute[json['model']]) {
      longestAttribute[json['model']] = attr.length + attributes[json['model']][attr].length;
    }
  })
  if (json['associations'] !== undefined) {
    Object.keys(json['associations']).forEach(assocName => {
      let assoc = json['associations'][assocName];
      if (assoc['keyIn'] === json['model']) {
        if (assoc['reverseAssociationType'] === 'to_many') {
          fKattributes[json['model']].push(assoc['sourceKey']);
        } else {
          fKattributes[json['model']].push(assoc['targetKey']);
        }
      }
    });
  }
}

/**
 * create the .gv Nodes for the output graph
 * @param {object} attributes 
 */
function createNodes(attributes) {
  const order = argv[1] ? argv[1].split(',').reduce((a,c) => (a[c] = '', a), {}) : attributes;
  Object.keys(order).forEach(model => {
    let sortedAttributes = [idattributes[model]];
    process.stdout.write(` ${model} [label = < {<B>${model[0].toUpperCase()}${model.slice(1)}</B>|`);

    Object.keys(attributes[model]).forEach(attr => {
      if (idattributes[model] !== attr && !fKattributes[model].includes(attr)) {
        sortedAttributes.push(attr);
      }
    });

    sortedAttributes.forEach(attr => {
      let spaces = calculateSpaces(attr.length + attributes[model][attr].length, longestAttribute[model]);

      if (idattributes[model] === attr) {
        process.stdout.write(`<font color="red">${attr}`);
        process.stdout.write(`${" ".repeat(spaces)}`);
        process.stdout.write(`<i>${attributes[model][attr]}</i></font><br ALIGN="LEFT"/>`)
      } else {
        process.stdout.write(`${attr}`);
        process.stdout.write(`${" ".repeat(spaces)}`);
        process.stdout.write(`<i>${attributes[model][attr]}</i><br ALIGN="LEFT"/>`)
      }

    });

    fKattributes[model].forEach(fK => {
      let spaces = calculateSpaces(fK.length + attributes[model][fK].length, longestAttribute[model]);

      process.stdout.write(`<font color="darkgreen">${fK}`);
      process.stdout.write(`${" ".repeat(spaces)}`);
      process.stdout.write(`<i>${attributes[model][fK]}</i></font><br ALIGN="LEFT"/>`);
    })
    process.stdout.write(`}>]\n`);

  });
}

/**
 * create the .gv edges for the output graph
 * @param {object} associations 
 */
function createEdges(associations) {
  Object.keys(associations).forEach(model => {
    Object.keys(associations[model]).forEach(assoc => {
      process.stdout.write(`  ${model} -> ${associations[model][assoc]['target']}`);
      if (associations[model][assoc]['type'] === 'to_one') {
        process.stdout.write(`[color=navy]`);
      } else {
        process.stdout.write(`[color=crimson]`)
      }
      process.stdout.write('\n');
    })
  })
}

/**
 * calculate the number of spaces needed for each attribute + type to be lined up correctly in the graph
 * @param {int} length 
 * @param {int} maxLength 
 */
function calculateSpaces(length, maxLength) {
  let longestSpace = maxLength + 4;
  return longestSpace - length;
}

run();