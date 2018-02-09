import emailRegex from 'email-regex';

module.exports = controller => {

    controller.registerCall('buyit', () => {
        const modal = controller.call('modal');
        modal.title('Adquira-já!');
        modal.subtitle('Você ainda não comprou o Harlan?');
        modal.addParagraph('A funcionalidade que você esta tentando acessar é exclusiva para usuários, caso você ainda não seja basta assinar na página da BIPBOP.');
        const form = modal.createForm();
        form.element().submit(e => {
            e.preventDefault();
            controller.call('bipbop::create::account');
            modal.close();
        });

        form.addSubmit('buy', 'Adquirir');
        form.addSubmit('cancel', 'Sair').click(e => {
            e.preventDefault();
            modal.close();
        });
    });

    controller.registerTrigger('authentication::authenticated', 'welcomeScreen::authenticated', (args, callback) => {
        callback();
        if (!localStorage.welcome) {
            controller.call(controller.serverCommunication.freeKey() ? 'welcomescreen::email' : 'welcomescreen::wizard');
            localStorage.welcome = true;
        }
    });

    const createModal = modal => {
        if (!modal) {
            modal = controller.call('modal');
            modal.title('Conheça o Harlan');
        }
        return modal;
    };

    const deleteElements = elements => {
        for (const i in elements)
            elements[i].remove();
    };

    const nextBack = (modal, nextFnc, backFnc, elements) => {
        const form = modal.createForm();
        form.element().submit(e => {
            e.preventDefault();
            nextFnc();
        });
        form.addSubmit('next', 'Próximo');
        form.addSubmit('back', 'Voltar').click(e => {
            e.preventDefault();
            backFnc();
        });
        elements.push(form.element());
    };

    controller.registerCall('welcomescreen::wizard', modal => {
        modal = createModal(modal);
        const elements = [];
        elements.push(modal.subtitle('Segurança para sua governança cadastral.'));
        elements.push(modal.imageParagraph('/images/wizard_1.svg', 'Conectar seus cadastros na nuvem permite você que fique sempre atento quando uma informação mudar, saiba sempre a situação de seus clientes e fornecedores para realizar seus negócios com segurança.', null, null));
        nextBack(modal, () => {
            deleteElements(elements);
            controller.call('welcomescreen::wizard::one', modal);
        }, () => {
            deleteElements(elements);
            controller.call('welcomescreen::email', modal);
        }, elements);
    });

    controller.registerCall('welcomescreen::wizard::one', modal => {
        modal = createModal(modal);
        const elements = [];
        elements.push(modal.subtitle('Acompanhe a evolução e o risco.'));
        elements.push(modal.imageParagraph('/images/wizard_2.svg', 'Acompanhe em tempo real e evolução e o risco de seus cadastros, se mantenha informado de eventuais problemas com nosso PUSH que permite receber atualizações onde quer quer você esteja.', null, null));
        nextBack(modal, () => {
            deleteElements(elements);
            controller.call('welcomescreen::wizard::two', modal);
        }, () => {
            deleteElements(elements);
            controller.call('welcomescreen::wizard', modal);
        }, elements);
    });

    controller.registerCall('welcomescreen::wizard::two', modal => {
        modal = createModal(modal);
        const elements = [];
        elements.push(modal.subtitle('Sistema open-source e modular.'));
        elements.push(modal.imageParagraph('/images/wizard_3.svg', 'Nosso sistema é aberto, permite ajustes e informações de terceiros, para se integrar basta adicionar sua fonte no Marketplace BIPBOP ou se desejar criar um módulo para nossa ferramenta basta adicionar um JavaScript, simples e fácil.', null, null));
        nextBack(modal, () => {
            modal.close();
        }, () => {
            deleteElements(elements);
            controller.call('welcomescreen::wizard::one', modal);
        }, elements);
    });

    controller.registerCall('welcomescreen::putemail', modal => {
        modal = createModal(modal);

        const elements = [];

        elements.push(modal.subtitle('Uma nova experiência em busca cadastral.'));
        elements.push(modal.addParagraph('Harlan é a ferramenta que conecta seus cadastros e relatórios na nuvem e te avisa se algum acoisa mudar, como o endereço de todos os seus clientes. Fique sabendo o que aconteceu na hora que aconteceu, não permita que cadastros desatualizados atrapalhem para seu negócio, conheça o Harlan preenchendo seu e-mail agora.'));

        const form = modal.createForm();
        elements.push(form.element());

        const inputEmailAddress = form.addInput('email-address', 'text', 'Qual seu endereço de e-mail?');

        form.addSubmit('submit', 'Próximo');

        form.element().submit(e => {
            e.preventDefault();
            const email = inputEmailAddress.val();
            if (!emailRegex().test(email)) {
                inputEmailAddress.addClass('error');
                toastr.warning('Seu endereço de email não parece ser válido.', 'Endereço de email inválido.');
                return;
            }

            controller.serverCommunication.call('INSERT INTO \'HARLANMAILLIST\'.\'Addresses\'', {
                data: {
                    address: email
                }
            });

            deleteElements(elements);
            controller.call('welcomescreen::wizard', modal);
        });

    });

    controller.registerCall('welcomescreen::email', modal => {
        modal = createModal(modal);

        const elements = [];
        elements.push(modal.subtitle('Uma nova experiência em busca cadastral.'));
        elements.push(modal.addParagraph('Harlan é a ferramenta que conecta seus cadastros e relatórios na nuvem e te avisa se algum acoisa mudar, como o endereço de todos os seus clientes. Fique sabendo o que aconteceu na hora que aconteceu, não permita que cadastros desatualizados atrapalhem para seu negócio, conheça o Harlan preenchendo seu e-mail agora.'));

        const form = modal.createForm();
        elements.push(form.element());

        const submitForm = name => e => {
            e.preventDefault();
            controller.call('oauth::call', [name, null, () => {
                toastr.warning('Não foi possível autenticar, tente novamente.');
            }, () => {
                deleteElements(elements);
                controller.call('welcomescreen::wizard', modal);
            }]);
        };

        form.addSubmit('submit', 'Usar a conta Google').click(submitForm('google'));
        form.addSubmit('submit', 'Usar a conta LinkedIn').click(submitForm('linkedin2'));

        form.addSubmit('submit', 'Usar minha conta de e-mail.').removeClass('button').addClass('link').click(e => {
            e.preventDefault();
            deleteElements(elements);
            controller.call('welcomescreen::putemail', modal);
        });
    });

};
