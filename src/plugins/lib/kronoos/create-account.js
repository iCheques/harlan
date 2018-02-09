var SAFE_PASSWORD = /^.{6,}$/;

var PHONE_REGEX = /^\((\d{2})\)\s*(\d{4})\-(\d{4,5})$/i;
var VALIDATE_NAME = /^[a-z]{2,}\s+[a-z]{2,}/i;
var CPF = require('cpf_cnpj').CPF;
var CNPJ = require('cpf_cnpj').CNPJ;
var emailRegex = require('email-regex');
var sprintf = require('sprintf');

module.exports = controller => {

    controller.registerCall('kronoos::create::account::one', (data, callback, type = 'Account') => {
        var modal = controller.call('modal');
        modal.fullscreen();
        modal.title('Crie sua conta Kronoos');
        modal.subtitle('Informe os dados abaixo para que possamos continuar');
        modal.addParagraph('Sua senha é secreta e recomendamos que não a revele a ninguém.');

        var form = modal.createForm();

        var inputName = form.addInput('nome', 'text', 'Nome Completo').magicLabel();

        var objDocument = {
            append: form.multiField(),
            labelPosition: 'before'
        };

        var objEmail = {
            append: form.multiField(),
            labelPosition: 'before'
        };

        var objLocation = {
            append: form.multiField(),
            labelPosition: 'before'
        };

        var inputCommercialReference = form.addInput('commercialReference', 'text', 'Quem nos indicou? / Referência comercial', objEmail).magicLabel();
        var inputCpf = form.addInput('cpf', 'text', 'CPF', objDocument).mask('000.000.000-00').magicLabel();
        var inputCnpj = form.addInput('cnpj', 'text', 'CNPJ (opcional)', objDocument, 'CNPJ (opcional)').mask('00.000.000/0000-00').magicLabel();
        var inputZipcode = form.addInput('cep', 'text', 'CEP', objLocation).mask('00000-000').magicLabel();
        var inputPhone = form.addInput('phone', 'text', 'Telefone', objLocation).mask('(00) 0000-00009').magicLabel();

        form.addSubmit('login', 'Criar Conta');

        form.element().submit(e => {
            e.preventDefault();

            var errors = [];
            var name = inputName.val();
            var cpf = inputCpf.val();
            var cnpj = inputCnpj.val();
            var zipcode = inputZipcode.val();
            var commercialReference = inputCommercialReference.val();

            if (!VALIDATE_NAME.test(name)) {
                errors.push('Favor preencher o nome completo adequadamente.');
                inputName.addClass('error');
            } else {
                inputName.removeClass('error');
            }

            if (cpf) {
                if (!CPF.isValid(cpf)) {
                    inputCpf.addClass('error');
                    errors.push('O CPF informado não é válido.');
                } else {
                    inputCpf.removeClass('error');
                }
            }

            if (cnpj) {
                if (!CNPJ.isValid(cnpj)) {
                    inputCnpj.addClass('error');
                    errors.push('O CNPJ informado não é válido.');
                } else {
                    data.cnpj = cnpj;
                    inputCnpj.removeClass('error');
                }
            } else {
                inputCnpj.removeClass('error');
            }

            if (zipcode) {
                if (!/^\d{5}-\d{3}$/.test(zipcode)) {
                    inputZipcode.addClass('error');
                    errors.push('O CEP informado não é válido.');
                } else {
                    inputZipcode.removeClass('error');
                }
            }

            if (phone) {
                if (!PHONE_REGEX.test(phone)) {
                    inputPhone.addClass('error');
                    errors.push('O telefone informado não é válido.');
                } else {
                    inputPhone.removeClass('error');
                }
            }

            if (errors.length) {
                for (var i in errors) {
                    toastr.warning(errors[i], 'Não foi possível prosseguir');
                }
                return;
            }

            var phoneMatch = PHONE_REGEX.exec(inputPhone.val());
            var ddd = phoneMatch[1];
            var phone = phoneMatch[2] + '-' + phoneMatch[3];

            controller.serverCommunication.call(`INSERT INTO 'kronoosAuthentication'.'${type}'`,
                controller.call('error::ajax', controller.call('loader::ajax', {
                    data: Object.assign({
                        name,
                        cpf,
                        cnpj,
                        commercialReference,
                        zipcode,
                        ddd,
                        phone
                    }, data),
                    success(domDocument) {
                        modal.close();
                        var apiKey = $('BPQL > body apiKey', domDocument).text();
                        controller.call('authentication::force', apiKey, domDocument);
                        if (callback)
                            callback(domDocument);
                    }
                })));
        });
        var actions = modal.createActions();
        actions.add('Voltar').click(e => {
            e.preventDefault();
            modal.close();
            controller.call('kronoos::create::account', callback);
        });

        actions.add('Cancelar').click(e => {
            e.preventDefault();
            modal.close();
        });
    });

    controller.registerCall('kronoos::create::account', (callback, contract, parameters = {}, type = 'Account') => {
        var modal = controller.call('modal');
        modal.fullscreen();
        modal.title('Crie sua conta Kronoos');
        modal.subtitle('Informe seu usuário e senha desejados para continuar');
        modal.addParagraph('Sua senha é secreta e recomendamos que não a revele a ninguém.');

        var form = modal.createForm();
        var inputEmail = form.addInput('email', 'email', 'E-mail').magicLabel();
        var inputPassword = form.addInput('password', 'password', 'Senha').magicLabel();
        var inputConfirmPassword = form.addInput('password-confirm', 'password', 'Confirmar Senha').magicLabel();

        var inputAgree = form.addCheckbox('agree', sprintf('Eu li e aceito o <a href="%s" target="_blank">contrato de usuário</a>.',
            contract || 'legal/kronoos/MINUTA___CONTRATO___CONTA.pdf'), false);

        form.addSubmit('login', 'Próximo Passo');

        form.element().submit(e => {
            e.preventDefault();

            var errors = [];
            var email = inputEmail.val();
            var password = inputPassword.val();
            var confirmPassword = inputConfirmPassword.val();

            if (!emailRegex().test(email)) {
                inputEmail.addClass('error');
                errors.push('O endereço de e-mail informado não é válido.');
            } else {
                inputEmail.removeClass('error');
            }

            if (!inputAgree[1].is(':checked')) {
                errors.push('Você precisa aceitar o contrato de usuário.');
            }

            if (!SAFE_PASSWORD.test(password)) {
                inputPassword.addClass('error');
                errors.push('A senha deve possuir no mínimo 6 dígitos.');
            } else if (password !== confirmPassword) {
                inputPassword.addClass('error');
                inputConfirmPassword.addClass('error');
                errors.push('A senha não confere');
            } else {
                inputPassword.removeClass('error');
                inputConfirmPassword.removeClass('error');
            }

            if (errors.length) {
                for (var i in errors) {
                    toastr.warning(errors[i], 'Não foi possível prosseguir');
                }
                return;
            }

            controller.serverCommunication.call('SELECT FROM \'HARLANAUTHENTICATION\'.\'USERNAMETAKEN\'',
                controller.call('error::ajax', controller.call('loader::ajax', {
                    data: {
                        username: email
                    },
                    success() {
                        modal.close();
                        controller.call('kronoos::create::account::one', Object.assign(parameters, {
                            username: email,
                            email,
                            password
                        }), callback, type);
                    }
                })));
        });

        var actions = modal.createActions();

        actions.add('Cancelar').click(e => {
            e.preventDefault();
            modal.close();
        });

        actions.add('Login').click(e => {
            e.preventDefault();
            modal.close();
            controller.call('kronoos::login', callback);
        });
    });

    controller.registerCall('kronoos::login', callback => {
        var modal = controller.call('modal');
        modal.fullscreen();
        modal.title('Autentique-se');
        modal.subtitle('Informe seu usuário e senha para continuar');
        modal.addParagraph('Sua senha é secreta e recomendamos que não a revele a ninguém.');

        var form = modal.createForm();
        var inputUsername = form.addInput('user', 'text', 'Usuário').magicLabel();
        var inputPassword = form.addInput('password', 'password', 'Senha').magicLabel();

        form.addSubmit('login', 'Autenticar');

        form.element().submit(e => {
            e.preventDefault();
            controller.call('authentication::authenticate', inputUsername, inputPassword, false, () => {
                modal.close();
                callback();
            });
        });

        var actions = modal.createActions();

        actions.add('Criar Conta').click(e => {
            e.preventDefault();
            controller.call('kronoos::create::account', () => {
                controller.call('kronoos::login', callback);
            });
            modal.close();
        });

        actions.add('Esqueci minha Senha').click(e => {
            e.preventDefault();
            controller.call('forgot::password', () => {
                controller.call('kronoos::login', callback);
            });
            modal.close();
        });

        actions.add('Cancelar').click(e => {
            e.preventDefault();
            modal.close();
        });
    });

    if (controller.confs.kronoos.isKronoos) {
        controller.registerCall('authentication::need', callback => {
            if (controller.serverCommunication.freeKey()) {
                controller.call('kronoos::login', callback);
                return true;
            }

            if (callback) {
                callback();
            }

            return false;
        });

        if (controller.query.createAccount) {
            controller.call('kronoos::create::account', null, controller.query.contractLocation || null,
                {}, controller.query.createAccount || 'Account');
        }
    }

};
