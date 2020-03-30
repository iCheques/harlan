module.exports = controller => {


    controller.registerCall('icheques::welcome', ret => {
        var ichequesReport = controller.call('report',
            'iCheques - Cheque Sem Susto!',
            'Consulta e Monitoramento Interbancário de Cheques até o Vencimento',
            'Nunca mais receba cheques podres.  Consulta recorrente, AO VIVO, até o vencimento, dentro do Banco, e alertamos na troca de ocorrência.  Não há forma mais segura para aceitar cheques em seu negócio.',
            false);

        var report = controller.call('report',
            'Seja bem vindo ao CreditHub - Seu mais novo Hub de Crédito!',
            'O CreditHub reune diversas consultas avançadas e ajuda a antecipar seus Cheques ou Duplicatas com +300 Financeiras por todo Brasil.',
            'Plano inicial - Bronze: Voce paga 3x mais caro.  Veja nossos Planos ao lado e economize até 70% com uma franquia.',
            false);

        if (!controller.confs.isCordova) {
            ichequesReport.button('Adicionar Cheque', () => {
                controller.call('icheques::newcheck');
            }).addClass('credithub-button');

            report.button('Dados Cadastrais (Emissão de NF)', () => {
                controller.call('icheques::form::company');
            }).addClass('gray-button');

            report.button('Editar Plano',
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
        modal.title('Sua Assinatura CreditHub');
        modal.subtitle('Vamos assinar uma franquia de consultas (Economia de até 70%)?');
        modal.paragraph('Todos começam no Plano Bronze, sem mensalidade e pré-pago.  Nele voce paga 3x mais caro (R$1,50 invés de até R$0,50).  Escolha uma franquia abaixo e economize até 70%!');

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

        const reference = form.addInput('Quem te ajudou / indicou?', 'text', 'Indicação / Ajuda de:')
            .magicLabel('Referência Comercial');

        form.element().submit(e => {
            e.preventDefault();

            const vPlan = plan.val();
            const vVolume = volume.val();
            const vReference = reference.val();

            if (vPlan === 'flex' && parseInt(vVolume, 10) < 50) {
                volume.addClass('error');
                toastr.error('Mínimo de 50 consultas por mês.', 'Mínimo de Consultas');
                return;
            }


            controller.serverCommunication.call("UPDATE 'BIPBOPCOMPANYS'.'PLAN'", controller.call('loader::ajax', controller.call('error::ajax', {
                data: {
                    plan: vPlan,
                    volume: vVolume,
                    reference: vReference,
                },
                success: () => toastr.success("Aguarde até 24hrs para que nosso setor comercial responda.", "Pedido realizada com sucesso.")
            })));

            modal.close();
        });

        const list = form.createList();

        const setPlan = () => {
            volume.hide();
            list.empty();
            switch (plan.val()) {
                case 'noplan':
                    list.item('fa-check', 'R$ 1,50 Consulta de CPF/CNPJ.');
                    list.item('fa-check', 'R$ 1,50 Monitoramento de Cheques (até 5 meses) + R$0,30/mês excedente.');
                    list.item('fa-check', 'R$ 1 Monitoramento de CPF/CNPJ (Gerencie Carteira).');
                    list.item('fa-money', 'Mensalidade: R$ 0/mês. Pré-Pago');
                    break;
                case 'prata':
                    list.item('fa-check', 'Franquia de 500 Consultas de CPF/CNPJ/Cheques.');
                    list.item('fa-check', 'Prospecção Automática (Apenas Financeiras).');
                    list.item('fa-money', 'R$ 1 Consulta de CPF/CNPJ/Cheque Excedente.');
                    list.item('fa-money', 'Mensalidade: R$ 250/mês.  Pós-Pago');
                    break;
                case 'ouro':
                    list.item('fa-check', 'Franquia de 1.000 Consultas de CPF/CNPJ/Cheques.');
                    list.item('fa-check', 'Prospecção Automática (Apenas Financeiras).');
                    list.item('fa-check', 'Protestos e CCF ILIMITADO nas Operações de Duplicatas (Apenas Financeiras).');
                    list.item('fa-money', 'R$ 1 Consulta de CPF/CNPJ/Cheque Excedente.');
                    list.item('fa-money', 'Mensalidade: R$ 500/mês.  Pós-Pago');
                    break;
                case 'diamante':
                    list.item('fa-check', 'Franquia ILIMITADA de Consultas CPF/CNPJ/Cheques.');
                    list.item('fa-check', 'Prospecção Automática (Apenas Financeiras).');
                    list.item('fa-check', 'Protestos e CCF ILIMITADO nas Operações de Duplicatas (Apenas Financeiras).');
                    list.item('fa-money', 'Mensalidade: R$ 990,99/mês.  Pós-Pago');
                    break;
                case 'flex':
                    list.item('fa-check', 'Escolha seu volume de Consultas CPF/CNPJ/Cheques.');
                    list.item('fa-money', 'A partir de R$ 1 por Consultas CPF/CNPJ/Cheques. Mínimo 50 consultas.');
                    list.item('fa-money', 'R$ 1,50 Consulta de CPF/CNPJ/Cheque Excedente.');
                    list.item('fa-money', 'Mensalidade: R$ X /mês.  Pós-Pago.');
                    volume.show();
                    break;
            }
        };

        setPlan();
        plan.change(setPlan);

        form.addSubmit('submit', 'Solicitar Alteração de Plano');
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
