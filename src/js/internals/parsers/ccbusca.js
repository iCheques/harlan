import _ from 'underscore';
import {
    CPF,
    CNPJ
} from 'cpf_cnpj';
import pad from 'pad';

module.exports = controller => {

    const tags = (controller.confs.user || {}).tags || [];

    function addressIsEmpty(nodes) {
        for (let idx in nodes) {
            if (!/^\**$/.test(nodes[idx])) {
                return false;
            }
        }
        return true;
    }

    function addressIsComplete(nodes) {
        for (let idx in nodes) {
            if (/^\**$/.test(nodes[idx])) {
                return false;
            }
        }
        return true;
    }

    const removeDuplicatesComplements = (enderecos) => {
        const enderecosTratados = enderecos.map(endereco => {
            if (!Array.isArray(endereco['Complemento'])) return endereco;
            const complementos = _.unique(endereco.Complemento.map(c => ({
                original: c,
                parsed: _.sortBy(c.replace(/[^0-9\s]/g, '').trim().replace(/\s\s+/g, ' ').split(' '))
            })), _.isEqual).map(complemento => complemento.original);
            endereco['Complemento'] = complementos.join(' / ');
            return endereco;
        });

        return enderecosTratados;
    };

    const setAddressNew = (result, jdocument) => {
        const enderecos = [];
        const nodes = {
            Tipo: 'tipoLogradouro',
            Endereço: 'logradouro',
            Número: 'numero',
            Complemento: 'complemento',
            CEP: 'cep',
            Bairro: 'bairro',
            Cidade: ['cidade', 'municipio'],
            Estado: ['estado', 'uf']
        };
        _.each(jdocument.find('BPQL > body enderecos > enderecos'), endereco => {
            const $endereco = $(endereco);
            const enderecoObj = {};
            Object.keys(nodes).forEach(node => {
                if (Array.isArray(nodes[node])) {
                    enderecoObj[node] = nodes[node].map(opcao => $endereco.find(`${opcao}`).text()).filter(op => op)[0];
                } else{
                    enderecoObj[node] = $endereco.find(`${nodes[node]}`).text();
                }

            });

            enderecos.push(enderecoObj);
        });

        _.each(jdocument.find('BPQL > body enderecos > endereco'), endereco => {
            const $endereco = $(endereco);
            const enderecoObj = {};
            Object.keys(nodes).forEach(node => {
                if (Array.isArray(nodes[node])) {
                    enderecoObj[node] = nodes[node].map(opcao => $endereco.find(`${opcao}`).text()).filter(op => op)[0];
                } else{
                    enderecoObj[node] = $endereco.find(`${nodes[node]}`).text();
                }

            });

            enderecos.push(enderecoObj);
        });

        if (!enderecos.length) {
            result.addSeparator('Endereço', 'Localização', 'Endereçamento e mapa');
            result.addItem('Informação', 'Não foi encontrado endereços para o documento consultado.');
            return;
        }

        const enderecosAgrupados = _.groupBy(enderecos, (value) => value['Número'] + '#' + value.Cidade);

        const enderecosTratados = removeDuplicatesComplements(_.map(enderecosAgrupados, (group) => ({
            Tipo: group[0]['Tipo'],
            Endereço: group[0]['Endereço'],
            Número: group[0]['Número'],
            Complemento: _.pluck(group, 'Complemento'),
            CEP: group[0]['CEP'],
            Bairro: group[0]['Bairro'],
            Cidade: group[0]['Cidade'],
            Estado: group[0]['Estado']
        })));

        result.addSeparator('Endereço', 'Localização', 'Endereçamento e mapa');
        enderecosTratados.forEach(endereco => {
            const address = [];
            let removePadding = false;
            Object.keys(endereco).forEach(key => {
                if (!/^\**$/.test(endereco[key])) {
                    if(!removePadding) {
                        address.push(endereco[key]);
                        result.addItem(key, endereco[key]).parent().css('padding', '0px 0px 5px 0px');
                        removePadding = true;
                    } else {
                        address.push(endereco[key]);
                        result.addItem(key, endereco[key]);
                    }
                }

                if (key === 'Estado') {
                    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?${$.param({
                        key: controller.confs.maps,
                        scale: '1',
                        size: '600x150',
                        maptype: 'roadmap',
                        format: 'png',
                        visual_refresh: 'true',
                        markers: `size:mid|color:red|label:1|${address.join(', ')}`
                    })}`;

                    const mapItem = result.addItem().addClass('map').append(
                        $('<a />').attr({
                            href: `https://www.google.com/maps?${$.param({
                                q: address.join(', ')
                            })}`,
                            target: '_blank'
                        }).append($('<img />').attr('src', mapUrl)));

                        $('<br>').insertBefore(mapItem);

                    result.addSeparator('Endereço', 'Localização', 'Endereçamento e mapa').css('display', 'none');
                }
            });
        });

    };

    const setAddress = (result, jdocument, rfb = false) => {
        const init = rfb ? 'BPQL > body enderecos > endereco' : 'BPQL > body enderecos > enderecos';

        const addressElements = [];
        const cepElements = [];

        jdocument.find(init).each((i, node) => {
            const nodes = {
                Tipo: 'tipoLogradouro',
                Endereço: 'logradouro',
                Número: 'numero',
                Complemento: 'complemento',
                CEP: 'cep',
                Bairro: 'bairro',
                Cidade: ['cidade', 'municipio'],
                Estado: ['estado', 'uf']
            };

            const jnode = $(node);
            const address = [];

            for (var idx in nodes) {
                let data = '';
                if (Array.isArray(nodes[idx])) {
                    for (let item in nodes[idx]) {
                        let itemNode = jnode.find(nodes[idx][item]);
                        if (itemNode.length) {
                            data = itemNode.text();
                            break;
                        }
                    }
                } else {
                    data = jnode.find(nodes[idx]).text();
                }
                nodes[idx] = (/^\**$/.test(data)) ? '' : data;
            }

            if (!nodes['Endereço'] || !nodes.CEP) {
                return;
            }

            if (_.contains(addressElements, nodes['Endereço']) ||
                _.contains(cepElements, nodes.CEP) ||
                Math.max(..._.map(addressElements, value => require('jaro-winkler')(value, nodes['Endereço']))) > 0.85) {
                return;
            }

            addressElements.push(nodes['Endereço']);
            cepElements.push(nodes.CEP);

            if (!addressIsEmpty(nodes)) {
                result.addSeparator('Endereço', 'Localização', 'Endereçamento e mapa');
                for (idx in nodes) {
                    if (!/^\**$/.test(nodes[idx])) {
                        result.addItem(idx, nodes[idx]);
                    }
                }

                jnode.find('*').each((idx, node) => {
                    const jnode = $(node);
                    if (!/complemento/i.test(jnode.prop('tagName'))) {
                        address.push(jnode.text());
                    }
                });

                const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?${$.param({
                    key: controller.confs.maps,
                    scale: '1',
                    size: '600x150',
                    maptype: 'roadmap',
                    format: 'png',
                    visual_refresh: 'true',
                    markers: `size:mid|color:red|label:1|${address.join(', ')}`
                })}`;

                result.addItem().addClass('map').append(
                    $('<a />').attr({
                        href: `https://www.google.com/maps?${$.param({
                            q: address.join(', ')
                        })}`,
                        target: '_blank'
                    }).append($('<img />').attr('src', mapUrl)));
            }

            // Adiciona o item caso o endereço esteja completo
            // for (idx in nodes) {
            //     if (/^\**$/.test(nodes[idx])) {
            //         return;
            //     }
            //     result.addItem(idx, nodes[idx]);
            // }
        });
    };

    const setEmpregador = (result, jdocument) => {
        jdocument.find('rendaEmpregador rendaEmpregador').each((i, x) => {
            let v = k => $(k, x).first().text();
            result.addSeparator(`Empregador ${v('empregador')}`, `${v('setorEmpregador')} - Documento ${CNPJ.format(v('documentoEmpregador'))}`, 'Empregador registrado');
            result.addItem('Descrição', v('cboDescricao'));
            result.addItem('Faixa Salarial', v('faixaRenda'));
            result.addItem('Data', `${moment(v('rendaDataRef'), 'YYYY-MM-DD').format('DD/MM/YYYY')}, ${moment(v('rendaDataRef'), 'YYYY-MM-DD').fromNow()}`);
        });
    };

    const setContact = (result, jdocument) => {
        const formatarTelefone = (telefone, secondSlice = 2) => `(${telefone.slice(0, 2)}) ${telefone.slice(secondSlice)}`;
        let phones = [];
        let emails = [];

        const telefonesFixos = jdocument.find('BPQL > body telefones > fixos > fixos').get();
        const telefonesMoveis = jdocument.find('BPQL > body telefones > moveis > moveis').get();
        const emailsFinder = jdocument.find('BPQL > body emails > emails');
        const telefoneRFB = jdocument.find('BPQL > body > RFB > telefones').text().trim().split(' / ').map(tel => tel.trim()).filter(tel => tel.length);
        const emailsRFB = jdocument.find('BPQL > body email');

        let $phones = telefonesFixos;

        telefonesMoveis.forEach((moveis) => $phones.push(moveis));

        $phones.forEach((node => {
            const telefone = $(node).find('telefone').text();
            phones.push(formatarTelefone(telefone));
        }));

        if (telefoneRFB.length) telefoneRFB.forEach(tel => phones.push(tel));

        emailsFinder.each((idx, node) => {
            let email = $(node).find('email').text().trim();
            if (!email) return;
            //if (_.contains(emails, email)) return;
            emails.push(email);
        });

        //if (telefoneRFB.length) phones.push(formatarTelefone(telefoneRFB.text(), 3));
        emailsRFB.each((idx, node) => {
            let email = $(node).text().trim();
            if (!email) return;
            //if (_.contains(emails, email)) return;
            emails.push(email);
        });

        if (!phones.length && !emails.length) return;

        phones = _.uniq(phones);
        emails = _.uniq(emails.map(email => email.toLowerCase()));

        result.addSeparator('Contato', 'Meios de contato', 'Telefone, e-mail e outros');
        for (const idxPhones in phones) {
            let phone = phones[idxPhones];
            if (!/[0-9]/.test(phone)) return;
            result.addItem('Telefone', phones[idxPhones]);
        }

        for (const idxEmails in emails) {
            result.addItem('Email', emails[idxEmails]);
        }

    };

    let companys = [];

    const setSocios = (result, jdocument) => {
        let $empresas = jdocument.find('BPQL > body socios > socio');

        if ($empresas.length === 0) return;

        //result.addSeparator('Quadro Societário', 'Sócios', '').next().find('.content').addClass('mdl-grid');

        for (let node of $empresas) {
            let $node = $(node);
            let nodes = {};
            if (companys.map(e => e.toLowerCase()).includes($node.text().toLowerCase())) continue;
            nodes[$node.attr('qualificacao')] = $node.text();
            //result.addSeparator('Quadro Societário', 'Empresa', 'Empresa a qual faz parte.');
            //const separator = result.addSeparator('', '', '').css('display', 'none');
            //separator.next().find('.content').css('padding', '0');

            for (const idx in nodes) {
                //result.addItem(idx, nodes[idx]).addClass('mdl-cell--2-col').find('.value').css('text-align', 'center');
                const item = result.addItem(idx, nodes[idx]).addClass('mdl-cell--2-col');
                /*item.find('.value').css('text-align', 'left').insertAfter(item.find('.name').css({
                    fontSize: '12px',
                    textAlign: 'left'
                }));*/
            }

        }
    };

    const setQSA = (result, jdocument) => {
        let $empresas = jdocument.find('BPQL > body quadroSocietario > quadroSocietario');

        if ($empresas.length === 0) return;

        result.addSeparator('Quadro Societário', 'Sócios', '').css('margin-bottom', '40px');

        $empresas.get().forEach((node) => {
            let $node = $(node);

            let nodes = {
                Sócio: 'nome',
                CPF: 'documento',
                // "Participação": "quali"
            };

            let dict = {
                documento: pad(11, $(node).find('documento').text().replace(/^0+/g, ''), '0'),
                //ihash: $(node).find('doc').attr('ihash')
            };

            let items = {};
            //let separator = result.addSeparator('Quadro Societário', `Empresa ${CNPJ.format(jdocument.find('cadastro > cpf'))}`, '', items);
            let separator = result.addSeparator('', '', '').css('display', 'none');
            separator.next().find('.content').css('padding', '0').addClass('mdl-grid');

            for (const idx in nodes) {
                const data = $node.find(nodes[idx]).text();
                nodes[idx] = (/^\**$/.test(data)) ? '' : data;
                if (idx === 'CPF') nodes[idx] = CPF.format(pad(11, nodes[idx].replace(/^0+/g, ''), '0'));
                if (idx === 'Sócio') companys.push(nodes[idx]);
                if (idx === 'Sócio') {
                    const item = result.addItem(idx, nodes[idx]).addClass('mdl-cell--4-col mdl-cell--1-col-phone');
                    item.find('.value').css('text-align', 'left').insertAfter(item.find('.name').css({
                        fontSize: '12px',
                        textAlign: 'left'
                    }));
                } else {
                    const item = result.addItem(idx, nodes[idx]).addClass('mdl-cell--2-col mdl-cell--1-col-phone');
                    item.find('.value').css('text-align', 'left').insertAfter(item.find('.name').css({
                        fontSize: '12px',
                        textAlign: 'left'
                    }));
                }
            }

            const loadingSpan = '<span class="saving"><span> .</span><span>.</span><span>.</span> </span>';

            const $chequesSemFundos = result.addItem('Cheques Sem Fundos', loadingSpan).addClass('mdl-cell--2-col mdl-cell--1-col-phone');
            const $protestos = result.addItem('Protestos', loadingSpan).addClass('mdl-cell--2-col mdl-cell--1-col-phone');

            $chequesSemFundos.find('.value').css('text-align', 'left').insertAfter($chequesSemFundos.find('.name').css({
                fontSize: '12px',
                textAlign: 'left'
            }));
            $protestos.find('.value').css('text-align', 'left').insertAfter($protestos.find('.name').css({
                fontSize: '12px',
                textAlign: 'left'
            }));

            controller.server.call('SELECT FROM \'SEEKLOC\'.\'CCF\'', {
                data: dict,
                success: ret => {
                    let totalRegistro = parseInt($(ret).find('BPQL > body > data > resposta > totalRegistro').text());
                    /*let message = 'Não há cheques sem fundo.';
                    if (totalRegistro) {
                        let qteOcorrencias = $(ret).find('BPQL > body > data > sumQteOcorrencias').text();
                        let v1 = moment($('dataUltOcorrencia', ret).text(), 'DD/MM/YYYY');
                        let v2 = moment($('ultimo', ret).text(), 'DD/MM/YYYY');
                        message = ` Total de registros CCF: ${qteOcorrencias} com data da última ocorrência: ${(v1.isAfter(v2) ? v1 : v2).format('DD/MM/YYYY')}.`;
                    }
                    items.resultsDisplay.text(`${items.resultsDisplay.text()} ${message}`);*/
                    if (totalRegistro) {
                        const qteOcorrencias = $(ret).find('BPQL > body > data > sumQteOcorrencias').text();
                        const v1 = moment($('dataUltOcorrencia', ret).text(), 'DD/MM/YYYY');
                        const v2 = moment($('ultimo', ret).text(), 'DD/MM/YYYY');
                        //result.addItem('Cheques Sem Fundos', qteOcorrencias);
                        $chequesSemFundos.find('.value').text(qteOcorrencias);
                    } else {
                        $chequesSemFundos.find('.value').text('0');
                    }
                }
            });

            controller.server.call('SELECT FROM \'IEPTB\'.\'WS\'', {
                data: dict,
                success: ret => {
                    /*if ($(ret).find('BPQL > body > consulta > situacao').text() != 'CONSTA') {
                        items.resultsDisplay.text(`${items.resultsDisplay.text()} Não há protestos.`);
                        return;
                    }*/
                    if ($(ret).find('BPQL > body > consulta > situacao').text() != 'CONSTA') {
                        //result.addItem('Protestos', 'Não há protestos.');
                        $protestos.find('.value').text('0');
                        return;
                    }
                    let totalProtestos = $('protestos', ret)
                        .get()
                        .map(p => parseInt($(p).text()))
                        .reduce((a, b) => a + b, 0);
                    $protestos.find('.value').text(`${isNaN(totalProtestos) ? '1 ou mais' : totalProtestos}`);
                    //items.resultsDisplay.text(`${items.resultsDisplay.text()} Total de Protestos: ${isNaN(totalProtestos) ? '1 ou mais' : totalProtestos}.`);
                }
            });

            /*for (const idx in nodes) {
                const data = $node.find(nodes[idx]).text();
                nodes[idx] = (/^\**$/.test(data)) ? '' : data;
                if (idx === 'CPF') nodes[idx] = CPF.format(pad(11, nodes[idx].replace(/^0+/g, ''), '0'));
                if (idx === 'Sócio') companys.push(nodes[idx]);
                result.addItem(idx, nodes[idx]);
            }*/
        });
    };

    const setSociety = (result, jdocument) => {
        let $empresas = jdocument.find('BPQL > body participacoesEmpresas > participacoesEmpresas');

        if ($empresas.length === 0) {
            return;
        }

        result.addSeparator('Quadro Societário', 'Empresas', 'Empresas a qual faz parte.');

        $empresas.get().forEach((node) => {
            let $node = $(node);

            let nodes = {
                Empresa: 'nome',
                CNPJ: 'documento',
                // "Participação": "quali"
            };

            let dict = {
                documento: $(node).find('documento').text(),
                //ihash: $(node).find('cnpj').attr('ihash')
            };

            let items = {};
            //let separator = result.addSeparator('Quadro Societário', 'Empresa', '', items);
            let separator = result.addSeparator('', '', '').css('display', 'none');
            separator.next().find('.content').css('padding', '0').addClass('mdl-grid');

            for (const idx in nodes) {
                const data = $node.find(nodes[idx]).text();
                nodes[idx] = (/^\**$/.test(data)) ? '' : data;
                if (idx === 'CNPJ') nodes[idx] = CNPJ.format(nodes[idx]);
                if (idx === 'Empresa') {
                    const item = result.addItem(idx, nodes[idx]).addClass('mdl-cell--4-col mdl-cell--1-col-phone');
                    item.find('.value').css('text-align', 'left').insertAfter(item.find('.name').css({
                        fontSize: '12px',
                        textAlign: 'left'
                    }));
                } else {
                    const item = result.addItem(idx, nodes[idx]).addClass('mdl-cell--2-col mdl-cell--1-col-phone');
                    item.find('.value').css('text-align', 'left').insertAfter(item.find('.name').css({
                        fontSize: '12px',
                        textAlign: 'left'
                    }));
                }
            }

            const loadingSpan = '<span class="saving"><span> .</span><span>.</span><span>.</span> </span>';

            const $chequesSemFundos = result.addItem('Cheques Sem Fundos', loadingSpan).addClass('mdl-cell--2-col mdl-cell--1-col-phone');
            const $protestos = result.addItem('Protestos', loadingSpan).addClass('mdl-cell--2-col mdl-cell--1-col-phone');

            $chequesSemFundos.find('.value').css('text-align', 'left').insertAfter($chequesSemFundos.find('.name').css({
                fontSize: '12px',
                textAlign: 'left'
            }));

            $protestos.find('.value').css('text-align', 'left').insertAfter($protestos.find('.name').css({
                fontSize: '12px',
                textAlign: 'left'
            }));

            controller.server.call('SELECT FROM \'SEEKLOC\'.\'CCF\'', {
                data: dict,
                success: ret => {
                    let totalRegistro = parseInt($(ret).find('BPQL > body > data > resposta > totalRegistro').text());
                    if (totalRegistro) {
                        const qteOcorrencias = $(ret).find('BPQL > body > data > sumQteOcorrencias').text();
                        const v1 = moment($('dataUltOcorrencia', ret).text(), 'DD/MM/YYYY');
                        const v2 = moment($('ultimo', ret).text(), 'DD/MM/YYYY');
                        //result.addItem('Cheques Sem Fundos', qteOcorrencias);
                        $chequesSemFundos.find('.value').text(qteOcorrencias);
                    } else {
                        $chequesSemFundos.find('.value').text('0');
                    }
                    /*let message = 'Não há cheques sem fundo.';
                    if (totalRegistro) {
                        let qteOcorrencias = $(ret).find('BPQL > body > data > sumQteOcorrencias').text();
                        let v1 = moment($('dataUltOcorrencia', ret).text(), 'DD/MM/YYYY');
                        let v2 = moment($('ultimo', ret).text(), 'DD/MM/YYYY');
                        message = ` Total de registros CCF: ${qteOcorrencias} com data da última ocorrência: ${(v1.isAfter(v2) ? v1 : v2).format('DD/MM/YYYY')}.`;
                    }
                    items.resultsDisplay.text(`${items.resultsDisplay.text()} ${message}`);*/
                }
            });

            controller.server.call('SELECT FROM \'IEPTB\'.\'WS\'', {
                data: dict,
                success: ret => {
                    /*if ($(ret).find('BPQL > body > consulta > situacao').text() != 'CONSTA') {
                        items.resultsDisplay.text(`${items.resultsDisplay.text()} Não há protestos.`);
                        return;
                    }*/
                    if ($(ret).find('BPQL > body > consulta > situacao').text() != 'CONSTA') {
                        //result.addItem('Protestos', 'Não há protestos.');
                        $protestos.find('.value').text('0');
                        return;
                    }
                    let totalProtestos = $('protestos', ret)
                        .get()
                        .map(p => parseInt($(p).text()))
                        .reduce((a, b) => a + b, 0);
                    /*items.resultsDisplay.text(`${items.resultsDisplay.text()} Total de Protestos: ${isNaN(totalProtestos) ? '1 ou mais' : totalProtestos}.`);*/
                    //result.addItem('Protestos', `${isNaN(totalProtestos) ? '1 ou mais' : totalProtestos}`);
                    $protestos.find('.value').text(`${isNaN(totalProtestos) ? '1 ou mais' : totalProtestos}`);
                }
            });

            /*for (const idx in nodes) {
                const data = $node.find(nodes[idx]).text();
                nodes[idx] = (/^\**$/.test(data)) ? '' : data;
                if (idx === 'CNPJ') nodes[idx] = CNPJ.format(nodes[idx]);
                result.addItem(idx, nodes[idx]);
            }*/
        });
    };

    const parserConsultas = document => {
        const jdocument = $(document);

        const result = controller.call('result');

        const nodes = {
            CPF: 'cpf',
            CNPJ: 'cnpj',
            'Nome da Mãe': 'maeNome',
            'CPF da Mãe': 'maecpf',
            'Data de Nascimento': 'datanascimento',
            Situação: 'receitaStatus',
            Idade: 'idade',
            Signo: 'signo',
            Sexo: 'sexo',
            RG: 'rg',
            'RG/UF': 'ufrg',
            'Óbito Provável': 'obitobitoprovavel',
            'Atividade Econômica': 'atividade-economica',
            'Natureza Jurídica': 'natureza-juridica',
            'Data de Abertura': 'data-abertura',
            'Idade da Empresa': 'idadeEmpresa',
            'Quantidade de Funcionários': 'quantidadeFuncionarios',
            'Porte da Empresa': 'porteEmpresa',
        };

        const init = 'BPQL > body ';
        let doc;
        if (tags.indexOf('no-informações-cadastrais') === -1) {
            for (const idx in nodes) {
                let data = jdocument.find(init + nodes[idx]).first().text() || jdocument.find(init + nodes[idx].toUpperCase()).first().text();
                if (/^\**$/.test(data))
                    continue;
                if (idx === 'CPF' || idx === 'CNPJ') {
                    data = data.replace(/^0+/, '');
                    data = pad(11, data, '0');
                    if (CPF.isValid(data)) {
                        result.addItem('Nome', jdocument.find(init + 'nome').first().text(), 'nome');
                        result.addItem('CPF', CPF.format(data), nodes[idx]);
                        doc = CPF.format(data);
                    } else {
                        data = pad(14, data, '0');
                        result.addItem('Nome', jdocument.find(init + '> RFB > nome').first().text(), 'nome');
                        result.addItem('CNPJ', CNPJ.format(data), nodes[idx]);
                        doc = CNPJ.format(data);
                    }
                    continue;
                }
                result.addItem(idx, data, nodes[idx]);
            }
        }

        const capitalSocial = jdocument.find('capitalSocial');
        if (capitalSocial.length) {
            result.addItem('Capital Social', numeral(capitalSocial.text().replace('.', ',')).format('$0,0.00'), 'capitalSocial');
        }

        if (doc) {
            controller.trigger('ccbusca::parser', {
                result,
                doc,
            });
        }

        /*setAddress(result, jdocument);
        setAddress(result, jdocument, true);*/
        //setSocio(result, jdocument);
        if (tags.indexOf('no-informações-cadastrais') === -1) {
            setAddressNew(result, jdocument);
            setContact(result, jdocument);
            setEmpregador(result, jdocument);
        }
        setQSA(result, jdocument);
        setSocios(result, jdocument);
        setSociety(result, jdocument);

        const tagExistir = (tag) => !((controller.confs.user.tags || []).indexOf(`no-${tag}`) === -1);

        if (tagExistir('protesto') || tagExistir('ccf')) controller.trigger('processoJuridicoParser', {
            result,
            doc
        });

        /*controller.trigger('processoJuridicoParser', {
            result,
            doc
        });*/

        return result.element();
    };

    controller.registerBootstrap('parserCCbusca', callback => {
        callback();
        controller.importXMLDocument.register('CCBUSCA', 'CONSULTA', parserConsultas);
        controller.importXMLDocument.register('CCBUSCA', 'BILLING', parserConsultas);
    });

};
