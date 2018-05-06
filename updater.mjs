import SemantrisGameState from './state';

class UpdateResult {
    constructor(next, feedback) {
        this.next = next;
        this.feedback = feedback;
    }
}
function _(next, feedback) {
    return new UpdateResult(next, feedback);
}

class SemantrisGameUpdater {
    static get FB_INIT() { return 'init'; }
    static get FB_DESTROY_FINISH() { return 'destroyed'; }
    static get FB_DESTROY_NORMAL() { return 'destroy'; }
    static get FB_DESTROY_STREAK() { return 'streak'; }
    static get FB_INPUT_SUCCESS() { return 'success'; }
    static get FB_INPUT_FAIL() { return 'fail'; }
    static get FB_TICK() { return 'tick'; }
    static get FB_TICK_FILL() { return 'fill'; }
    static get FB_TICK_FALL() { return 'fall'; }
    static get FB_TICK_DIE() { return 'die'; }

    static init(state, gameMode, wordSelector) {
        state = state || new SemantrisGameState();

        const next = new SemantrisGameState(state);

        // ゲームパラメータの初期化
        next.gameMode = gameMode;
        next.streakMax = decideStreakMax(state);
        next.wordLevel = decideWordLevel(state);
        next.targetNum = decideTargetNum(state);
        next.targetBorder = decideTargetBorder(state);
        next.fillBorder = decideFillBorder(state);
        next.dieBorder = decideDieBorder(state);
        next.fallFrame = decideFallFrame(state);
        next.fillFrame = decideFillFrame(state);
        next.sortFrame = decideSortFrame(state);
        next.destroyFrame = decideDestroyFrame(state);
        next.streakFrame = decideStreakFrame(state);
        next.wordSelector = wordSelector;

        // ワードの初期化
        next.candidates = next.makeInitialWords();
        next.targets = next.candidates.slice(-next.targetNum);

        // プレイ可能状態にする
        next.innerState = SemantrisGameState.STATE_PLAY;

        return _(next, Class.FB_INIT);
    }

    static input(state, matchResults) {
        const next = new SemantrisGameState(state);
        next.innerState = SemantrisGameState.STATE_ANIM_SORT;

        // 判定結果によってワードを並び替え
        next.candidates = matchResults.map(r => r.toWord());
        next.targets = matchResults.filter(r => r.isTarget)
                                   .map(r => r.toWord());
        // 最もマッチしたターゲットワードのインデクス
        const index = matchResults.slice(0, next.targetBorder)
                                  .findIndex(r => r.isTarget);

        // ターゲットをボーダー以下にすることができたか
        if (typeof index !== 'undefined') {
            // ワードの破壊は別途 destroy() から行われる
            return _(next, Class.FB_INPUT_SUCCESS);
        } else {
            // 失敗
            next.failCount++;
            next.streakProgress = 0;
            return _(next, Class.FB_INPUT_FAIL);
        }
    }

    static _destroyStreak(state) {
        const next = new SemantrisGameState(state);
        next.streakCount++;

        next.breakLine += rest.length;
        rest.length = 0;

        next.breakCount += next.targetIndexes.length;
        next.targetIndexes.length = 0;
        
        next.innerState = SemantrisGameState.STATE_ANIM_STREAK;
        return _(next, Class.FB_DESTROY_STREAK);
    }

    static _destroyNormal(state) {
        const next = new SemantrisGameState(state);
        const first = next.targetIndexes.shift();
        const rest = next.candidates; // 破壊的に更新するのでコピー不要

        next.breakCount++;
        for (let i = Math.min(next.targetBorder, rest.length) - 1; i >= first; --i) {
            if (i === first || !rest[i].isTarget) {
                next.breakLine++;
                rest.splice(i, 1);
                next.targetIndexes = next.targetIndexes.map(i => i - 1);
            } else {
                // 他のターゲットも同時に含まれた場合
                // それは消さずに残す（連鎖するため）
            }
        }
        ++next.streakProgress;

        next.innerState = SemantrisGameState.STATE_ANIM_DESTROY;
        return _(next, Class.FB_DESTROY_NORMAL);
    }

    static _destroyFinish(state) {
        const next = new SemantrisGameState(state);
        next.innerState = SemantrisGameState.STATE_PLAY; // ウェイト終了、プレイ状態に戻す
        return _(next, Class.FB_DESTROY_FINISH);
    }

    static destroy(state) {
        const first = state.targetIndexes[0];
        
        // TODO: ゲームパラメータの更新タイミング

        if (state.streakProgress === state.streakMax) {
            // Streak Bonus で全消し
            return Class._destroyStreak(state);
        } else if (typeof first === 'number' && first < state.targetBorder) {
            // 通常のライン消し
            return Class._destroyNormal(state);
        } else {
            // 更新終了
            return Class._destroyFinish(state);
        }
    }

    static _tickFill(next) {
        next.candidates.push(next.makeWord());

        // ターゲットは fill 領域の最後（上部）に来る
        const fillSpace = next.fillBorder - next.height;
        const targetNeeds = next.targetNum - next.targets.length;
        if (fillSpace <= targetNeeds) {
            next.targetIndexes.push(next.height - 1);
        }
        return _(next, Class.FB_TICK_FILL);
    }
    static _tickFall(next) {
        next.candidates.push(next.makeWord());

        // ターゲット不足していたらターゲットとして追加
        const targetNeeds = next.targetNum - next.targets.length;
        if (targetNeeds > 0) {
            next.targetIndexes.push(next.height - 1);
        }
        return _(next, Class.FB_TICK_FALL);
    }
    static _tickPlaying(next) {
        if (next.currentTime % next.fillFrame === 0 &&
            next.height < next.fillBorder) {
            // fill 領域はスピーディに埋まる
            return Class._tickFill(next);
        } else if (next.currentTime % next.fallFrame === 0) {
            if (next.height < next.dieBorder) {
                // その後はのんびり追加されていく
                return Class._tickFall(next);
            } else {
                // 上まで積もったら死
                next.innerState = SemantrisGameState.STATE_DEAD;
                return _(next, Class.FB_TICK_DIE);
            }
        } else {
            return _(next, Class.FB_TICK);
        }
    }
    static _tickWaiting(next) {
        let frame;

        switch (next.innerState) {
        case SemantrisGameState.STATE_ANIM_SORT:
            frame = next.sortFrame;
            break;
        case SemantrisGameState.STATE_ANIM_DESTROY:
            frame = next.destroyFrame;
            break;
        case SemantrisGameState.STATE_ANIM_STREAK:
            frame = next.streakFrame;
            break;
        default:
            throw new Error("unknown state");
        }

        if (next.stateTime >= frame) {
            return Class.destroy(next);
        } else {
            return _(next, Class.FB_TICK);
        }
    }

    static tick(state) {
        const next = new SemantrisGameState(state);
        next.currentTime++;

        if (next.isPlaying) {
            return Class._tickPlaying(next);
        } else if (next.isGameOver) {
            return [state, Class.FB_TICK_DIE]; // 状態更新しない
        } else {
            return Class._tickWaiting(next);
        }
    }
}

const Class = SemantrisGameUpdater;

function stateToData(state, table) {
    if (state.stage > table.length - 1) {
        state.stage = table.length - 1;
    }
    return table[state.stage];
}

function decideStreakMax(state) {
    return stateToData(state, [
        5, // 0
        5, // 500
        7, // 1000
        7, // 1500
        8, // 2000
        8, // 2500
        10, // 3000
        10, // 3500
        10, // 4000
        12, // 4500
        15, // 5000
        15, // 5500
        15, // 6000
        15, // 6500
        18, // 7000
        18, // 7500
        20, // 8000
        20, // 8500
        20, // 9000
        20, // 9500
        20, // 10000
    ]);
}

function decideWordLevel(state) {
    return stateToData(state, [
        [1], // 0
        [2], // 500
        [2], // 1000
        [2, 3], // 1500
        [1, 2, 3], // 2000
        [3, 4], // 2500
        [2, 3, 4], // 3000
        [2, 3, 4], // 3500
        [3, 4, 5], // 4000
        [2, 3, 4, 5], // 4500
        [1, 2, 3, 4, 5], // 5000
    ]);
}

function decideTargetNum(state) {
    return stateToData(state, [
        1, // 0
        1, // 500
        2, // 1000
        2, // 1500
        2, // 2000
        2, // 2500
        3, // 3000
    ]);
}

function decideTargetBorder(state) {
    if (10 <= state.stage && state.stage < 20) {
        return 5;
    } else {
        return 4;
    }
}

function decideFillBorder(state) {
    return 10; // TEMP
}

function decideDieBorder(state) {
    return 25; // TEMP
}

function decideFillFrame(state) {
    return 5; // TEMP
}

function decideFallFrame(state) {
    return 120; // TEMP
}

function decideSortFrame(state) {
    return 30; // TEMP
}

function decideDestroyFrame(state) {
    return 30; // TEMP
}

function decideStreakFrame(state) {
    return 90; // TEMP
}

export default SemantrisGameUpdater;