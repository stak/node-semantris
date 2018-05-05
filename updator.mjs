import SemantrisGameState from './state';

class UpdateResult {
    constructor(next, feedback, cont) {
        this.next = next;
        this.feedback = feedback;
        this.cont = cont;
    }
}
function _(next, feedback, cont) {
    return new UpdateResult(next, feedback, cont);
}

class SemantrisGameUpdator {
    static get FB_INIT() { return 'init'; }
    static get FB_DESTROY_FINISH() { return 'destroyed'; }
    static get FB_DESTROY_NORMAL() { return 'destroy'; }
    static get FB_DESTROY_STREAK() { return 'streak'; }
    static get FB_INPUT_SUCCESS() { return 'success'; }
    static get FB_INPUT_FAIL() { return 'fail'; }

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

        // ワードの初期化
        next.candidates = wordSelector(decideFillBorder(state),
                                       decideWordLevel(state));
        const head = decideFillBorder(state) - decideTargetNum(state);
        next.targetIndexes = Array(decideTargetNum(state)).fill()
                             .map((e, i) => head + i);

        return _(next, Class.FB_INIT);
    }

    static input(state, matchResults) {
        const next = new SemantrisGameState(state);

        // 判定結果によってワードを並び替え
        next.candidates = matchResults.map(r => r.toWord());
        next.targetIndexes = matchResults.filter(r => r.isTarget)
                                         .map(r => matchResults.findIndex(rr => r === rr));
        // 最もマッチしたターゲットワードのインデクス
        const index = matchResults.slice(0, next.targetBorder)
                                  .findIndex(r => r.isTarget);

        // ターゲットをボーダー以下にすることができたか
        if (typeof index !== 'undefined') {
            next.innerState = SemantrisGameState.STATE_ANIM;
            // ワードの破壊、スコア加算は別途 destroy() で行う
            return _(next, Class.FB_INPUT_SUCCESS, Class.destroy.name);
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
        
        next.innerState = SemantrisGameState.STATE_PLAY;
        return _(next, Class.FB_DESTROY_STREAK);
    }

    static _destroyNormal(state) {
        const next = new SemantrisGameState(state);
        const first = next.targetIndexes[0] || next.dieBorder;
        const rest = next.candidates; // 破壊的に更新するのでコピー不要

        next.targetIndexes.shift();
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

        // 次の連鎖が発生するか見て内部状態を更新
        const isFinish = Class.destroy(next).feedback 
                         === Class.FB_DESTROY_FINISH;
        next.innerState = isFinish ?
                            SemantrisGameState.STATE_PLAY: // 打ち止め
                            SemantrisGameState.STATE_ANIM; // 連鎖中
        
        return _(next, Class.FB_DESTROY_NORMAL,
                 !isFinish ? Class.destroy.name : null);
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
            // 更新なし
            return _(state, Class.FB_DESTROY_FINISH);
        }
    }

    static tick(state, ellapsedTime) {

    }
}

const Class = SemantrisGameUpdator;

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

function decideFallFrame(state) {
    return 120; // TEMP
}

export default SemantrisGameUpdator;