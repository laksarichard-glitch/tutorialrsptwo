<?php

declare(strict_types=1);

namespace Bga\Games\tutorialrsptwo\States;

use Bga\Games\tutorialrsptwo\Game;
use Bga\GameFramework\StateType;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\States\GameState;
use Bga\GameFramework\SystemException;

class PlayerTurn extends GameState
{
    public function __construct(protected Game $game)
    {
        parent::__construct(
            $game,
            id: 31,
            type: StateType::ACTIVE_PLAYER, // This state type means that one player is active and can do actions
            description: clienttranslate('${actplayer} eg ${actplayer} must play a card'), // We tell OTHER players what they are waiting for
            descriptionMyTurn: clienttranslate('${you} must play a card'), // We tell the ACTIVE player what they must do
            // We suround the code with clienttranslate() so that the text is sent to the client for translation (this will enable the game to support other languages)
        );
    }



    #[PossibleAction]
    public function actPlayCard(int $cardId, int $activePlayerId)
    {
        $game = $this->game;

        $game->notify->all('xxx', "card check for card id $cardId");
        $game->notify->all('xxx', "card check for active id $activePlayerId");

        // rules check
        $card = $game->cards->getCard($cardId);

        $game->notify->all('xxx', 'location ' . $card['location']);

        if (!$card) {
            throw new SystemException("Invalid move");
        }
        // Rule checks

        // Check that player has this card in hand - should not happen if client is well implemented, but better to check
        if ($card['location'] != "hand") {
            throw new SystemException(clienttranslate($card['location']));
        }

        // Rule checks
        $playable_cards = $game->getPlayableCards($activePlayerId, $game);
        if (!in_array($cardId, $playable_cards)) {
            $value_displayed = $game->card_types['types'][$card['type_arg']]['name'];
            $color_displayed = $game->card_types['suites'][$card['type']]['name'];

            $game->notify->all('xxx', "Error : You cannot play the $value_displayed $color_displayed card now!");
            return $this;
        } else {
            $currenttrick_color = $game->getGameStateValue('trick_color');
            $game->notify->all('xxx', 'current trick color ' . $currenttrick_color);
            if ($currenttrick_color == 0) {
                // No suit to follow, any card can be played
                // Set the trick color if it hasn't been set yet
                $this->game->setGameStateValue('trick_color', $card['type']);
                $game->notify->all('xxx', 'set  trick color to ' . $card['type']);
            }

            $game->cards->moveCard($cardId, 'cardsontable', $activePlayerId);

            // And notify
            $game->notify->all(
                'playCard',
                clienttranslate('${player_name} plays ${value_displayed} ${color_displayed}'),
                [
                    'i18n' => array('color_displayed', 'value_displayed'),
                    'card' => $card,
                    'player_id' => $activePlayerId,
                    'player_name' => $game->getPlayerNameById($activePlayerId),
                    'value_displayed' => $game->card_types['types'][$card['type_arg']]['name'],
                    'color_displayed' => $game->card_types['suites'][$card['type']]['name']
                ]
            );
            return NextPlayer::class;
        }
    }

    /**
     * Game state arguments, example content.
     *
     * This method returns some additional information that is very specific to the `PlayerTurn` game state.
     */
    public function getArgs(int $activePlayerId): array
    {
        $game = $this->game;
        return [
            "playableCardsIds" => $this->game->getPlayableCards($activePlayerId, $game),
        ];
    }

    public function zombie(int $playerId)
    {
        $game = $this->game;
        $playable_cards = $this->game->getPlayableCards($playerId, $game);
        $zombieChoice = $this->getRandomZombieChoice($playable_cards); // random choice over possible moves
        return $this->actPlayCard((int)$zombieChoice, $playerId);
    }
}
