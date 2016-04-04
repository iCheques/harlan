var changeCase = require("change-case");
var uniqid = require("uniqid");

module.exports = (controller) => {

    controller.registerCall("admin::remove::phone", (element, section, username, ddd, phone, pabx) => {
        element.addClass("can-remove").click((e) => {
            e.preventDefault();
            controller.call("confirm", {
                title: "Deseja realmente remover este telefone?"
            }, () => {
                controller.serverCommunication.call("DELETE FROM 'BIPBOPCOMPANYS'.'PHONE'", {
                    data: {
                        username: username,
                        ddd: ddd,
                        phone: phone,
                        pabx: pabx
                    },
                    success: (response) => {
                        controller.call("admin::viewCompany", $(response).find("BPQL > body > company"), section, "replaceWith");
                    }
                });
            });
        });
    });

    controller.registerCall("admin::remove::email", (element, section, username, email) => {
        element.addClass("can-remove").click((e) => {
            e.preventDefault();
            controller.call("confirm", {
                title: "Deseja realmente remover este email?"
            }, () => {
                controller.serverCommunication.call("DELETE FROM 'BIPBOPCOMPANYS'.'EMAIL'", {
                    data: {
                        username: username,
                        email: email
                    },
                    success: (response) => {
                        controller.call("admin::viewCompany", $(response).find("BPQL > body > company"), section, "replaceWith");
                    }
                });
            });
        });
    });

    controller.registerCall("admin::viewCompany", function(companyNode, element, method, minimized) {

        var company = $(companyNode);

        var name = company.children("nome").text(),
            username = company.children("username").text(),
            cnpj = company.children("cnpj").text(),
            cpf = company.children("cpf").text(),
            responsible = company.children("responsavel").text(),
            commercialReference = company.children("commercialReference").text(),
            credits = parseInt(company.children("credits").text());

        var [section, results, actions] = controller.call("section",
            `Administração ${name || username}`,
            `Conta registrada para documento ${cnpj || cpf || username}`,
            `Visualizar, editar e controlar`, false, minimized);

        section.addClass("admin-company");

        /* We live in citys we never seen in screen */
        var result = controller.call("result");

        if (name) result.addItem("Assinante", name);
        if (cnpj) result.addItem("CNPJ", cnpj);
        if (responsible) result.addItem("Responsável", responsible);
        if (cpf) result.addItem("CPF", cpf);
        if (credits) result.addItem("Créditos Sistema", numeral(credits / 100.).format('$0,0.00'));
        if (commercialReference) result.addItem("Referência Comercial", commercialReference);

        var inputApiKey = result.addItem("Chave de API", company.children("apiKey").text());
        result.addItem("Usuário", username);
        result.addItem("Contrato Aceito", company.children("contractAccepted").text() == "true" ? "Aceito" : "Não Aceito");

        var isActive = company.children("status").text() === "1",
            activeLabel = result.addItem("Situação", isActive ? "Ativo" : "Bloqueado");

        if (!isActive) {
            section.addClass("inactive");
        }

        var phones = company.children("telefone").children("telefone");
        if (phones.length) {
            result.addSeparator("Telefones",
                "Lista de Telefones para Contato",
                "O telefone deve ser usado apenas para emergências e tratativas comerciais.");

            var [ddd, phone, pabx, name, kind] = [
                phones.children("telefone:eq(0)").text(),
                phones.children("telefone:eq(1)").text(),
                phones.children("telefone:eq(2)").text(),
                phones.children("telefone:eq(3)").text(),
                phones.children("telefone:eq(4)").text()
            ];

            controller.call("admin::remove::phone", result.addItem(`${name} - ${kind}`, `(${ddd}) ${phone} ${pabx}`),
                section, username, ddd, phone, pabx);
        }

        var endereco = company.children("endereco");
        if (endereco.length) {
            result.addSeparator("Endereço",
                "Endereço registrado para emissão de faturas",
                "As notas fiscais e faturas são enviadas para este endereço cadastrado, se certifique que esteja atualizado.");

            var appendAddressItem = (item, value) => {
                if (value) {
                    return result.addItem(item, value);
                }
                return null;
            };

            appendAddressItem("Endereço", endereco.find("endereco:eq(0)").text());
            appendAddressItem("Número", endereco.find("endereco:eq(1)").text());
            appendAddressItem("Complemento", endereco.find("endereco:eq(2)").text());
            appendAddressItem("Bairro", endereco.find("endereco:eq(3)").text());
            appendAddressItem("Cidade", endereco.find("endereco:eq(5)").text());
            appendAddressItem("CEP", endereco.find("endereco:eq(4)").text());
            appendAddressItem("Estado", endereco.find("endereco:eq(6)").text());

        }

        result.addSeparator("Contrato",
            "Informações do Serviço Contratado",
            "Informações referentes ao contrato comercial estabelecido entre as partes.");

        var contrato = company.children("contrato");
        appendAddressItem("Dia Vencimento", contrato.find("contrato:eq(0)").text());
        appendAddressItem("Valor", numeral(parseFloat(contrato.find("contrato:eq(1)").text())).format('$0,0.00'));
        appendAddressItem("Pacote de Consultas", contrato.find("contrato:eq(2)").text());
        appendAddressItem("Valor da Consulta Excedente", numeral(parseFloat(contrato.find("contrato:eq(3)").text())).format('$0,0.00'));
        appendAddressItem("Tipo do Contrato", changeCase.titleCase(contrato.find("contrato:eq(4)").text()));
        appendAddressItem("Criação", moment.unix(parseInt(contrato.find("contrato:eq(5)").text())).fromNow());

        var emails = company.children("email").children("email");
        if (emails.length) {
            result.addSeparator("Endereços de Email",
                "Endereços de e-mail registrados",
                "As notificações geradas pelo sistema são enviadas para estes e-mails.");

            emails.each(function(idx, value) {
                var email = $("email:eq(0)", value).text();
                controller.call("admin::remove::email", result.addItem($("email:eq(1)", value).text(), email),
                    section, username, email);
            });
        }

        results.append(result.element());

        if (element !== false) {
            /* element can be undefined or null, false mean it will return only */
            (element || $(".app-content"))[method || "append"](section);
        }

        var lockSymbol = $("<i />").addClass("fa").addClass(isActive ? "fa-lock" : "fa-unlock-alt"),
            lockProcess = false,
            doLocking = (e) => {
                e.preventDefault();
                if (lockProcess) {
                    return;
                }
                controller.serverCommunication.call("UPDATE 'BIPBOPCOMPANYS'.'STATUS'",
                    controller.call("error::ajax", controller.call("loader::ajax", {
                        data: {
                            account: username,
                            set: !isActive ? 1 : 0,
                        },
                        success: function() {
                            isActive = !isActive;
                            activeLabel.find(".value").text(isActive ? "Ativo" : "Bloqueado");
                            section[isActive ? "removeClass" : "addClass"]("inactive");
                            lockSymbol
                                .removeClass("fa-unlock-alt")
                                .removeClass("fa-lock")
                                .addClass(isActive ? "fa-lock" : "fa-unlock-alt");
                        }
                    })));
            };

        var showInterval = setInterval(() => {
            if (!document.contains(actions.get(0)) || !$(actions).is(':visible')) {
                return;
            }
            clearInterval(showInterval);

            controller.call("tooltip", actions, "Editar").append($("<i />").addClass("fa fa-edit")).click((e) => {
                e.preventDefault();
                controller.call("admin::changeCompany", companyNode, username, section);
            });

            controller.call("tooltip", actions, "Editar Contrato").append($("<i />").addClass("fa fa-briefcase")).click((e) => {
                e.preventDefault();
                controller.call("admin::changeContract", companyNode, username, section);
            });

            controller.call("tooltip", actions, "Editar Endereço").append($("<i />").addClass("fa fa-map")).click((e) => {
                e.preventDefault();
                controller.call("admin::changeAddress", companyNode, username, section);
            });

            controller.call("tooltip", actions, "Nova Chave API").append($("<i />").addClass("fa fa-key")).click((e) => {
                controller.call("confirm", {}, () => {
                    controller.serverCommunication.call("UPDATE 'BIPBOPCOMPANYS'.'APIKEY'",
                        controller.call("error::ajax", controller.call("loader::ajax", {
                            data: {
                                username: username
                            },
                            success: function(ret) {
                                inputApiKey.find(".value").text($("BPQL > body > apiKey", ret).text());
                            }
                        })));
                });
            });

            controller.call("tooltip", actions, "Nova Senha").append($("<i />").addClass("fa fa-asterisk")).click((e) => {
                e.preventDefault();
                controller.call("admin::changePassword", username);
            });

            controller.call("tooltip", actions, "Bloquear/Desbloquear").append(lockSymbol).click(doLocking);

            controller.call("tooltip", actions, "Adicionar E-mail").append($("<i />").addClass("fa fa-at")).click((e) => {
                e.preventDefault();
                controller.call("admin::email", username, section);
            });

            controller.call("tooltip", actions, "Adicionar Telefone").append($("<i />").addClass("fa fa-phone")).click((e) => {
                e.preventDefault();
                controller.call("admin::phone", username, section);
            });

            controller.call("tooltip", actions, "Consumo").append($("<i />").addClass("fa fa-tasks")).click((e) => {
                e.preventDefault();
                var unregister = $.bipbopLoader.register();
                controller.call("admin::report", (report) => {
                    report.gamification("lives");

                    $('html, body').animate({
                        scrollTop: report.element().offset().top
                    }, 2000);

                    unregister();
                }, results, username, undefined, undefined, undefined, "after", true);
            });
        }, 200);

        return section;
    });
};
