module.exports = controller => {


    controller.registerCall('icheques::welcome', ret => {
        var ichequesReport = controller.call('report',
            'Adicione um cheque para monitorá-lo até seu vencimento',
            'A iCheques é a forma mais segura para aceitar e antecipar cheques. Entramos dentro do Banco e consultamos AO VIVO o status do cheque, repetindo a consulta até o vencimento. Alertamos caso mudar o status do cheque.',
            false);

        var report = controller.call('report',
            'Seja bem vindo ao CreditHub',
            'Somos seu mais novo Hub de crédito que reune diversas consultas avançadas e ajudamos a antecipar seus cheques ou duplicatas com +300 Financeiras por todo Brasil.',
            false);

        if (!controller.confs.isCordova) {
            ichequesReport.button('Adicionar Cheque', () => {
                controller.call('icheques::newcheck');
            }).addClass('credithub-button');

            report.button('Dados Cadastrais', () => {
                controller.call('icheques::form::company');
            }).addClass('gray-button');

            if (!harlan.confs.user.contrato[1]) report.button('Alterar Plano',
                () => controller.call('icheques::changeplan'))
                .addClass('newplan-button');
        } else {
            report.button('Sair da Conta', () => {
                controller.call('authentication::logout');
            }).addClass('gray-button');

        }

        report.gamification('shield');
        ichequesReport.gamification('shield').addClass('icheques-shield');

        $('.app-content').prepend(ichequesReport.element());
        $('.app-content').prepend(report.element());
    });



    controller.registerCall('icheques::changeplan', () => {
        const modal = controller.call('modal');
        modal.gamification('star');
        modal.title('Solicitação de Alteração de Plano');
        modal.subtitle('Solicite uma alteração de plano.');
        modal.paragraph('Será aberto um chamado para alteração do plano em nosso comercial e você será respondido em até 24 (vinte e quatro) horas úteis.');

        const form = modal.createForm();
        const plan = form.addSelect('planos', 'planos', {
            noplan: 'Bronze',
            flex: 'Flex',
            prata: 'Prata',
            ouro: 'Ouro',
            diamante: 'Diamante'
        }, 'noplan', 'Plano');

        const volume = form.addInput('Quantidade de Consultas', 'text', 'Quantidade de Consultas (mês)')
            .magicLabel('Quantidade de Consultas (mês)')
            .mask('#.##0', {
                reverse: true
            });

        const reference = form.addInput('Referência Comercial', 'text', 'Referência Comercial')
            .magicLabel('Referência Comercial');

        form.element().submit(e => {
            e.preventDefault();

            const vPlan = plan.val();
            const vVolume = volume.val();
            const vReference = reference.val();

            if (vPlan === 'flex' && parseInt(vVolume, 10) < 50) {
                volume.addClass('error');
                toastr.error('Mínimo de 50 (cinquenta) consultas por mês.', 'Mínimo de Consultas');
                return;
            }


            controller.serverCommunication.call("UPDATE 'BIPBOPCOMPANYS'.'PLAN'", controller.call('loader::ajax', controller.call('error::ajax', {
                data: { 
                    plan: vPlan,
                    volume: vVolume,
                    reference: vReference,
                },
                success: () => toastr.success("Solicitada a alteração de plano, aguarde até 24 (vinte e quatro) horas até que nosso comercial responda.", "Solicitação realizada com sucesso.")
            })));

            modal.close();
        });

        const list = form.createList();

        const setPlan = () => {
            volume.hide();
            list.empty();
            switch (plan.val()) {
                case 'noplan':
                    list.item('fa-check', 'R$ 1,50 consulta de CPF/CNPJ e cheques (até 5 meses).');
                    break;
                case 'prata':
                    list.item('fa-check', '500 (quinhentas) consulta CPF/CNPJ e cheques.');
                    list.item('fa-check', 'Prospecção automática (apenas financeiras).');
                    list.item('fa-money', 'R$ 250,00 (duzentos e cinquenta reais) por mês.');
                    list.item('fa-money', 'R$ 1,00 (um real) a consulta de CPF/CNPJ e cheque excedente (até 5 meses).');
                    break;
                case 'ouro':
                    list.item('fa-check', '1.000 (um mil) consulta CPF/CNPJ e cheques.');
                    list.item('fa-check', 'Protestos e cheques sem fundo nas operações de duplicatas (apenas financeiras).');
                    list.item('fa-check', 'Prospecção automática (apenas financeiras).');
                    list.item('fa-money', 'R$ 500,00 (quinhentos reais) por mês.');
                    list.item('fa-money', 'R$ 1,00 (um real) a consulta de CPF/CNPJ e cheque excedente (até 5 meses).');
                    break;
                case 'diamante':
                    list.item('fa-check', 'Consultas ILIMITADAS de CPF/CNPJ e cheques.');
                    list.item('fa-check', 'Protestos e cheques sem fundo nas operações de duplicatas (apenas financeiras).');
                    list.item('fa-check', 'Prospecção automática (apenas financeiras).');
                    list.item('fa-money', 'R$ 999,99 (novecentos e noventa e nove reais) por mês.');
                    break;
                case 'flex':
                    list.item('fa-check', 'Plano customizado (entraremos em contato).');
                    list.item('fa-money', 'A partir de R$ 1,00 (um real) para consultas de CPF/CNPJ e cheques.');
                    volume.show();
                    break;
            }
        };

        setPlan();
        plan.change(setPlan);

        form.addSubmit('submit', 'Alterar Plano');
        modal.createActions().cancel();
    });

    controller.registerTrigger('call::authentication::loggedin', 'icheques::welcome', (args, callback) => {
        callback();
        controller.serverCommunication.call('SELECT FROM \'ICHEQUESAUTHENTICATION\'.\'ANNOTATIONS\'', {
            success(ret) {
                controller.call('icheques::welcome', ret);
            }
        });
    });

};
