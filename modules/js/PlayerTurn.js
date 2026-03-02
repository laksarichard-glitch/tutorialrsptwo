/**
 * We create one State class per declared state on the PHP side, to handle all state specific code here.
 * onEnteringState, onLeavingState and onPlayerActivationChange are predefined names that will be called by the framework.
 * When executing code in this state, you can access the args using this.args
 */
export class PlayerTurn {
  constructor(game, bga) {
    this.game = game;
    this.bga = bga;
  }

  /**
   * This method is called each time we are entering the game state. You can use this method to perform some user interface changes at this moment.
   */
  onEnteringState(args, isCurrentPlayerActive) {
    this.bga.statusBar.setTitle(
      isCurrentPlayerActive
        ? _("${you} must play a card or pass")
        : _("${actplayer} must play a card or pass"),
    );

    if (isCurrentPlayerActive) {
      const playableCardsIds = args.playableCardsIds; // returned by the PlayerTurn::getArgs

      // Add test action buttons in the action status bar, simulating a card click:
      playableCardsIds.forEach((cardId) =>
        this.bga.statusBar.addActionButton(
          _("Play card with id ${card_id}").replace("${card_id}", cardId),
          () => this.onCardClick(cardId),
        ),
      );

      this.bga.statusBar.addActionButton(
        _("Pass"),
        () => this.bga.actions.performAction("actPass"),
        { color: "secondary" },
      );
    }
  }

  /**
   * This method is called each time we are leaving the game state. You can use this method to perform some user interface changes at this moment.
   */
  onLeavingState(args, isCurrentPlayerActive) {}

  /**
   * This method is called each time the current player becomes active or inactive in a MULTIPLE_ACTIVE_PLAYER state. You can use this method to perform some user interface changes at this moment.
   * on MULTIPLE_ACTIVE_PLAYER states, you may want to call this function in onEnteringState using `this.onPlayerActivationChange(args, isCurrentPlayerActive)` at the end of onEnteringState.
   * If your state is not a MULTIPLE_ACTIVE_PLAYER one, you can delete this function.
   */
  onPlayerActivationChange(args, isCurrentPlayerActive) {}

  onCardClick(card_id) {
    console.log("onCardClick", card_id);

    this.bga.actions
      .performAction("actPlayCard", {
        card_id,
      })
      .then(() => {
        // What to do after the server call if it succeeded
        // (most of the time, nothing, as the game will react to notifs / change of state instead, so you can delete the `then`)
      });
  }
}
