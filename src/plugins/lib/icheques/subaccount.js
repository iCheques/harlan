module.exports = controller => {

    controller.endpoint.subaccountCreate = 'INSERT INTO \'IChequesProfile\'.\'SUBACCOUNT\'';

    controller.call('subaccount::form::description', {
        title: 'Criação de Subconta',
        subtitle: 'Preencha os dados abaixo.',
        paragraph: 'As subchaves possibilitam você trabalhar em um cadastro independente.',
        gamification: 'star',
        screens: [
            {
                magicLabel: true,
                fields: [
                    [{
                        name: 'name',
                        type: 'text',
                        placeholder: 'Nome do Responsável (opcional)',
                        optional: true,
                        labelText: 'Nome do Responsável'
                    },
                    {
                        name: 'zipcode',
                        type: 'text',
                        placeholder: 'CEP (opcional)',
                        optional: true,
                        labelText: 'CEP',
                        mask: '00000-000'
                    }],
                    [{
                        name: 'email',
                        type: 'text',
                        placeholder: 'E-mail',
                        optional: false,
                        labelText: 'E-mail'
                    },
                    {
                        name: 'phone',
                        type: 'text',
                        placeholder: 'Telefone (opcional)',
                        labelText: 'Telefone',
                        mask: '(00) 0000-00009',
                        optional: true
                    }],
                    [{
                        name: 'password',
                        type: 'password',
                        placeholder: 'Senha',
                        labelText: 'Senha',
                        optional: false
                    },
                    {
                        name: 'repeat-password',
                        type: 'password',
                        placeholder: 'Repita sua Senha',
                        labelText: 'Repita sua Senha',
                        optional: false
                    }]
                ]
            }
        ]
    });

};
