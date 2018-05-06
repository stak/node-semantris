'use strict';
import SemantrisAPI from './api';
import SemantrisGameState from './state';
import SemantrisGameUpdater from './updater';
import SemantrisParamTuner from './paramTuner';
import ttyRenderer from './ttyRenderer';
import {FB, GAMEMODE_ARCADE, GAMEMODE_BLOCKS} from './define';
import * as util from './util';

export default class Semantris {
    constructor(renderer = ttyRenderer, updater = SemantrisGameUpdater, tuner = SemantrisParamTuner) {
        this.api = new SemantrisAPI();
        this.renderer = renderer;
        this.updater = new updater({
            paramTuner: tuner,
            wordSelector: this.selectWord.bind(this)
        });
        this.words = null;
        this.state = null;
        this.connecting = false;
    }

    update(action, ...args) {
        args.unshift(this.state);
        const {next, feedback} = this.updater[action].apply(this.updater, args);

        this.state = next;
        return feedback;
    }

    async start(gameMode = GAMEMODE_ARCADE) {
        this.connecting = true;
        this.words = await this.api.start(gameMode);
        this.connecting = false;

        return this.reset(gameMode);
    }

    reset(gameMode = GAMEMODE_ARCADE) {
        this.state = null;
        const feedback = this.update('init', gameMode);
        this.renderer(this.state, 'init', feedback);
        this._mainLoop().then(); // 初期化が終わったらメインループ開始
        
        return this;
    }

    async _mainLoop() {
        let feedback;
        while (feedback !== FB.TICK_DIE) {
            await util.sleep(16);
            if (this.connecting) {
                continue; // 通信中は tick しない
            }
            feedback = this.update('tick');
            this.renderer(this.state, 'tick', feedback);
        }
    }

    async input(input) {
        this.connecting = true;
        // TODO: 
        const matchResult = await this.api.rank(input,
                                    ...this.state.paramsForRank);
        this.connecting = false;

        const feedback = this.update('input', matchResult);
        this.renderer(this.state, 'input', feedback);
    }

    filterWord(levels, excludes = []) {
        let words = this.words;
        if (typeof levels === 'number') {
            words = words.filter(w => w.level === levels);
        } else if (levels instanceof Array) {
            words = words.filter(w => levels.includes(w.level));
        }
        if (excludes instanceof Array && excludes.length) {
            words = words.filter(w => excludes.every(
                                 e => e.word !== w.word));
        }
        return words;
    }
    selectWord(levels, excludes = []) {
        const words = this.filterWord(levels, excludes);
        return util.getRandomElement(words);
    }
    selectWords(num, levels, excludes = []) {
        const words = this.filterWord(levels, excludes);
        return util.getRandomElements(words, num);
    }
}
