import SemantrisGameState from './state';
import {FB} from './define';
import SementrisParamTuner from './paramTuner';

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
    constructor (opts = {}) {
        const defaultOpts = {
            paramTuner: SementrisParamTuner,
            wordSelector: null,
        };
        Object.assign(this, defaultOpts, opts);
    }

    _updateGameParams(state, params) {
        const defaultParams = [
            'streakMax',
            'wordLevel',
            'targetNum',
            'targetBorder',
            'fillBorder',
            'dieBorder',
            'fallFrame',
            'fillFrame',
            'sortFrame',
            'destroyFrame',
            'streakFrame',
        ];
        (params || defaultParams).forEach(param => {
            state[param] = this.paramTuner[param](state);
        });
    }

    _makeWord(state) {
        return this.wordSelector(state.wordLevel, state.candidates.map(c => c.word));
    }

    init(state, gameMode) {
        state = state || new SemantrisGameState();

        const next = new SemantrisGameState(state);

        // ゲームパラメータの初期化
        this._updateGameParams(next);
        next.gameMode = gameMode;

        // ワードの初期化
        next.candidates = [];
        next.targets = [];

        // プレイ可能状態にする
        next.innerState = SemantrisGameState.STATE_PLAY;

        return _(next, FB.INIT);
    }

    input(state, matchResults) {
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
        if (index >= 0) {
            // ワードの破壊は別途 destroy() から行われる
            return _(next, FB.INPUT_SUCCESS);
        } else {
            // 失敗
            next.failCount++;
            next.streakProgress = 0;
            return _(next, FB.INPUT_FAIL);
        }
    }

    _destroyStreak(state) {
        const next = new SemantrisGameState(state);
        next.streakCount++;
        next.streakProgress = 0;

        // streakMax だけは当該ボーナスの得点は含まないので先に計算する
        this._updateGameParams(next, ['streakMax']);
        const cache = next.streakMax;

        next.breakLine += next.height;
        next.breakCount += next.targetIndexes.length;
        next.candidates = [];
        next.targetIndexes = [];

        this._updateGameParams(next);
        next.streakMax = cache;
        
        next.innerState = SemantrisGameState.STATE_PLAY;
        return _(next, FB.DESTROY_STREAK);
    }

    _destroyNormal(state) {
        const next = new SemantrisGameState(state);
        const first = next.targetIndexes.shift();
        const rest = next.candidates; // 破壊的に更新するのでコピー不要

        next.breakCount++;
        for (let i = Math.min(next.targetBorder, rest.length) - 1; i >= first; --i) {
            if (i === first || !next.targetIndexes.includes(i)) {
                next.breakLine++;
                rest.splice(i, 1);
                next.targetIndexes = next.targetIndexes.map(i => i - 1);
            } else {
                // 他のターゲットも同時に含まれた場合
                // それは消さずに残す（連鎖するため）
            }
        }

        this._updateGameParams(next);
        // streakMax は通常破壊時には更新しない
        next.streakMax = state.streakMax;

        if (++next.streakProgress === next.streakMax) {
            // 全消しが控えている場合
            // 待機時間が異なり、その間追加ワードが降ってこない状態
            next.innerState = SemantrisGameState.STATE_ANIM_STREAK;
        } else if (next.targetIndexes.length && next.targetIndexes[0] < next.targetBorder) {
            // 破壊の連鎖中、追加ワードは降ってくるが新規入力は保留とする状態
            next.innerState = SemantrisGameState.STATE_ANIM_CHAIN;
        } else {
            // 破壊終了
            next.innerState = SemantrisGameState.STATE_PLAY;
        }
        
        return _(next, FB.DESTROY_NORMAL);
    }

    _destroyFinish(state) {
        const next = new SemantrisGameState(state);
        next.innerState = SemantrisGameState.STATE_PLAY; // ウェイト終了、プレイ状態に戻す
        return _(next, FB.DESTROY_FINISH);
    }

    _destroy(state) {
        const first = state.targetIndexes[0];
        
        if (state.streakProgress === state.streakMax) {
            // Streak Bonus で全消し
            return this._destroyStreak(state);
        } else if (typeof first === 'number' && first < state.targetBorder) {
            // 通常のライン消し
            return this._destroyNormal(state);
        } else {
            // 更新終了
            return this._destroyFinish(state);
        }
    }

    _tickFill(next) {
        next.candidates.push(this._makeWord(next));

        // ターゲットは fill 領域の最後（上部）に来る
        const fillSpace = next.fillBorder - next.height;
        const targetNeeds = next.targetNum - next.targets.length;
        if (fillSpace < targetNeeds) {
            next.targetIndexes.push(next.height - 1);
        }
        return _(next, FB.TICK_FILL);
    }
    _tickFall(next) {
        next.candidates.push(this._makeWord(next));

        // ターゲット不足していたらターゲットとして追加
        const targetNeeds = next.targetNum - next.targets.length;
        if (targetNeeds > 0) {
            next.targetIndexes.push(next.height - 1);
        }
        return _(next, FB.TICK_FALL);
    }
    _tickPlaying(next) {
        if (next.currentTime % next.fillFrame === 0 &&
            next.height < next.fillBorder) {
            // fill 領域はスピーディに埋まる
            return this._tickFill(next);
        } else if (next.currentTime % next.fallFrame === 0) {
            if (next.height < next.dieBorder) {
                // その後はのんびり追加されていく
                return this._tickFall(next);
            } else {
                // 上まで積もったら死
                next.innerState = SemantrisGameState.STATE_DEAD;
                return _(next, FB.TICK_DIE);
            }
        } else {
            return _(next, FB.TICK);
        }
    }
    _tickWaiting(next) {
        let frame;

        switch (next.innerState) {
        case SemantrisGameState.STATE_ANIM_SORT:
            frame = next.sortFrame;
            break;
        case SemantrisGameState.STATE_ANIM_CHAIN:
            frame = next.destroyFrame;
            break;
        case SemantrisGameState.STATE_ANIM_STREAK:
            frame = next.streakFrame;
            break;
        default:
            throw new Error("unknown state");
        }

        if (next.stateTime >= frame) {
            return this._destroy(next);
        } else {
            return _(next, FB.TICK);
        }
    }

    tick(state) {
        const next = new SemantrisGameState(state);
        next.currentTime++;

        if (next.isGameOver || next.isInit) {
            return _(state, FB.NONE); // 何もしない
        }
        // TODO: destroy 待ち中にも fill はくる
        // TODO: destroy 後に target ひとつもない場合 fill 範囲外でもターゲットが即くる
        let result = null;
        if (next.isAnimating) {
            result = this._tickWaiting(next);
            // ウェイトを進めて、何か起こっていればそれで確定
            if (result.feedback !== FB.TICK) {
                return result;
            }
            // 単にウェイト待ちであれば、
        }
        if (next.isActive) {
            // _tickWaiting() の結果より _tickPlaying() の結果を優先
            result = this._tickPlaying(next);
        }
        return result;
    }
}

export default SemantrisGameUpdater;