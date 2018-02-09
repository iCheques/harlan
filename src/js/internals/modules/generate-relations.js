import timesSeries from 'async/times';
import parallel from 'async/parallel';
import eachLimit from 'async/eachLimit';
import _ from 'underscore';
import {
    CPF,
    CNPJ
} from 'cpf_cnpj';

const START_ZERO = /^0+/;
let wrap = require('wordwrap')(20);

let groups = {
    company: {
        shape: 'icon',
        icon: {
            face: 'FontAwesome',
            code: '\uf1ad',
            size: 30,
            color: '#57169a'
        }
    },
    user: {
        shape: 'icon',
        icon: {
            face: 'FontAwesome',
            code: '\uf007',
            size: 30,
            color: '#aa00ff'
        }
    }
};

module.exports = controller => {

    /* Adaptadores para Compreensão Documental */
    let readAdapters = {
        'RFBCNPJANDROID.CERTIDAO' : {
            trackNodes: (relation, legalDocument, document) => callback => {
                let mainNode = relation.createNode($('nome', document).first().text(), CNPJ.format($('RFB > incricao', document).first().text()), 'user', {
                    unlabel: true
                });

                let response = callback(null, $('RFB > socios > socio', document).map((idx, node) => {
                    let label = $(node).text();
                    return relation.createNode(relation.labelIdentification(label), label, 'user', {
                        unlabel: true
                    });
                }).toArray().concat([mainNode]));
                return response;
            },
            trackEdges: (relation, legalDocument, document) => callback => {
                let inscricao = CNPJ.format($('RFB > incricao', document).first().text());
                let mainNode = relation.createEdge(legalDocument, inscricao);
                return callback(null, $('RFB > socios > socio', document).map((idx, node) => relation.createEdge(inscricao, relation.labelIdentification($(node).text()), 'societária')).toArray().concat(mainNode));
            },
            purchaseNewDocuments: (relation, legalDocument, document) => callback => callback()
        },
        'RECUPERA.LOCALIZADORPJFILIAIS' : {
            trackNodes: (relation, legalDocument, document) => callback => callback(null, $('PESSOA', document).map((idx, node) => relation.createNode($('CNPJ', node).text(), $('RAZAO', node).text(), 'user', {
                unlabel: true
            })).toArray()),
            trackEdges: (relation, legalDocument, document) => callback => callback(null, $('PESSOA', document).map((idx, node) => relation.createEdge(legalDocument, $('CNPJ', node).text(), 'societária')).toArray()),
            purchaseNewDocuments: (relation, legalDocument, document) => callback => callback()
        },
        'RECUPERA.LOCALIZADORPARTEMPRESARIALPJ' : {
            trackNodes: (relation, legalDocument, document) => callback => callback(null, $('PESSOA', document).map((idx, node) => relation.createNode($('CPF', node).text(), $('nome', node).text(), 'user', {
                unlabel: true
            })).toArray()),
            trackEdges: (relation, legalDocument, document) => callback => callback(null, $('PESSOA', document).map((idx, node) => relation.createEdge(legalDocument, $('CPF', node).text(), 'societária')).toArray()),
            purchaseNewDocuments: (relation, legalDocument, document) => callback => callback()
        },
        'JUCESP.DOCUMENT': {
            trackNodes: (relation, legalDocument, document) => callback => {
                let nodes = [];
                let cpfList = _.uniq($('text', document)
                    .text()
                    .match(/[\d]{3}(\.)?[\d]{3}(\.)?[\d]{3}(\-)?\d{2}?/g)
                    .map(e => e.replace(/[^\d]/g, '')))
                    .filter(c => CPF.isValid(c))
                    .filter(c => CPF.strip(c) !== '37554311816');

                eachLimit(cpfList, 2, (cpf_cnpj, cb) => {
                    controller.server.call('SELECT FROM \'BIPBOPJS\'.\'CPFCNPJ\'', {
                        data: {
                            documento: cpf_cnpj
                        },
                        error : () => nodes.push(relation.createNode(cpf_cnpj, CPF.format(cpf_cnpj), 'user', {
                            unlabel: true
                        })),
                        success: data => nodes.push(relation.createNode(cpf_cnpj, $('nome', data).text(), 'user', {
                            unlabel: true
                        })),
                        complete: () => cb()
                    });
                }, () => {
                    callback(null, nodes);
                });
            },
            trackEdges: (relation, legalDocument, document) => callback => {
                let cpfList = _.uniq($('text', document)
                    .text()
                    .match(/[\d]{3}(\.)?[\d]{3}(\.)?[\d]{3}(\-)?\d{2}?/g).map(e => e.replace(/[^\d]/g, '')))
                    .filter(c => CPF.isValid(c))
                    .filter(c => CPF.strip(c) !== '37554311816');
                let nodes = cpfList.map(document => relation.createEdge(legalDocument, document, 'societária'));
                return callback(null, nodes);
            },
            purchaseNewDocuments: (relation, legalDocument, document) => callback => callback()
        },
        'CBUSCA.CONSULTA': {
            trackNodes: (relation, legalDocument, document) => callback => callback(null, $('socios > socio', document).map((idx, node) => relation.createNode($(node).text(), $(node).attr('nome'), 'user', {
                unlabel: true
            })).toArray()),
            trackEdges: (relation, legalDocument, document) => callback => callback(null, $('socios > socio', document).map((idx, node) => relation.createEdge(legalDocument, $(node).text(), 'societária')).toArray()),
            purchaseNewDocuments: (relation, legalDocument, document) => callback => callback()
        },
        'FINDER.RELATIONS': {
            trackNodes: (relation, legalDocument, document) => callback => {
                let response = callback(null, $('localizePessoasRelacionadas > localizePessoasRelacionadas', document).map((idx, node) => {
                    if (/^6/.test($('grupo', node).text())) return;
                    let document = $('documento', node).text();
                    return relation.createNode(document, $('nome', node).text(), CPF.isValid(document) ? 'user' : 'company', {
                        unlabel: true
                    });
                }).toArray());
                return response;
            },
            trackEdges: (relation, legalDocument, document) => callback => {
                let response = callback(null, $('localizePessoasRelacionadas > localizePessoasRelacionadas', document).map((idx, node) => {
                    if (/^6/.test($('grupo', node).text())) return;
                    return relation.createEdge(legalDocument, $('documento', node).text(), $('relacao', node).text());
                }).toArray());
                return response;
            },
            purchaseNewDocuments: (relation, legalDocument, document) => callback => callback()
        },
        'RFB.CERTIDAO': {
            trackNodes: (relation, legalDocument, document) => callback => {
                let response = callback(null, $('RFB > socios > socio', document).map((idx, node) => {
                    let label = $(node).text();
                    return relation.createNode(relation.labelIdentification(label), label, 'user', {
                        unlabel: true
                    });
                }).toArray());
                return response;
            },
            trackEdges: (relation, legalDocument, document) => callback => callback(null, $('RFB > socios > socio', document).map((idx, node) => relation.createEdge(legalDocument, relation.labelIdentification($(node).text()), 'Societária')).toArray()),
            purchaseNewDocuments: (relation, legalDocument, document) => callback => callback()
        },
        'CCBUSCA.CONSULTA': {
            trackNodes: (relation, legalDocument, document) => callback => {
                let nodes = $('parsocietaria empresa', document).map((idx, node) => relation.createNode($('cnpj', node).text(), $('nome', node).first().text(), 'company', {
                    unlabel: true
                })).toArray();

                nodes = nodes.concat($('qsa socio', document).map((idx, node) => relation.createNode($('doc', node).text(), $('nome', node).first().text(), 'user', {
                    unlabel: true
                })).toArray());

                nodes.push(relation.createNode(
                    $('cadastro cpf', document).first().text(),
                    $('cadastro nome', document).first().text(),
                    'user', {
                        unlabel: true
                    }));

                return callback(null, nodes);
            },
            trackEdges: (relation, legalDocument, document) => callback => {

                let nodes = $('parsocietaria empresa', document).map((idx, node) => relation.createEdge($('cadastro cpf', document).first().text(), $('cnpj', node).first().text())).toArray();

                nodes = nodes.concat($('qsa socio', document).map((idx, node) => relation.createEdge($('cadastro cpf', document).first().text(), $('doc', node).first().text())).toArray());

                return callback(null, nodes);
            },
            purchaseNewDocuments: (relation, legalDocument, document) => callback => callback()
        }
    };

    let GenerateRelations = function() {

        /* Documents */
        let documents = {};
        let labelIdentification = {};

        this.createEdge = (vfrom, vto, relationType = 'societária') => ({
            from: vfrom.replace(START_ZERO, ''),
            to: vto.replace(START_ZERO, ''),
            relationType: relationType.toLowerCase(),
            title: relationType
        });

        this.createNode = (id, label, group, data = {}) => {
            labelIdentification[label] = id;
            return Object.assign({
                id: id.replace(START_ZERO, ''),
                label: wrap(label),
                group,
            }, data);
        };

        this.labelIdentification = label => labelIdentification[label] || label;

        /* Append Document */
        this.appendDocument = (document, legalDocument) => {
            let query = $('BPQL > header > query', document).first();
            let key = `${query.attr('database')}.${query.attr('table')}`.toUpperCase();

            documents[key] = documents[key] || {};
            documents[key][legalDocument] = documents[key][legalDocument] || [];

            documents[key][legalDocument].push(document);
        };

        let executeAdapter = (method, callback) => {
            let jobs = [];
            for (let documentType in documents) {
                if (!readAdapters[documentType] || !readAdapters[documentType][method]) {
                    continue;
                }

                for (let legalDocument in documents[documentType]) {
                    for (let document of documents[documentType][legalDocument]) {
                        jobs.push(readAdapters[documentType][method](this, legalDocument, document));
                    }
                }
            }
            return parallel(jobs, callback);
        };

        this.trackNodes = callback => executeAdapter('trackNodes', callback);

        this.trackEdges = callback => executeAdapter('trackEdges', callback);

        this.purchaseNewDocuments = callback => executeAdapter('purchaseNewDocuments', callback);

        this.track = (callback, depth = 3) => timesSeries(depth, (i, callback) => {
            this.trackNodes((err, nodes) => {
                this.trackEdges((err, edges) => {
                    this.purchaseNewDocuments((err, documents) => {
                        callback(null, {
                            iteraction: i,
                            nodes,
                            edges
                        });
                    });
                });
            });
        }, (err, results) => {
            let allNodes = _.uniq(_.flatten(_.pluck(results, 'nodes')), false, ({id}) => id);
            let unlabers = _.pluck(_.filter(allNodes, ({unlabel}) => unlabel), 'label');
            let nodes = _.filter(allNodes, ({id}) => !unlabers.includes(id));

            let edges = _.uniq(_.map(_.flatten(_.pluck(results, 'edges')), edge => {
                for (let i of ['to', 'from']) {
                    if (unlabers.includes(edge[i])) {
                        let result = _.findWhere(nodes, {
                            label: edge[i]
                        });
                        if (result) edge[i] = result.id;
                    }
                }
                return edge;
            }), false, ({from, to}) => {
                let t = from >= to,
                    a = t ? from : to,
                    b = !t ? from : to;

                return `${b}:${a}`;
            });

            callback({
                edges,
                nodes,
                groups
            });
        });
    };

    controller.registerCall('generate::relations', () => new GenerateRelations());

    controller.registerCall('generate::relations::create::adapter', (adapterName, adapter, group = null) => {
        readAdapters[adapterName] = adapter;
        if (group) {
            Object.assign(groups, group);
        }
    });

};
