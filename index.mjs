'use strict';
import chalk from 'chalk';

import SemantrisAPI from './api';
import SemantrisGameState from './state';
import SemantrisGameUpdater from './updater';
import {GAMEMODE_ARCADE, GAMEMODE_BLOCKS} from './define';
import * as util from './util';


class Semantris {
    constructor(updater = SemantrisGameUpdater) {
        this.api = new SemantrisAPI('curated23', 'SqYg6-xZ44vb_Z4');
        this.updater = updater;
        this.words = null;
        this.state = null;
    }

    reset() {
        this.state = null;
        return this;
    }

    async update(action, ...args) {
        args.unshift(this.state);
        const {next, feedback} = this.updater[action].apply(this.updater, args);

        console.log(chalk.yellow("update(" + action + ")") + " => " +
                    chalk.magenta(feedback));
        
        this.state = next;
        return feedback;
    }

    async start(gameMode = GAMEMODE_ARCADE) {
        this.words = await this.api.start(gameMode);

        return await this.reset(gameMode);
    }

    async reset(gameMode = GAMEMODE_ARCADE) {
        const feedback = await this.reset().update('init', gameMode, this.selectWords.bind(this));
        this.view(feedback);
        this._mainLoop().then(); // 初期化が終わったらメインループ開始
        
        return this;
    }

    async _mainLoop() {
        let feedback;
        while (feedback !== SemantrisGameUpdater.FB_TICK_DIE) {
            await util.sleep(16);
            feedback = this.update('tick');
            this.view(feedback);
        }
    }

    async input(input) {
        const matchResult = await this.api.rank(input,
                                    ...this.state.paramsForRank);
        const feedback = await this.update('input', matchResult);
        this.view(feedback);
    }

    view(feedback) {
        if (feedback === SemantrisGameUpdater.FB_TICK) {

        }
        // process.stdout.write('\x1b[2J');
        // process.stdout.write('\x1b[0f');

        for (let i = this.state.candidates.length - 1; i >= 0; --i) {
            const e = this.state.candidates[i];
            if (this.state.targetIndexes.includes(i)) {
                console.log(chalk.blue(e.word));
            } else {
                console.log(e.word);
            }

            if (this.state.targetBorder === i) {
                console.log("----------------------");
            }
        }

        // feedback に応じた演出・ウェイト
        switch (feedback) {
            case SemantrisGameUpdater.FB_INPUT_FAIL:
                break;
            case SemantrisGameUpdater.FB_INPUT_SUCCESS:
            case SemantrisGameUpdater.FB_DESTROY_NORMAL:
                break;
            case SemantrisGameUpdater.FB_DESTROY_STREAK:
                break;
            default:
                break;
        }

        process.stdout.write('\n> '); // prompt
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

new Semantris().start().then(async (game) => {
    for (let input;;) {
        try {
            input = await util.line();
        } catch (e) {
            console.log("(exit)");
            break;
        }
        if (game.state.isGameOver) {
            console.log("");
            console.log(chalk.red('GAME OVER'));
            console.log(chalk.green('SCORE = ' + game.state.score));
            break;
        }
        if (input) {
            await game.input(input);
        } else {
            game.view();
        }
    }
});