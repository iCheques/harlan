module.exports = controller => {
    controller.registerTrigger('find::database::table::rfb::certidao', 'receitaCertidao::form', ({dom}, callback) => {
        dom.find('input[name=\'nascimento\']').mask('00/00/0000');
        callback();
    });
};
