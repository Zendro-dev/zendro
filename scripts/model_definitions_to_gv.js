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
 *    argv[1] - set to "printFK" to print the foreignKeys. Everything else won't print the foreign keys.
 *    argv[2] - optional String representation of a desired order in the graph output. By default the order is depending on the folder itself.
 *              for example:
 *              node model_definitions_to_gv path_to_model_folder "model2,model1,model3,..."
 *
 * CONVERT TO PDF
 *  make sure to install graphviz (https://graphviz.org/download/)
 *
 *  dot out.gv -Tpdf -o out.pdf
 *
 */

const fs = require("fs");
const path = require("path");

const argv = process.argv.slice(2);

/**
 * Configuration of the graph
 */
const graphConfig =
  "digraph hierarchy {\n \
node[shape=record,style=filled,fillcolor=gray95, fontname=Courier, fontsize=15]\n \
graph [splines=ortho]\n \
edge[arrowsize=1.5, style=bold]\n \
ranksep=0.5\n \
nodesep=1\n \
esep=0.1\n";

// globals
let associations = {};
let parsedAssociations = [];
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
  if (argv.length < 1) {
    console.error(
      "Please provide the path to your data model definitions folder"
    );
    process.exit(1);
  }
  const printFK = argv[1] === "printFK" ? true : false;

  fs.readdirSync(argv[0])
    .filter(function (file) {
      return (
        file.indexOf(".") !== 0 &&
        file.slice(-5) === ".json" &&
        !file.includes("_to_")
      );
    })
    .forEach(function (file) {
      let json = require(path.relative(__dirname, path.join(argv[0], file)));
      parseModel(json, printFK);
    });

  process.stdout.write(graphConfig);
  createNodes(attributes, printFK);
  createEdges(parsedAssociations);
  process.stdout.write("}");

  // console.log(JSON.stringify(fKattributes,null,2));
}

/**
 * parse the json input of a model and write to the global variables
 * @param {JSON} json the json input for a model definition
 * @param {boolean} printFK
 */
function parseModel(json, printFK) {
  attributes[json["model"]] = {};
  associations[json["model"]] = {};
  fKattributes[json["model"]] = [];

  Object.assign(attributes[json["model"]], json["attributes"]);
  Object.assign(associations[json["model"]], json["associations"]);

  idattributes[json["model"]] = json["internalId"] ? json["internalId"] : "id";
  longestAttribute[json["model"]] = json["model"].length;

  if (!json["internalId"]) {
    attributes[json["model"]].id = "Int";
  }

  if (json["associations"] !== undefined) {
    Object.keys(json["associations"]).forEach((assocName) => {
      let association = json["associations"][assocName];

      if (association["keysIn"] === json["model"]) {
        if (
          association["type"] === "many_to_many" &&
          association["implementation"] === "foreignkeys"
        ) {
          fKattributes[json["model"]].push(association["sourceKey"]);
        } else {
          fKattributes[json["model"]].push(association["targetKey"]);
        }
      }
      if (
        parsedAssociations.find(
          (assoc) =>
            association.reverseAssociation === assoc.name &&
            association.target === assoc.model
        )
      ) {
        return;
      } else {
        parsedAssociations.push({
          model: json["model"],
          name: assocName,
          target: association["target"],
          type: association["type"],
        });
      }
    });
  }

  Object.keys(attributes[json["model"]]).forEach((attr) => {
    const validAttr = printFK
      ? true
      : !fKattributes[json["model"]].includes(attr);
    if (
      validAttr &&
      attr.length + attributes[json["model"]][attr].length >
        longestAttribute[json["model"]]
    ) {
      longestAttribute[json["model"]] =
        attr.length + attributes[json["model"]][attr].length;
    }
  });
}

/**
 * create the .gv Nodes for the output graph
 * @param {object} attributes
 * @param {boolean} printFK
 */
function createNodes(attributes, printFK) {
  const order = argv[2]
    ? argv[2].split(",").reduce((a, c) => ((a[c] = ""), a), {})
    : attributes;
  Object.keys(order).forEach((model) => {
    let sortedAttributes = [idattributes[model]];
    process.stdout.write(
      ` ${model} [label = < {<B>${model[0].toUpperCase()}${model.slice(1)}</B>|`
    );

    Object.keys(attributes[model]).forEach((attr) => {
      if (idattributes[model] !== attr && !fKattributes[model].includes(attr)) {
        sortedAttributes.push(attr);
      }
    });

    sortedAttributes.forEach((attr) => {
      const typeLength = attributes[model][attr].length;
      let spaces = calculateSpaces(
        attr.length + typeLength,
        longestAttribute[model]
      );

      if (idattributes[model] === attr) {
        process.stdout.write(`<font color="red">${attr}`);
        process.stdout.write(`${" ".repeat(spaces)}`);
        process.stdout.write(
          `<i>${attributes[model][attr]}</i></font><br ALIGN="LEFT"/>`
        );
      } else {
        process.stdout.write(`${attr}`);
        process.stdout.write(`${" ".repeat(spaces)}`);
        process.stdout.write(
          `<i>${attributes[model][attr]}</i><br ALIGN="LEFT"/>`
        );
      }
    });

    if (printFK) {
      fKattributes[model].forEach((fK) => {
        let spaces = calculateSpaces(
          fK.length + attributes[model][fK].length,
          longestAttribute[model]
        );

        process.stdout.write(`<font color="darkgreen">${fK}`);
        process.stdout.write(`${" ".repeat(spaces)}`);
        process.stdout.write(
          `<i>${attributes[model][fK]}</i></font><br ALIGN="LEFT"/>`
        );
      });
    }
    process.stdout.write(`}>]\n`);
  });
}

/**
 * create the .gv edges for the output graph
 * @param {object} associations
 */
function createEdges(parsedAssociations) {
  parsedAssociations.forEach((assoc) => {
    const relation = translateRelation(assoc);
    process.stdout.write(
      `  ${assoc.model} -> ${assoc.target} [minlen=2 color=navy headlabel=${relation[1]} taillabel=${relation[0]} labeldistance=2 arrowhead=none lp=5]\n`
      // `  ${assoc.model} -> ${assoc.target} [dir=both minlen=2 color=navy arrowhead=${relation[1]} arrowtail=${relation[0]}]\n`
    );
  });
}

function translateRelation(relation) {
  switch (relation.type) {
    case "one_to_one":
      return ["1", "1"];
    case "one_to_many":
      return ["1", "n"];
    case "many_to_one":
      return ["n", "1"];
    case "many_to_many":
      return ["n", "m"];
    default:
      break;
  }
}

function translateRelation2(relation) {
  switch (relation.type) {
    case "one_to_one":
      return ["dot", "dot"];
    case "one_to_many":
      return ["dot", "inv"];
    case "many_to_one":
      return ["inv", "dot"];
    case "many_to_many":
      return ["inv", "inv"];
    default:
      break;
  }
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
