// @flow

const LENGTH_REGEX = /%+/g;
const JOB_REGEX = /%([^%]+)/g;

import queue from 'async/queue';
import localForage from 'localforage';
import uuid from 'uuid';

export default class Sync {

    constructor(controller) {
        this.stop = true;
        this.running = false;
        this.callbacks = [];
        this.taskCallbacks = [];
        this.controller = controller;
    }

    register(interval = 300) {
        let registerTask;
        registerTask = () => {
            if (this.stop) return;
            setTimeout(() => this.sync(registerTask), interval);
        };
        this.sync(registerTask);
    }

    unregister() {
        if (this.q) this.q.kill();
        this.q = null;
        this.stop = true;
        this.running = false;
    }

    getTasks(cb, end) {
        localForage.getItem('syncTasks', (err, syncTasks) => {
            /* Captura uma tarefa */
            if (err || !syncTasks) {
                if (end) end();
                return;
            }

            let jobs = syncTasks.match(JOB_REGEX);
            for (let job of jobs) {
                if (!job) return null;
                let jobid = job.replace(/^%/, '');
                cb(jobid, i => localForage.getItem(jobid, i));
            }
            if(end) end();
        });
    }

    queueLength(cb) {
        localForage.getItem('syncTasks', (err, syncTasks) => {
        /* Captura o tamanho da fila */
            let len;
            if (err || !syncTasks) len = 0;
            else len = (syncTasks.match(LENGTH_REGEX) || []).length;
            cb(len);
        });
    }

    sync(callback = null, taskCallback = null) {
        this.stop = false;
        if (callback) this.callbacks.push(callback);
        if (taskCallback) this.taskCallbacks.push(taskCallback);
        if (this.running) return;
        this.running = true;

        const end = () => {
            for (let cb of this.callbacks) cb();
            this.callbacks = [];
            this.taskCallbacks = [];
            this.running = false;
        };

        this.queueLength(l1 => {
            if (!l1) {
                end();
                return;
            }

            this.controller.trigger('sync::start');

            this.q = new queue(({call, jobId, parameters}, cb) => {
                this.controller.call(call, err => {
                    if (!err) {
                        this.drop(jobId, () => cb());
                    } else {
                        cb(err);
                    }
                }, ...parameters);
            }, 1);

            this.q.drain = (...args) => {
                this.controller.trigger('sync::end', args);
                end(...args);
            };

            this.getTasks((jobId, getTask) => getTask((err, job) => {
                if (err || !job) return;
                let [call, parameters] = job;
                this.q.push({
                    jobId,
                    call,
                    parameters
                }, err => {
                    for (let cb of this.taskCallbacks) cb(err);
                });
            }));
        });
    }

    drop(jobId, cb) {
        localForage.getItem('syncTasks', (err, syncTasks) => {
            if (err) {
                if (cb) cb(err);
                return;
            }
            localForage.setItem('syncTasks', syncTasks.replace(`%${jobId}`, ''), err => {
                if (err) {
                    if (cb) cb(err);
                    return;
                }
                localForage.removeItem(jobId, err => {
                    if (err) {
                        if(cb) cb(err);
                        return;
                    }
                    this.controller.trigger('sync::change');
                    if(cb) cb();
                });
            });
        });
    }

    job(call, cb, ...parameters) {
        let key = `sync-task-${uuid.v4()}`;
        localForage.setItem(key, [call, parameters], err => {
            if (err) {
                if (cb) cb(err);
                return;
            }
            localForage.getItem('syncTasks', (err, syncTasks) => {
                if (err) {
                    localForage.removeItem(key);
                    if (cb) cb(err);
                    return;
                }
                if (!syncTasks) syncTasks = '';
                syncTasks += `%${key}`;
                localForage.setItem('syncTasks', syncTasks, err => {
                    if (err) {
                        localForage.removeItem(key);
                        if (cb) cb(err);
                        return;
                    }
                    this.controller.trigger('sync::change');
                    if (cb) cb();
                });
            });
        });
    }

}
