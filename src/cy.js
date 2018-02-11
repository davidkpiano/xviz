import cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';

cytoscape.use(coseBilkent);

export function render(nodes, edges) {
  return cytoscape({
    container: document.querySelector('#cy'),

    boxSelectionEnabled: true,
    autounselectify: true,

    style: [
      {
        selector: `core`,
        style: {
          'active-bg-color': 'blue',
          'selection-box-color': 'blue'
        }
      },
      {
        selector: 'node',
        style: {
          'background-color': 'white'
        }
      },
      {
        selector: `node[label != '$initial']`,
        style: {
          content: ele => {
            return ele.data('label');
          },
          'text-wrap': 'wrap',
          'text-valign': 'top',
          'text-halign': 'center',
          'font-size': '8px',
          'font-family': 'Helvetica Neue',
          'font-weight': 'bold',
          shape: 'roundrectangle',
          width: 'label',
          height: 'label',
          'padding-left': '5px',
          'padding-right': '5px',
          'padding-top': '5px',
          'padding-bottom': '5px',
          'border-width': '1px',
          'border-color': 'black'
        }
      },
      {
        selector: `node[?parallel]`,
        style: {
          'border-style': 'dashed'
        }
      },
      {
        selector: `node:active`,
        style: {
          'overlay-color': 'black',
          'overlay-padding': '0',
          'overlay-opacity': '0.1'
        }
      },
      {
        selector: `node[?initial]`,
        style: {
          content: '',
          width: '5px',
          height: '5px',
          'padding-left': 0,
          'padding-right': 0,
          'padding-top': 0,
          'padding-bottom': 0,
          shape: 'ellipse',
          'background-color': 'black'
        }
      },
      {
        selector: `$node > node`,
        style: {
          'padding-top': '1px',
          'padding-left': '10px',
          'padding-bottom': '10px',
          'padding-right': '10px',
          'border-width': '1px',
          'border-color': 'black'
        }
      },
      {
        selector: 'node:childless',
        style: {
          'text-valign': 'center',
          'text-halign': 'center'
        }
      },
      {
        selector: `edge`,
        style: {
          'curve-style': 'bezier',
          width: '1px',
          'target-arrow-shape': 'triangle',
          label: 'data(label)',
          'font-size': '5px',
          'font-weight': 'bold',
          'text-background-color': '#fff',
          'text-background-padding': '3px',
          'line-color': 'black',
          'target-arrow-color': 'black',
          'z-index': '100',
          'text-wrap': 'wrap',
          'text-background-color': 'white',
          'text-background-opacity': '1',
          'target-distance-from-node': '2px'
        }
      },
      {
        selector: `edge.initial`,
        style: {
          'source-arrow-shape': 'circle',
          'source-arrow-color': 'black'
        }
      },
      {
        selector: 'node.actions',
        style: {
          'border-width': 0,
          padding: 0,
          'compound-sizing-wrt-labels': 'include'
        }
      },
      {
        selector: 'node.action',
        style: {
          label: 'data(label)',
          'text-valign': 'center',
          'text-halign': 'right',
          shape: 'rectangle',
          'padding-left': 0,
          'padding-right': 0,
          'padding-top': 0,
          'padding-bottom': 0,
          'border-width': 0,
          'text-margin-x': node => node.boundingBox({ includeLabels: false }).w * -1,
          'font-weight': 'normal'
        }
      }
      // {
      //   selector: 'node.action.entry',
      //   style: { color: 'green' }
      // },
      // {
      //   selector: 'node.action.exit',
      //   style: { color: 'red' }
      // }
    ],

    elements: {
      nodes,
      edges
    },

    layout: {
      name: 'cose-bilkent',
      randomize: true,
      idealEdgeLength: 50,
      nodeRepulsion: 0,
      animate: false,
      tile: true,
      tilingPaddingVertical: 10,
      tilingPaddingHorizontal: 10,
      nodeDimensionsIncludeLabels: true
    }
  });
}
