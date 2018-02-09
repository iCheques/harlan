import _ from 'underscore';
import {CPF,CNPJ} from 'cpf_cnpj';
const banks = ((() => {
    const obj = {
        246 : '246 - Banco ABC Brasil S.A.',
        25 : '25 - Banco Alfa S.A.',
        641 : '641 - Banco Alvorada S.A.',
        29 : '29 - Banco Banerj S.A.',
        0 : '0 - Banco Bankpar S.A.',
        740 : '740 - Banco Barclays S.A.',
        107 : '107 - Banco BBM S.A.',
        739 : '739 - Banco BGN S.A.',
        96 : '96 - Banco BM&F de Serviços de Liquidação e Custódia S.A',
        318 : '318 - Banco BMG S.A.',
        752 : '752 - Banco BNP Paribas Brasil S.A.',
        248 : '248 - Banco Boavista Interatlântico S.A.',
        218 : '218 - Banco Bonsucesso S.A.',
        36 : '36 - Banco Bradesco BBI S.A.',
        204 : '204 - Banco Bradesco Cartões S.A.',
        394 : '394 - Banco Bradesco Financiamentos S.A.',
        237 : '237 - Banco Bradesco S.A.',
        225 : '225 - Banco Brascan S.A.',
        208 : '208 - Banco BTG Pactual S.A.',
        44 : '44 - Banco BVA S.A.',
        263 : '263 - Banco Cacique S.A.',
        473 : '473 - Banco Caixa Geral',
        40 : '40 - Banco Cargill S.A.',
        745 : '745 - Banco Citibank S.A. – Brasil S.A.',
        215 : '215 - Banco Comercial e de Investimento Sudameris S.A.',
        756 : '756 - Banco Cooperativo do Brasil S.A. (BANCOOB – SICOOB)',
        748 : '748 - Banco Cooperativo Sicredi S.A.',
        222 : '222 - Banco Credit Agricole Brasil S.A.',
        3 : '3 - Banco da Amazônia S.A.',
        707 : '707 - Banco Daycoval S.A.',
        '(M06)000' : '000 - Banco de Lage Landen Brasil S.A.',
        24 : '24 - Banco de Pernambuco S.A.',
        456 : '456 - Banco de Tokyo-Mitsubishi UFJ Brasil S.A.',
        214 : '214 - Banco Dibens S.A.',
        1 : '1 - Banco do Brasil S.A.',
        47 : '47 - Banco do Estado de Sergipe S.A.',
        37 : '37 - Banco do Estado do Pará S.A.',
        41 : '41 - Banco do Estado do Rio Grande do Sul S.A.',
        4 : '4 - Banco do Nordeste do Brasil S.A.',
        265 : '265 - Banco Fator S.A.',
        '(M03)000' : '000 - Banco Fiat S.A.',
        224 : '224 - Banco Fibra S.A.',
        626 : '626 - Banco Ficsa S.A.',
        '(M18)024' : '024 - Banco Ford S.A. – BANDEPE',
        233 : '233 - Banco GE Capital S.A.',
        '(M07)000' : '000 - Banco GMAC S.A.',
        612 : '612 - Banco Guanabara S.A.',
        '(M22)000' : '000 - Banco Honda S.A.',
        63 : '63 - Banco Ibi S.A. Banco Múltiplo',
        '(M11)000' : '000 - Banco IBM S.A.',
        604 : '604 - Banco Industrial do Brasil S.A.',
        320 : '320 - Banco Industrial e Comercial S.A.',
        653 : '653 - Banco Indusval S.A.',
        249 : '249 - Banco Investcred Unibanco S.A.',
        376 : '376 - Banco J. P. Morgan S.A.',
        74 : '74 - Banco J. Safra S.A.',
        217 : '217 - Banco John Deere S.A.',
        65 : '65 - Banco Lemon S.A.',
        600 : '600 - Banco Luso Brasileiro S.A.',
        389 : '389 - Banco Mercantil do Brasil S.A.',
        755 : '755 - Banco Merrill Lynch de Investimentos S.A.',
        746 : '746 - Banco Modal S.A.',
        45 : '45 - Banco Opportunity S.A.',
        623 : '623 - Banco PAN S.A.',
        611 : '611 - Banco Paulista S.A.',
        643 : '643 - Banco Pine S.A.',
        638 : '638 - Banco Prosper S.A.',
        747 : '747 - Banco Rabobank International Brasil S.A.',
        633 : '633 - Banco Rendimento S.A.',
        '(M16)120' : '120 - Banco Rodobens S.A.',
        72 : '72 - Banco Rural Mais S.A.',
        453 : '453 - Banco Rural S.A.',
        422 : '422 - Banco Safra S.A.',
        33 : '33 - Banco Santander (Brasil) S.A.',
        250 : '250 - Banco Schahin S.A.',
        749 : '749 - Banco Simples S.A.',
        366 : '366 - Banco Société Générale Brasil S.A.',
        637 : '637 - Banco Sofisa S.A.',
        12 : '12 - Banco Standard de Investimentos S.A.',
        464 : '464 - Banco Sumitomo Mitsui Brasileiro S.A.',
        ' M20000' : '000 - Banco Toyota do Brasil S.A.',
        634 : '634 - Banco Triângulo S.A.',
        '(M14)000' : '000 - Banco Volkswagen S.A.',
        '(M23)000' : '000 - Banco Volvo (Brasil) S.A.',
        655 : '655 - Banco Votorantim S.A.',
        610 : '610 - Banco VR S.A.',
        21 : '21 - BANESTES S.A. Banco do Estado do Espírito Santo',
        719 : '719 - Banif-Banco Internacional do Funchal (Brasil)S.A.',
        73 : '73 - BB Banco Popular do Brasil S.A.',
        78 : '78 - BES Investimento do Brasil S.A. – Banco de Investimento – BBI',
        69 : '69 - BPN Brasil Banco Múltiplo S.A.',
        70 : '70 - BRB – Banco de Brasília S.A.',
        104 : '104 - Caixa Econômica Federal',
        477 : '477 - Citibank N.A.',
        '081-7' : '081-7 - Concórdia Banco S.A.',
        487 : '487 - Deutsche Bank S.A. – Banco Múltiplo',
        751 : '751 - Dresdner Bank Brasil S.A. – União de Bancos Brasileiros S.A.',
        64 : '64 - Goldman Sachs do Brasil Banco Múltiplo S.A.',
        62 : '62 - Hipercard Banco Múltiplo S.A.',
        399 : '399 - HSBC Bank Brasil S.A.',
        492 : '492 - ING Bank N.V.',
        652 : '652 - Itaú Unibanco Holding S.A.',
        341 : '341 - Itaú Unibanco S.A.',
        409 : '409 - UNIBANCO',
        230 : '230 - Unicard Banco Múltiplo S.A.',
    };

    const keys = _.sortBy(_.keys(obj));
    return _.object(keys, _.map(keys, key => obj[key]));
}))();

module.exports = controller => {

    const defaultCallback = () => {
        controller.alert({
            icon: 'pass',
            title: 'Os dados bancários foram atualizados com sucesso.',
            subtitle: 'O sistema agora poderá depositar automáticamente valores na conta-corrente informada.',
            paragraph: 'Os dados bancários são necessários para que possamos depositar valores nas contas dos clientes.',
        });
    };

    controller.registerCall('bank::account::need', callback => {
        if (!controller.confs.user.bankAccount) {
            controller.call('billing::information::need', () => {
                controller.call('bank::account::update', callback);
            });
        } else {
            callback();
        }
    });

    controller.registerCall('bank::account::update', (callback, bank, endpoint, parameters = {}, formData = {}) => {

        callback = callback || defaultCallback;

        bank = bank || controller.confs.user.bankAccount || ['', '', ''];
        let form = controller.call('form', opts => {
            controller.serverCommunication.call(endpoint || 'UPDATE \'HARLAN\'.\'bankAccount\'',
                controller.call('error::ajax', controller.call('loader::ajax', {
                    dataType: 'json',
                    data: Object.assign({}, opts, parameters),
                    success: () => {
                        callback();
                    }
                }, true)));
        });
        const documento = formData.documento || controller.confs.user.cnpj || controller.confs.user.cpf;
        form.configure({
            title: formData.title || 'Seus Dados Bancários',
            subtitle: formData.subtitle || 'Preencha os seus dados bancários para depósito em conta.',
            gamification: 'magicWand',
            paragraph: formData.paragraph || 'É fundamental que o documento da conta para depósito seja o mesmo cadastrado em nosso sistema.',
            screens: [{
                magicLabel: true,
                fields: [[{
                    name: 'name',
                    optional: false,
                    type: 'text',
                    value: formData.nome || controller.confs.user.nome || controller.confs.user.responsavel,
                    disabled: true,
                    placeholder: 'Nome',
                }, {
                    name: 'name',
                    optional: false,
                    type: 'text',
                    value: documento ? (CNPJ.isValid(documento) ? CNPJ.format(documento) : CPF.format(documento)) : undefined,
                    disabled: true,
                    placeholder: 'Documento',
                }], {
                    name: 'bank',
                    optional: false,
                    type: 'select',
                    value: bank[0] || '',
                    magicLabel: false,
                    label: false,
                    placeholder: 'Banco',
                    list: banks
                }, [{
                    name: 'ag',
                    optional: false,
                    type: 'text',
                    numeral: true,
                    value: bank[1],
                    placeholder: 'Agência',
                    mask: '0000'
                }, {
                    name: 'acc',
                    value: bank[2],
                    type: 'text',
                    optional: false,
                    mask: '99999999990-0',
                    placeholder: 'Conta Corrente',
                    maskOptions: {
                        reverse: true
                    }
                }]]
            }
            ]});
    });

};
