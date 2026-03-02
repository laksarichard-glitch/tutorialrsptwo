<?php

declare(strict_types=1);

namespace Bga\Games\tutorialrsptwo\States;

use Bga\GameFramework\StateType;
use Bga\Games\tutorialrsptwo\Game;
use Bga\GameFramework\States\GameState;

class NextPlayer extends GameState
{
    public function __construct(protected Game $game)
    {
        parent::__construct(
            $game,
            id: 32,
            type: StateType::GAME,
        );
    }

    public function onEnteringState()
    {
        $game = $this->game;
        // Active next player OR end the trick and go to the next trick OR end the hand
        if ($game->cards->countCardInLocation('cardsontable') == 4) {
            // This is the end of the trick
            // Select the winner
            $best_value_player_id = $game->activeNextPlayer(); // TODO figure out winner of trick

            // Move all cards to "cardswon" of the given player
            $game->cards->moveAllCardsInLocation('cardsontable', 'cardswon', null, $best_value_player_id);

            if ($game->cards->countCardInLocation('hand') == 0) {
                // End of the hand
                return EndHand::class;
            } else {
                // End of the trick
                // Reset trick suite to 0 
                $this->game->setGameStateInitialValue('trick_color', 0);
                return PlayerTurn::class;
            }
        } else {
            // Standard case (not the end of the trick)
            // => just active the next player
            $player_id = $game->activeNextPlayer();
            $game->giveExtraTime($player_id);
            return PlayerTurn::class;
        }
    }
}
