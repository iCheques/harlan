var squel = require('squel');

var sprintf = require('sprintf');
var changeCase = require('change-case');
var _ = require('underscore');
var CPF = require('cpf_cnpj').CPF;
var CNPJ = require('cpf_cnpj').CNPJ;
var StringMask = require('string-mask');

import { CMC7Parser } from './cmc7-parser';
import { CMC7Validator } from './cmc7-validator';

var CMC7_MASK = new StringMask('00000000 0000000000 000000000000');

module.exports = controller => {

    controller.registerTrigger('find::database::instant::search', 'icheques::search::document', (args, callback) => {
        var expr = squel.expr();
        var format;

        if (CPF.isValid(args[0])) {
            expr.or('CPF = ?', CPF.strip(args[0]));
            expr.or('CPF = ?', format = CPF.format(args[0]));
        } else if (CNPJ.isValid(args[0])) {
            expr.or('CNPJ = ?', CNPJ.strip(args[0]));
            expr.or('CNPJ = ?', format = CNPJ.format(args[0]));
        } else {
            callback();
            return;
        }

        var query = squel.select().from('ICHEQUES_CHECKS').where(expr).toString();
        var databaseResult = controller.call('icheques::result::database', controller.database.exec(query)[0]);

        if (!databaseResult.values || !databaseResult.values.length) {
            callback();
            return;
        }

        args[1].item('iCheques', 'Relatório Geral de Cheques', sprintf('Documento: %s', format))
            .addClass('icheque')
            .click(e => {
                e.preventDefault();
                controller.call('icheques::show', databaseResult.values, null, null, true);
            });

        callback();
    });

    controller.registerCall('icheques::result::click', result => e => {
        e.preventDefault();
        controller.call('icheques::show', [result], null, null, true);
    });

    controller.registerTrigger('find::database::instant::search', 'icheques::search::cmc7', (args, callback) => {
        let [search, autocomplete] = args;
        callback();

        if (!new CMC7Validator(search).isValid()) return;

        autocomplete.item('iCheques', 'Pesquisa Geral de Cheques', sprintf('Número: %s Cheque: %s', new CMC7Parser(search).number, CMC7_MASK.apply(search)))
            .addClass('icheque')
            .click((e) => {
                e.preventDefault();
                controller.serverCommunication.call('SELECT FROM \'ICHEQUES\'.\'CHECK\'', controller.call('error::ajax', {
                    data: search,
                    success: (ret) => {
                        controller.call('icheques::show', controller.call('icheques::parse::element', $(ret).find('check').get(0)));
                    }
                }));
            });
    });

    controller.registerTrigger('find::database::instant::search', 'icheques::search', (args, callback) => {
        var searchString = sprintf('%s%%', args[0]);

        var query = squel.select()
            .from('ICHEQUES_CHECKS')
            .order('EXPIRE', false)
            .limit(3)
            .where(squel.expr()
                .or('CPF LIKE ?', searchString)
                .or('CMC LIKE ?', sprintf('%%%s%%', searchString))
                .or('CNPJ LIKE ?', searchString)
                .or(squel.expr()
                    .and('OBSERVATION IS NOT NULL')
                    .and('OBSERVATION != \'\'')
                    .and('OBSERVATION LIKE ?', sprintf('%%%s%%', args[0]))
                )).toString();

        var databaseResult = controller.call('icheques::result::database', controller.database.exec(query)[0]);

        for (var i in databaseResult.values) {
            args[1].item('iCheques', 'Relatório Geral de Cheques',
                sprintf('Documento: %s Cheque: %s', databaseResult.values[i].cpf || databaseResult.values[i].cnpj,
                    CMC7_MASK.apply(databaseResult.values[i].cmc)))
                .addClass('icheque')
                .click(controller.call('icheques::result::click', databaseResult.values[i]));
        }

        callback();
    });

};
