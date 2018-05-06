import fetch from 'node-fetch';
import {GAMEMODE_ARCADE,
        GAMEMODE_BLOCKS,
        Word,
        MatchResult} from './define';

const BASE_URI = 'https://research.google.com/semantris/';
const DEFAULT_WHITELIST = 'curated23';

const RES_FIELD = {
    start: {
        leaderboardToken: 2,
        wordSet: 5
    },
    rank: {
        result: 0,
        input: 5,
        requestId: 6
    }
};

export default class SemantrisAPI {
    constructor(whitelistIndex, leaderboardToken) {
        this.whitelistIndex = whitelistIndex || DEFAULT_WHITELIST;
        this.leaderboardToken = leaderboardToken || null;
        this.requestId = 1;
    }

    request(api, bodyObject) {
        const uri = BASE_URI + api;
        const body = JSON.stringify(bodyObject);
        const method = 'POST';
        const cache = 'no-cache';
        const headers = {
            'Accept': '*/*',
            'Content-Type': 'text/plain;charset=UTF-8',
            'Cache': 'no-cache',
            'Referer': 'https://research.google.com/semantris',
            'Origin': 'https://research.google.com'
        };

        return fetch(uri, {method, cache, headers, body});
    }

    async start(gameMode) {
        try {
            const res = await this.request('start', this.makeStartBody(gameMode));
            if (res.ok) {
                const json = await res.json();
                const rawWordSet = json[RES_FIELD.start.wordSet];
                const wordSet = rawWordSet.map(w => new Word(w));

                ++this.requestId;
                return wordSet;
            } else {
                throw new Error('start api error');
            }
        } catch (e) {
            throw new Error(e);
        }
    }

    async rank(input, candidates, targets, gameMode) {
        try {
            const res = await this.request('rank', this.makeRankBody(input, candidates, targets, gameMode));
            if (res.ok) {
                const json = await res.json();
                const rawResult = json[RES_FIELD.rank.result];
                const result = rawResult.map(r => new MatchResult(r, input, candidates, targets));

                ++this.requestId;
                return result;
            } else {
                throw new Error('start api error');
            }
        } catch (e) {
            throw new Error(e);
        }
    }

    checkGameMode(gameMode) {
        switch (gameMode) {
            case GAMEMODE_ARCADE:
            case GAMEMODE_BLOCKS:
                break;
            default:
                throw new Error('unknown gameMode');
        }
    }

    makeStartBody(gameMode) {
        this.checkGameMode(gameMode);
        return [
            null,
            this.leaderboardToken,
            null,
            this.whitelistIndex,
            this.requestId,
            gameMode
        ];
    }

    makeRankBody(input, candidates, targets, gameMode) {
        this.checkGameMode(gameMode);

        return [
            this.whitelistIndex,
            input,
            null,
            candidates.map(c => c.word),
            targets.map(t => t.word),
            null,
            null,
            this.gameMode,
            this.requestId
        ];
    }

    clearRequestId() {
        this.requestId = 1;
    }
}
