const EMPTY_REGEX = /^\s*$/;

import assert from 'assert';
import _ from 'underscore';
import { camelCase } from 'change-case';
import async from 'async';

const FormError = Error.extend('FormError', 500);
const FormCancel = FormError.extend('FormCancel', 500);

module.exports = controller => {

    let GenerateForm = function(callback, onCancel) {
        this.onCancel = onCancel;

        let currentScreen = 0;
        let configuration = null;
        let modal = null;

        let next = () => {
            assert(configuration !== null, 'configuration required');
            ++currentScreen;
            this.display();
            return this;
        };

        let back = () => {
            assert(configuration !== null, 'configuration required');
            assert(currentScreen > 0, 'no turning back tarãrãrã');
            --currentScreen;
            this.display();
            return this;
        };

        this.configure = c => {
            assert(typeof c === 'object');
            assert(Array.isArray(c.screens));
            assert(c.screens.length > 0);
            configuration = c;
            currentScreen = 0;
            this.display();
            return this;
        };

        this.setValues = x => {
            for (let k in x) this.setValue(k, x[k]);
            return this;
        };

        this.setValue = (name, value) => {
            if (!value || EMPTY_REGEX.test(value)) {
                return;
            }

            name = camelCase(name);
            if (!configuration) {
                return;
            }

            _.each(configuration.screens, ({fields}) => {
                _.each(_.flatten(fields), field => {
                    if (camelCase(field.name) === name) {
                        if (field.type == 'file') {
                            /* can't set */
                            return;
                        }
                        if (field.type == 'checkbox') {
                            field.checked = value;
                            if (field.element) {
                                field.element.attr('checked', value);
                            }
                            return;
                        }
                        field.value = value;
                        if (field.element) {
                            if (field.numeralFormat) {
                                value = numeral(value).format(field.numeralFormat);
                            }
                            field.element.val(field.mask && field.element.masked ? field.element.masked(value) : value);
                        }
                    }
                });
            });
            return this;
        };

        let createField = (item, form, screen) => {
            if (item.type === 'checkbox') {
                let checkbox = form.addCheckbox(item.name, item.labelText, item.checked, item.value, item);
                item.element = checkbox[1];
                item.container = checkbox[0];
                item.elementLabel = checkbox[2].addClass('checkbox');
            } else if (item.type === 'select') {
                item.element = form.addSelect(item.name, item.name, item.list, item, item.labelText, item.value);
            } else if (item.type === 'textarea') {
                item.element = form.addTextarea(item.name, item.placeholder, item, item.labelText);
                if ((configuration.magicLabel || screen.magicLabel || item.magicLabel) && !item.hoverHelp) {
                    item.element.magicLabel(item.label);
                }
            } else {
                item.element = form.addInput(item.name, item.type, item.placeholder, item, item.labelText, item.value);

                if ((screen.magicLabel || item.magicLabel || configuration.magicLabel) && !item.hoverHelp) {
                    item.element.magicLabel(item.label);
                }

                if (item.mask) {
                    item.element.mask(item.mask, item.maskOptions);
                    if (item.value) {
                        let v = item.value;
                        if (item.numeralFormat) {
                            v = numeral(v).format(item.numeralFormat);
                        }
                        item.element.val(item.element.masked(v));
                    }
                }

                if (item.pikaday) {
                    item.element.pikaday();
                }

            }

            item.element.change(() => {
                if (item.validateAsync)
                    item.validateAsync((isValid) => {
                        if (!isValid) {
                            item.element.addClass('error');
                        }
                    }, item, screen, configuration, this);

                if (item.validate && !item.validate(item, screen, configuration)) {
                    item.element.addClass('error');
                }

                if (!item.optional && /^\s*$/.test(item.element.val())) {
                    item.element.val('');
                    item.element.addClass('error');
                }

            });

            if (item.disabled || screen.disabled || configuration.disabled) {
                item.element.attr('disabled', 'disabled').addClass('uinput-disabled');
            }

            if (item.builder) {
                item.builder(item);
            }

            return this;
        };

        let getValue = (input, c) => {

            if (!input.element) {
                return null; /* not defined */
            }

            if (input.getValue) {
                return input.getValue(input, c);
            }

            if (input.element.attr('type') === 'file') {
                if (!input.element.get(0).files[0]) {
                    return null;
                }

                let file = input.element.get(0).files[0];
                let result;

                let cb = r => {
                    result = r;
                };

                let reader = new FileReader();

                reader.onload = ({target}) => {
                    let r = {};
                    r[input.name] = file.name;
                    r[input.contentKey || `${input.name}@content`] = target.result;
                    cb(r);
                };

                reader.readAsText(file);

                return callback => {
                    if (result) {
                        callback(result);
                        return;
                    }
                    cb = callback;
                };
            }

            if (input.element.attr('type') === 'checkbox') {
                return input.element.get(0).checked;
            }

            if (input.element.attr('type') === 'text') {
                if (input.numeral) {
                    return numeral(input.element.val()).value();
                }
                if (input.pikaday) {
                    let m = moment(input.element.val(), controller.i18n.pikaday.format);
                    if (!m.isValid) {
                        return null;
                    }
                    return m.format('YYYY-MM-DD');
                }
            }

            return input.element.val();
        };

        this.readValues = callback => {
            let results = _.object(_.map(_.flatten(_.pluck(configuration.screens, 'fields')), input => [
                camelCase(input.name),
                getValue(input, configuration)
            ]));

            if (callback) {
                async.each(results, (v, cb) => {
                    if (typeof v ===  'function') {
                        v(values => {
                            Object.assign(results, values);
                            cb();
                        });
                        return;
                    }
                    cb();
                }, () => callback(_.pick(results, x => typeof x !== 'function')));
            }

            return results;
        };

        this.getField = name => {
            let items = _.flatten(_.pluck(configuration.screens, 'fields'));
            for (let i in items) {
                if (items[i].name == name) {
                    return items[i];
                }
            }
            return null;
        };

        this.display = (setScreen) => {
            if (typeof setScreen !== 'undefined') {
                currentScreen = setScreen;
            }

            if (modal) {
                modal.close();
                modal = null;
            }

            modal = controller.call('modal');
            let screen = configuration.screens[currentScreen];

            let gamification = screen.gamification || configuration.gamification;
            if (gamification) {
                modal.gamification(gamification);
            }

            modal.title(screen.title || configuration.title);
            modal.subtitle(screen.subtitle || configuration.subtitle);

            let paragraph = screen.paragraph || configuration.paragraph;
            if (paragraph) {
                modal.addParagraph(paragraph);
            }

            let form = modal.createForm();

            form.element().submit(e => {
                e.preventDefault();

                (screen.validate || this.defaultScreenValidation)((validInput) => {
                    if (!validInput) {
                        return;
                    }

                    if (currentScreen + 1 < configuration.screens.length) {
                        next();
                    } else {
                        this.readValues(callback);
                        if (modal) {
                            modal.close();
                        }
                    }
                }, configuration, screen, this);

            });

            for (let i in screen.fields) {
                let field = screen.fields[i];
                if (Array.isArray(field)) {
                    let multifield = form.multiField();
                    for (let n in field) {
                        field[n].append = multifield;
                        field[n].labelPosition = 'before';
                        createField(field[n], form, screen);
                    }
                } else createField(field, form, screen);
            }

            form.addSubmit('next', screen.nextButton || (currentScreen + 1 < configuration.screens.length ?
                controller.i18n.system.next() : controller.i18n.system.finish()));

            let actions = modal.createActions();

            if (screen.observations) {
                _.each(_.filter(screen.observations), i => actions.observation(i));
            }

            if (screen.actions) {
                _.each(screen.actions, i => {
                    let [name, action] = i;
                    actions.add(name).click(e => {
                        e.preventDefault();
                        action(modal);
                    });
                });
            }

            if (currentScreen - 1 >= 0) {
                actions.add(controller.i18n.system.back()).click(e => {
                    e.preventDefault();
                    back();
                });
            }

            /* Cancelar */
            actions.add(controller.i18n.system.cancel()).click(e => {
                e.preventDefault();
                this.close();
            });

            this.actions = actions;

            return this;
        };

        this.close = (defaultAction = true) => {
            if (this.onCancel && defaultAction) this.onCancel();
            if (this.onClose) this.onClose();
            if (modal) {
                modal.close();
            }
        };

        this.defaultScreenValidation = (callback, configuration, screen) => {
            let ret = true;
            async.each(_.flatten(screen.fields), (item, callback) => {

                if (item.validateAsync) {
                    let callbackEnveloped = callback;
                    callback = () => {
                        item.validateAsync(valid => {
                            if (!valid) ret = false;
                            callbackEnveloped();
                        }, item, screen, configuration);
                    };
                }

                if (item.validate && !item.validate(item, screen, configuration)) {
                    item.element.addClass('error');
                    ret = false;
                    callback();
                    return;
                }

                if (!item.optional && !configuration.readOnly) {
                    if (item.element.attr('type') === 'checkbox') {
                        if (!item.element.is(':checked')) {
                            $(`label[for='${item.element.attr('id')}']`).addClass('error');
                            ret = false;
                            callback();
                            return;
                        }
                    } else if (/^\s*$/.test(item.element.val())) {
                        item.element.addClass('error');
                        ret = false;
                        callback();
                        return;
                    }
                }

                callback();
            }, () => callback(ret));
        };

        return this;
    };

    controller.registerCall('form', (...parameters) => new GenerateForm(...parameters));

    const defaultOnCancel = () => {
        throw new FormCancel();
    };

    controller.registerCall('form::callback', (...args) => {
        const callback = args.pop();
        const onCancel = args.pop();
        const configuration = args.shift();
        const values = args.shift();

        let form = new GenerateForm(callback, onCancel || defaultOnCancel);
        if (configuration) form.configure(configuration);
        if (values) form.setValues(values);
    });

};
