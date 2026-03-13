<?php

declare(strict_types=1);

namespace Bga\Games\tutorialrsptwo\States;

use Bga\Games\tutorialrsptwo\Game;
use Bga\GameFramework\StateType;
use Bga\GameFramework\States\GameState;

class NewHand extends GameState
{
    public function __construct(protected Game $game)
    {
        parent::__construct(
            $game,
            id: 2, // the idea of the state
            type: StateType::GAME, // This type means that no player is active, and the game will automatically progress
            updateGameProgression: true, // entering this state can update the progress bar of the game
        );
    }

    // The action we do when entering the state
    public function onEnteringState()
    {

        $game = $this->game;

        $game->notify->all('xxx', 'new hand starts');

        // Take back all cards (from any location => null) to deck
        // $game->cards->moveAllCardsInLocation('cardswon', "deck");
        $game->cards->moveAllCardsInLocation(null, "deck");
        $game->cards->shuffle('deck');

        $game->notify->all('xxx', 'shuffled');

        // Deal 13 cards to each players
        // Create deck, shuffle it and give 13 initial cards
        $players = $game->loadPlayersBasicInfos();

        foreach ($players as $player_id => $player) {
            $game->notify->all('xxx', "in player loop for player $player_id");
            $cards = $game->cards->pickCards(13, 'deck', $player_id);
            $game->notify->all('xxx', 'cards ', array('cards' => $cards));
            // Notify player about his cards
            $this->bga->notify->player($player_id, 'newHand', '', array('cards' => $cards));
        }

        // reset trick color
        $this->game->setGameStateInitialValue('trick_color', 0);
        $game->notify->all('xxx', 'Newhand - reset trick color ');

        // FIXME: first player one with 2 of clubs
        $first_player = $this->game->getUniqueValueFromDb("
            SELECT 
                card_location_arg 
            FROM
                card 
            WHERE 
                card_location = 'hand' AND 
                card_type = 3 AND 
                card_type_arg = 2
                ");

        $game->notify->all('xxx', " first player $first_player");

        $this->game->gamestate->changeActivePlayer($first_player);
        return PlayerTurn::class;
    }
}
