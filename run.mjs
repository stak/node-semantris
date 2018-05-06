import Semantris from './';
import {line} from './util';

new Semantris().start().then(async (game) => {
    for (let input;;) {
        try {
            input = await line();
        } catch (e) {
            break;
        }
        if (game.state.isGameOver) {
            break;
        }
        if (input) {
            await game.input(input);
        } else {
            game.renderer(game.state);
        }
    }
    process.exit();
});