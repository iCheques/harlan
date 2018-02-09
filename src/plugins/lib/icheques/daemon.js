module.exports = controller => {

    let modal;

    controller.registerTrigger('find::database::instant::search', 'icheques::daemon', (args, callback) => {

        if (!/(wba|daemon)/i.test(args[0])) {
            callback();
            return;
        }

        args[1].item('iCheques', 'Integração com a WBA', 'Integre o iCheques com seu software WBA.')
            .addClass('icheque')
            .click(controller.click('icheques::wba'));

        callback();
    });

    controller.registerTrigger('authentication::authenticated', 'icheques::daemon', (opts, cb) => {
        cb();
        let isRunning = false;

        let interval = setInterval(() => {
            if (modal || isRunning) return;
            isRunning = true;
            $.ajax('https://daemon.icheques.com.br:3001/configuration', {
                dataType: 'json',
                success: configuration => {
                    clearInterval(interval);
                    if (!configuration || configuration.ready) return;
                    controller.confirm({
                        title: 'Deseja prosseguir com a configuração da integração WBA?',
                        subtitle: 'Detectamos uma integração WBA não configurada neste computador.',
                        paragraph: 'Para que a integração funcione corretamente você precisa informar como o software se conectará ao banco de dados WBA.'
                    }, () => controller.call('icheques::wba::configure', configuration.hash, configuration));
                },
                complete: () => { isRunning = false; }
            });
        }, 10000);
    });

    controller.registerCall('icheques::wba', () => {
        $.ajax('https://daemon.icheques.com.br:3001/configuration', {
            timeout: 3000,
            success: configuration => controller.call('icheques::wba::configure', configuration.hash, configuration),
            error: () => controller.call('alert', {
                title: 'Você precisa instalar o Integrador iCheques',
                subtitle: 'Não detectamos uma instalação do Integrador iCheques neste computador.',
                paragraph: 'Para acessar esta funcionalidade você precisa instalar o integrador iCheques, clique no <a href="https://github.com/bipbop/daemon-wba-icheques/raw/master/icheques-installer.exe" title="Instalador iCheques">link</a>, execute e tente novamente.'
            })
        });
    });

    controller.registerCall('icheques::wba::configure', (hash, configuration = {}) => {
        modal = controller.call('modal');
        modal.gamification();
        modal.title('Configuração do Integrador iCheques WBA');
        modal.subtitle('Realize as configurações necessárias do seu integrador WBA.');
        modal.paragraph(`O seu integrador será configurado. Por favor
            insira as configurações de acesso da máquina onde o aplicativo está instalado para que possamos prosseguir. Lembre-se,
            as configurações podem levar alguns minutos para surtir efeito. Utilize o <i>Log da Aplicação</i> para verificar se a aplicação está
            configurada adequadamente.`);
        let form = modal.createForm();
        let l0 = {labelPosition: 'before', append: form.multiField()};
        let l1 = {labelPosition: 'before', append: form.multiField()};
        let l2 = {labelPosition: 'before', append: form.multiField()};
        let inputHash = form.addInput('hash', 'text', 'Hash', l0, 'Hash', hash).attr({readonly: true, disabled: true}).addClass('gold');
        let minValInput = form.addInput('minVal', 'text', '100,00', l0, '(R$) Valor Mínimo do Cheque', numeral(configuration.database.minval / 100).format('0.0,00')).mask('000.000.000.000.000,00', {reverse: true});
        let inputUser = form.addInput('user', 'text', 'sa', l1, 'Usuário do MSSQL WBA', configuration.database.user);
        let inputPassword = form.addInput('password', 'password', 'wba1234*', l1, 'Senha do MSSQL WBA', configuration.database.password);
        let inputServer = form.addInput('server', 'text', '10.0.57.14\\SQLEXPRESS', l2, 'Endereço do Servidor', configuration.database.server);
        let inputDatabase = form.addInput('database', 'text', 'Factoring', l2, 'Nome do Banco de Dados', configuration.database.database);

        form.element().submit(e => {
            e.preventDefault();

            let sendData = {
                hash,
                database : {
                    user: inputUser.val(),
                    password: inputPassword.val(),
                    server: inputServer.val(),
                    database: inputDatabase.val(),
                    minVal: numeral(minValInput.val()).value() * 100,
                    pool: {
                        max: 10,
                        min: 0,
                        idleTimeoutMillis: 1200
                    }
                }
            };

            let errors = [];
            if (/^\s*$/.test(sendData.database.user)) {
                errors.push(['Não foi possível validar o nome de usuário do banco de dados.', 'Verifique o nome de usuário do banco de dados e tente novamente.']);
                inputUser.addClass('error');
            } else inputUser.removeClass('error');

            if (!sendData.database.password) {
                errors.push(['Não foi possível validar a senha do banco de dados.', 'Verifique a senha do banco de dados e tente novamente.']);
                inputPassword.addClass('error');
            } else inputPassword.removeClass('error');

            if (/^\s*$/.test(sendData.database.server)) {
                errors.push(['Não foi possível validar o endereço do banco de dados.', 'Verifique o endereço do banco de dados e tente novamente.']);
                inputServer.addClass('error');
            } else inputServer.removeClass('error');

            if (/^\s*$/.test(sendData.database.database)) {
                errors.push(['Não foi possível validar o nome do banco de dados.', 'Verifique o nome do banco de dados e tente novamente.']);
                inputDatabase.addClass('error');
            } else inputDatabase.removeClass('error');

            if (errors.length) {
                for (let error of errors) toastr.error(...error);
                return;
            }
            controller.server.call(`UPDATE 'HARLANAUTHENTICATION'.'REQUESTCONFIGURATION' WHERE 'HASH' = '${sendData.hash}'`,
                controller.call('loader::ajax', controller.call('error::ajax', {
                    dataType: 'json',
                    method: 'post',
                    contentType: 'application/json',
                    data: JSON.stringify(sendData),
                    success: ret => toastr.success('Banco de dados configurado com sucesso, acompanhe o log de mensagens.',
                        'Acompanhe o log de mensagens antes de fechar esta janela.')
                })));
        });

        form.addSubmit('configure', 'Configurar Integrador');

        let actions = modal.createActions();
        actions.add('Log da Aplicação').click(e => {
            e.preventDefault();
            let modal = controller.call('modal');
            modal.gamification();
            modal.title('Log do Integrador iCheques WBA');
            modal.subtitle('Verifique as mensagens que o integrador WBA tem gerado.');
            let form = modal.createForm();
            let list = form.createList();

            let update = () => $.ajax('https://daemon.icheques.com.br:3001/log', {
                dataType: 'json',
                success: log => {
                    list.empty();
                    for (let row of log) list.item('fa-warning', row);
                }
            });

            update();
            let updateInterval = setInterval(() => update(), 2000);
            modal.onClose = () => {
                clearInterval(updateInterval);
                modal = null;
            };
            modal.createActions().cancel(null, 'Fechar');
        });
        actions.cancel(null, 'Fechar');
    });
};
