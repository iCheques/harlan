module.exports = controller => {

    controller.registerCall('admin::change::address', (companyNode, username, section) => {
        const form = controller.call('form', opts => {
            opts.username = username;
            controller.serverCommunication.call('UPDATE \'BIPBOPCOMPANYS\'.\'ADDRESS\'',
                controller.call('error::ajax', controller.call('loader::ajax', {
                    data: opts,
                    success: response => {
                        controller.call('admin::view::company', $(response).find('BPQL > body > company'), section, 'replaceWith');
                    }
                })));
        });

        const endereco = $(companyNode).children('endereco');
        form.configure({
            title: 'Alteração de Endereço',
            subtitle: 'Preencha os dados abaixo.',
            gamification: 'magicWand',
            paragraph: 'É muito importante que os dados estejam preenchidos de maneira correta para que seja mantido um cadastro saneado.',
            screens: [{
                magicLabel: true,
                fields: [
                    [{
                        name: 'endereco',
                        optional: false,
                        type: 'text',
                        value: endereco.find('endereco:eq(0)').text(),
                        placeholder: 'Endereço',
                    }, {
                        name: 'zipcode',
                        type: 'text',
                        placeholder: 'CEP',
                        optional: false,
                        labelText: 'CEP',
                        value: endereco.find('endereco:eq(5)').text(),
                        mask: '00000-000'
                    }],
                    [{
                        name: 'numero',
                        optional: false,
                        type: 'text',
                        numeral: true,
                        value: endereco.find('endereco:eq(1)').text(),
                        placeholder: 'Número'
                    }, {
                        name: 'complemento',
                        value: endereco.find('endereco:eq(2)').text(),
                        type: 'text',
                        optional: true,
                        placeholder: 'Complemento'
                    }],
                    [{
                        name: 'cidade',
                        value: endereco.find('endereco:eq(4)').text(),
                        optional: false,
                        type: 'text',
                        placeholder: 'Cidade'
                    }, {
                        name: 'estado',
                        optional: false,
                        type: 'select',
                        value: endereco.find('endereco:eq(6)').text(),
                        placeholder: 'Estado',
                        list: {
                            '': 'Escolha um estado',
                            AC: 'Acre',
                            AL: 'Alagoas',
                            AM: 'Amazonas',
                            AP: 'Amapá',
                            BA: 'Bahia',
                            CE: 'Ceará',
                            DF: 'Distrito Federal',
                            ES: 'Espírito Santo',
                            GO: 'Goiás',
                            MA: 'Maranhão',
                            MT: 'Mato Grosso',
                            MS: 'Mato Grosso do Sul',
                            MG: 'Minas Gerais',
                            PA: 'Pará',
                            PB: 'Paraíba',
                            PR: 'Paraná',
                            PE: 'Pernambuco',
                            PI: 'Piauí',
                            RJ: 'Rio de Janeiro',
                            RN: 'Rio Grande do Norte',
                            RO: 'Rondônia',
                            RS: 'Rio Grande do Sul',
                            RR: 'Roraima',
                            SC: 'Santa Catarina',
                            SE: 'Sergipe',
                            SP: 'São Paulo',
                            TO: 'Tocantins'
                        }
                    }]
                ]
            }]
        });
    });

};
