<?php

declare(strict_types=1);

namespace Bga\Games\tutorialrsptwo\States;

use Bga\GameFramework\Actions\Debug as ActionsDebug;
use Bga\GameFramework\Debug;
use Bga\Games\tutorialrsptwo\Game;
use Bga\GameFramework\StateType;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\States\GameState;

class PlayerTurn extends GameState
{
    public function __construct(protected Game $game)
    {
        parent::__construct(
            $game,
            id: 31,
            type: StateType::ACTIVE_PLAYER, // This state type means that one player is active and can do actions
            description: clienttranslate('${actplayer} must play a card'), // We tell OTHER players what they are waiting for
            descriptionMyTurn: clienttranslate('${you} must play a card'), // We tell the ACTIVE player what they must do
            // We suround the code with clienttranslate() so that the text is sent to the client for translation (this will enable the game to support other languages)
        );
    }

    #[PossibleAction]
    public function actPlayCard(int $cardId, int $activePlayerId)
    {

        $game = $this->game;
        $game->cards->moveCard($cardId, 'cardsontable', $activePlayerId);
        // TODO: check rules here
        $currentCard = $game->cards->getCard($cardId);
        // And notify
        $game->notify->all(
            'playCard',
            clienttranslate('${player_name} plays ${value_displayed} ${color_displayed}'),
            [
                'i18n' => array('color_displayed', 'value_displayed'),
                'card' => $currentCard,
                'player_id' => $activePlayerId,
                'player_name' => $game->getPlayerNameById($activePlayerId),
                'value_displayed' => $game->card_types['types'][$currentCard['type_arg']]['name'],
                'color_displayed' => $game->card_types['suites'][$currentCard['type']]['name']
            ]
        );
        return NextPlayer::class;
    }

    /**
     * Game state arguments, example content.
     *
     * This method returns some additional information that is very specific to the `PlayerTurn` game state.
     */
    public function getArgs(): array
    {
        // Get some values from the current game situation from the database.

        return [
            "playableCardsIds" => [1, 2],
        ];
    }

    public function zombie(int $playerId)
    {
        $game = $this->game;
        // Auto-play a random card from player's hand
        $cards_in_hand = $game->cards->getCardsInLocation('hand', $playerId);
        if (count($cards_in_hand) > 0) {
            $card_to_play = $cards_in_hand[array_rand($cards_in_hand)];
            $game->cards->moveCard($card_to_play['id'], 'cardsontable', $playerId);
            // Notify
            $game->notify->all(
                'playCard',
                clienttranslate('${player_name} auto plays ${value_displayed} ${color_displayed}'),
                [
                    'i18n' => array('color_displayed', 'value_displayed'),
                    'card' => $card_to_play,
                    'player_id' => $playerId,
                    'value_displayed' => $game->card_types['types'][$card_to_play['type_arg']]['name'],
                    'color_displayed' => $game->card_types['suites'][$card_to_play['type']]['name']
                ]
            );
        }
        return NextPlayer::class;
    }
}
