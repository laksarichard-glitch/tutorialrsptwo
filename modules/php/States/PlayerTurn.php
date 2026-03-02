<?php

declare(strict_types=1);

namespace Bga\Games\tutorialrsptwo\States;

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

    #[PossibleAction] // a PHP attribute that tells BGA "this method describes a possible action that the player could take", so that you can call that action from the front (the client)
    public function actPlayCard(int $cardId, int $activePlayerId)
    {
        throw new \BgaUserException('Not implemented: ${player_id} played card ${card_id}', args: [
            'player_id' => $activePlayerId,
            'card_id' => $cardId,
        ]);
        return NextPlayer::class; // after the action, we move to the next player
    }

    public function zombie(int $playerId)
    {
        // We must implement this so BGA can auto play in the case a player becomes a zombie, but for this tutorial we won't handle this case
        throw new \BgaUserException('Not implemented: zombie for player ${player_id}', args: [
            'player_id' => $playerId,
        ]);
    }
}
